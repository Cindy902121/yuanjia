-- B2B 管理角色與商品工作狀態。
--
-- app_admins.role 是 server-side 管理 API 的授權來源；不要使用 user_metadata。
-- b2b_products.status 是商品狀態的唯一來源，is_active 僅保留相容欄位。

begin;

alter table public.app_admins
  add column role text not null default 'admin';

alter table public.app_admins
  add constraint app_admins_role_check
  check (role in ('admin', 'business_staff'));

create index app_admins_role_active_idx
  on public.app_admins (role, is_active);

-- B2C media remains an admin-only surface; business_staff is B2B-only.
create or replace function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = (select auth.uid())
      and role = 'admin'
      and is_active = true
  );
$$;

alter table public.b2b_products
  add column status text;

update public.b2b_products
set status = case when is_active then 'published' else 'offline' end
where status is null;

alter table public.b2b_products
  alter column status set default 'draft',
  alter column status set not null;

alter table public.b2b_products
  add constraint b2b_products_status_check
  check (status in ('draft', 'review', 'published', 'offline'));

create index b2b_products_status_updated_idx
  on public.b2b_products (status, updated_at desc);

create or replace function public.sync_b2b_product_active()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.is_active := new.status = 'published';
  return new;
end;
$$;

revoke execute on function public.sync_b2b_product_active() from public, anon, authenticated;

drop trigger if exists b2b_products_sync_active on public.b2b_products;
create trigger b2b_products_sync_active
before insert or update of status on public.b2b_products
for each row execute function public.sync_b2b_product_active();

-- B2B 前台只能看到 published 商品；既有 policy 名稱保留以降低 migration drift。
drop policy if exists "b2b_active_products_company_read" on public.b2b_products;
create policy "b2b_active_products_company_read"
on public.b2b_products for select to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.companies company
    where company.auth_user_id = (select auth.uid())
      and company.is_active = true
  )
);

drop policy if exists "b2b_active_product_tags_company_read" on public.b2b_product_tags;
create policy "b2b_active_product_tags_company_read"
on public.b2b_product_tags for select to authenticated
using (
  exists (
    select 1
    from public.companies company
    join public.b2b_products product on product.status = 'published'
    join public.b2b_tags tag on tag.is_active = true
    where company.auth_user_id = (select auth.uid())
      and company.is_active = true
      and product.id = b2b_product_tags.product_id
      and tag.id = b2b_product_tags.tag_id
  )
);

drop policy if exists "b2b_active_spec_options_company_read" on public.b2b_product_spec_options;
create policy "b2b_active_spec_options_company_read"
on public.b2b_product_spec_options for select to authenticated
using (
  is_active
  and exists (
    select 1
    from public.companies company
    where company.auth_user_id = (select auth.uid())
      and company.is_active = true
  )
  and exists (
    select 1
    from public.b2b_products product
    where product.id = b2b_product_spec_options.product_id
      and product.status = 'published'
  )
);

drop policy if exists "b2b_active_product_images_company_read" on public.b2b_product_images;
create policy "b2b_active_product_images_company_read"
on public.b2b_product_images for select to authenticated
using (
  exists (
    select 1
    from public.b2b_products product
    where product.id = b2b_product_images.product_id
      and product.status = 'published'
  )
  and exists (
    select 1
    from public.companies company
    where company.auth_user_id = (select auth.uid())
      and company.is_active = true
  )
);

-- CSV 批量新增保留原本「可直接進型錄」的行為，明確寫入 published。
create or replace function public.admin_insert_b2b_products_batch(items jsonb)
returns table (id uuid, product_code text)
language sql
set search_path = ''
as $$
  insert into public.b2b_products (
    product_code,
    name,
    brand,
    category,
    specification,
    packaging,
    origin,
    storage_method,
    description,
    status
  )
  select
    row_data.product_code,
    row_data.name,
    row_data.brand,
    row_data.category,
    row_data.specification,
    row_data.packaging,
    row_data.origin,
    row_data.storage_method,
    row_data.description,
    'published'
  from jsonb_to_recordset(items) as row_data(
    product_code text,
    name text,
    brand text,
    category text,
    specification text,
    packaging text,
    origin text,
    storage_method text,
    description text
  )
  returning public.b2b_products.id, public.b2b_products.product_code;
$$;

revoke execute on function public.admin_insert_b2b_products_batch(jsonb)
from public, anon, authenticated;
grant execute on function public.admin_insert_b2b_products_batch(jsonb)
to service_role;

create or replace function public.admin_bulk_update_b2b_product_status(
  product_ids uuid[],
  next_status text
)
returns table (id uuid, status text, updated_at timestamptz)
language plpgsql
set search_path = ''
as $$
declare
  requested_count integer;
  existing_count integer;
begin
  if next_status not in ('draft', 'review', 'published', 'offline') then
    raise exception 'invalid B2B product status' using errcode = '22023';
  end if;

  requested_count := coalesce(cardinality(product_ids), 0);
  if requested_count = 0 then
    raise exception 'product_ids cannot be empty' using errcode = '22023';
  end if;

  select count(*) into existing_count
  from public.b2b_products
  where id = any(product_ids);
  if existing_count <> requested_count then
    raise exception 'one or more B2B products do not exist' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.b2b_products product
    where product.id = any(product_ids)
      and not (
        (product.status = 'draft' and next_status = 'review')
        or (product.status = 'review' and next_status in ('draft', 'published'))
        or (product.status = 'published' and next_status = 'offline')
        or (product.status = 'offline' and next_status = 'published')
      )
  ) then
    raise exception 'invalid B2B product status transition' using errcode = '22023';
  end if;

  return query
  update public.b2b_products
  set status = next_status
  where id = any(product_ids)
  returning public.b2b_products.id, public.b2b_products.status, public.b2b_products.updated_at;
end;
$$;

revoke execute on function public.admin_bulk_update_b2b_product_status(uuid[], text)
from public, anon, authenticated;
grant execute on function public.admin_bulk_update_b2b_product_status(uuid[], text)
to service_role;

commit;

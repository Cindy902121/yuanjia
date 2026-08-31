-- 管理後台商品內容、圖片與 B2B CSV 批量新增的資料契約。
--
-- 所有管理寫入仍經由 Next.js server route 使用 service_role；
-- anon／authenticated 不取得這些表的寫入權限。

begin;

create table if not exists public.b2c_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null
    references public.b2c_products (id) on delete cascade,
  storage_path text not null unique,
  image_role text not null
    constraint b2c_product_images_role_check check (image_role in ('cover', 'detail')),
  alt_text text not null
    constraint b2c_product_images_alt_not_blank check (length(trim(alt_text)) > 0),
  sort_order integer not null default 0
    constraint b2c_product_images_sort_order_check check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, sort_order)
);

create unique index if not exists b2c_product_images_one_cover_idx
  on public.b2c_product_images (product_id)
  where image_role = 'cover';

create index if not exists b2c_product_images_product_order_idx
  on public.b2c_product_images (product_id, sort_order, id);

drop trigger if exists b2c_product_images_set_updated_at on public.b2c_product_images;
create trigger b2c_product_images_set_updated_at
before update on public.b2c_product_images
for each row execute function public.set_updated_at();

create table if not exists public.b2b_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null
    references public.b2b_products (id) on delete cascade,
  storage_path text not null unique,
  image_role text not null
    constraint b2b_product_images_role_check check (image_role in ('cover', 'detail')),
  alt_text text not null
    constraint b2b_product_images_alt_not_blank check (length(trim(alt_text)) > 0),
  sort_order integer not null default 0
    constraint b2b_product_images_sort_order_check check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, sort_order)
);

create unique index if not exists b2b_product_images_one_cover_idx
  on public.b2b_product_images (product_id)
  where image_role = 'cover';

create index if not exists b2b_product_images_product_order_idx
  on public.b2b_product_images (product_id, sort_order, id);

drop trigger if exists b2b_product_images_set_updated_at on public.b2b_product_images;
create trigger b2b_product_images_set_updated_at
before update on public.b2b_product_images
for each row execute function public.set_updated_at();

alter table public.b2c_product_images enable row level security;
alter table public.b2b_product_images enable row level security;

revoke all on table public.b2c_product_images, public.b2b_product_images
from anon, authenticated;

grant select on table public.b2c_product_images, public.b2b_product_images
to authenticated;
grant select on table public.b2c_product_images to anon;
grant all on table public.b2c_product_images, public.b2b_product_images
to service_role;

drop policy if exists "b2c_active_product_images_public_read" on public.b2c_product_images;
create policy "b2c_active_product_images_public_read"
on public.b2c_product_images for select to anon, authenticated
using (
  exists (
    select 1
    from public.b2c_products product
    where product.id = b2c_product_images.product_id
      and product.is_active = true
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
      and product.is_active = true
  )
  and exists (
    select 1
    from public.companies company
    where company.auth_user_id = (select auth.uid())
      and company.is_active = true
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'b2c-media',
    'b2c-media',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'b2b-media',
    'b2b-media',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  )
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- The server-only batch route calls this invoker function with service_role.
-- The function call is a single PostgreSQL transaction: one bad row rolls back all rows.
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
    is_active
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
    true
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

commit;

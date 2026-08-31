-- 修正既有 B2B 批次狀態 RPC 的 PL/pgSQL id 欄位歧義。

begin;

-- Keep B2C Storage policies restricted to the admin role after business_staff exists.
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
  from public.b2b_products product
  where product.id = any(product_ids);
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
  update public.b2b_products product
  set status = next_status
  where product.id = any(product_ids)
  returning product.id, product.status, product.updated_at;
end;
$$;

revoke execute on function public.admin_bulk_update_b2b_product_status(uuid[], text)
from public, anon, authenticated;
grant execute on function public.admin_bulk_update_b2b_product_status(uuid[], text)
to service_role;

commit;

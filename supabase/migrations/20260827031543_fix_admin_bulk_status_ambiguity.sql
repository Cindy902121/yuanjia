-- Fix the output-column ambiguity in the B2B bulk status RPC.

begin;

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
  from public.b2b_products as product
  where product.id = any(product_ids);
  if existing_count <> requested_count then
    raise exception 'one or more B2B products do not exist' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.b2b_products as product
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
  update public.b2b_products as product
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

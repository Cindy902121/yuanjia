-- Replace B2B product tags in one database transaction so an insert failure
-- cannot leave the product without its previous tag relations.

begin;

create or replace function public.admin_replace_b2b_product_tags(
  p_product_id uuid,
  p_tag_ids uuid[]
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.b2b_product_tags as relation
  where relation.product_id = p_product_id;

  insert into public.b2b_product_tags (product_id, tag_id)
  select p_product_id, input.tag_id
  from unnest(coalesce(p_tag_ids, '{}'::uuid[])) as input(tag_id)
  group by input.tag_id;
end;
$$;

revoke execute on function public.admin_replace_b2b_product_tags(uuid, uuid[])
from public, anon, authenticated;
grant execute on function public.admin_replace_b2b_product_tags(uuid, uuid[])
to service_role;

commit;

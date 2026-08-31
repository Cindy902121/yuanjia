-- Tighten API privileges before expanding the B2C catalog schema.

revoke all on table public.companies from anon, authenticated;
revoke all on table public.customer_prefix_rules from anon, authenticated;
revoke all on table public.app_admins from anon, authenticated;
revoke all on table public.b2c_products from anon, authenticated;
revoke all on table public.b2b_products from anon, authenticated;
revoke all on table public.b2c_tags from anon, authenticated;
revoke all on table public.b2b_tags from anon, authenticated;
revoke all on table public.b2c_product_tags from anon, authenticated;
revoke all on table public.b2b_product_tags from anon, authenticated;
revoke all on table public.rfqs from anon, authenticated;
revoke all on table public.rfq_items from anon, authenticated;
revoke all on table public.mock_orders from anon, authenticated;
revoke all on table public.mock_order_items from anon, authenticated;
revoke all on table public.analytics_events from anon, authenticated;

grant select on table public.b2c_products to anon, authenticated;
grant select on table public.b2c_tags to anon, authenticated;
grant select on table public.b2c_product_tags to anon, authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

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
      and is_active = true
  );
$$;

revoke all on function private.is_active_admin() from public, anon;
grant execute on function private.is_active_admin() to authenticated, service_role;

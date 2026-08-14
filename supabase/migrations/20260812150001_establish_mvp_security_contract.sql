-- 元家 MVP：資料 API、RLS 與 analytics 安全契約。
--
-- 前提：本檔必須排在 schema-only baseline
-- 20260812150000_baseline_remote_schema.sql 之後。
--
-- 遠端既有 schema 的 migration history 為空時，先將 baseline 標記為 applied，
-- 再發布本檔；不得直接對既有遠端重播 baseline。
--
-- 設計原則：
--   * B2C 型錄僅允許讀取 active 資料。
--   * B2B 型錄只提供給有 active company identity 的 authenticated user。
--   * B2B 詢價只能讀取自己的 company_id 資料。
--   * 任何訂單、分析與管理寫入都經由已驗證的 server-side service_role API；
--     不直接授予 anon／authenticated 寫入權限。
--   * analytics 只保存約定的 24 個 event_name。

-- 所有 public table 都是可能被 Data API 暴露的表，必須啟用 RLS。
alter table public.companies enable row level security;
alter table public.customer_prefix_rules enable row level security;
alter table public.app_admins enable row level security;
alter table public.b2c_products enable row level security;
alter table public.b2b_products enable row level security;
alter table public.b2c_tags enable row level security;
alter table public.b2b_tags enable row level security;
alter table public.b2c_product_tags enable row level security;
alter table public.b2b_product_tags enable row level security;
alter table public.b2b_rfqs enable row level security;
alter table public.b2b_rfq_items enable row level security;
alter table public.b2c_orders enable row level security;
alter table public.b2c_order_items enable row level security;
alter table public.analytics_events enable row level security;

-- Data API privilege boundary. Row-level rules appear below.
revoke all on table public.companies, public.customer_prefix_rules,
  public.app_admins, public.b2c_products, public.b2b_products,
  public.b2c_tags, public.b2b_tags, public.b2c_product_tags,
  public.b2b_product_tags, public.b2b_rfqs, public.b2b_rfq_items,
  public.b2c_orders, public.b2c_order_items, public.analytics_events
from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

grant select on table public.b2c_products, public.b2c_tags,
  public.b2c_product_tags to anon, authenticated;

grant select on table public.companies, public.b2b_products,
  public.b2b_tags, public.b2b_product_tags, public.b2b_rfqs,
  public.b2b_rfq_items to authenticated;

-- Server-only routes use service_role after authenticating and authorizing the request.
grant all on table public.companies, public.customer_prefix_rules,
  public.app_admins, public.b2c_products, public.b2b_products,
  public.b2c_tags, public.b2b_tags, public.b2c_product_tags,
  public.b2b_product_tags, public.b2b_rfqs, public.b2b_rfq_items,
  public.b2c_orders, public.b2c_order_items, public.analytics_events
to service_role;

-- This trigger function is not an application endpoint.
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Replace temporary public B2C policies with the reviewed set.
drop policy if exists "public can read active b2c products" on public.b2c_products;
drop policy if exists "public can read active b2c tags" on public.b2c_tags;
drop policy if exists "public can read active b2c product tags" on public.b2c_product_tags;
drop policy if exists "b2c_active_products_public_read" on public.b2c_products;
drop policy if exists "b2c_active_tags_public_read" on public.b2c_tags;
drop policy if exists "b2c_active_product_tags_public_read" on public.b2c_product_tags;
drop policy if exists "companies_active_identity_read" on public.companies;
drop policy if exists "b2b_active_products_company_read" on public.b2b_products;
drop policy if exists "b2b_active_tags_company_read" on public.b2b_tags;
drop policy if exists "b2b_active_product_tags_company_read" on public.b2b_product_tags;
drop policy if exists "b2b_rfqs_own_company_read" on public.b2b_rfqs;
drop policy if exists "b2b_rfq_items_own_company_read" on public.b2b_rfq_items;

create policy "b2c_active_products_public_read"
on public.b2c_products for select to anon, authenticated
using (is_active = true);

create policy "b2c_active_tags_public_read"
on public.b2c_tags for select to anon, authenticated
using (is_active = true);

create policy "b2c_active_product_tags_public_read"
on public.b2c_product_tags for select to anon, authenticated
using (
  exists (
    select 1
    from public.b2c_products product
    join public.b2c_tags tag on tag.id = b2c_product_tags.tag_id
    where product.id = b2c_product_tags.product_id
      and product.is_active = true
      and tag.is_active = true
  )
);

create policy "companies_active_identity_read"
on public.companies for select to authenticated
using (auth_user_id = (select auth.uid()) and is_active = true);

create policy "b2b_active_products_company_read"
on public.b2b_products for select to authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.companies company
    where company.auth_user_id = (select auth.uid())
      and company.is_active = true
  )
);

create policy "b2b_active_tags_company_read"
on public.b2b_tags for select to authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.companies company
    where company.auth_user_id = (select auth.uid())
      and company.is_active = true
  )
);

create policy "b2b_active_product_tags_company_read"
on public.b2b_product_tags for select to authenticated
using (
  exists (
    select 1
    from public.companies company
    join public.b2b_products product on product.is_active = true
    join public.b2b_tags tag on tag.is_active = true
    where company.auth_user_id = (select auth.uid())
      and company.is_active = true
      and product.id = b2b_product_tags.product_id
      and tag.id = b2b_product_tags.tag_id
  )
);

create policy "b2b_rfqs_own_company_read"
on public.b2b_rfqs for select to authenticated
using (
  company_id in (
    select company.id
    from public.companies company
    where company.auth_user_id = (select auth.uid())
      and company.is_active = true
  )
);

create policy "b2b_rfq_items_own_company_read"
on public.b2b_rfq_items for select to authenticated
using (
  exists (
    select 1
    from public.b2b_rfqs rfq
    join public.companies company on company.id = rfq.company_id
    where rfq.id = b2b_rfq_items.rfq_id
      and company.auth_user_id = (select auth.uid())
      and company.is_active = true
  )
);

-- The allowed event names are enforced even for server-side inserts.
alter table public.analytics_events
  drop constraint if exists analytics_events_event_name_not_blank;
alter table public.analytics_events
  drop constraint if exists analytics_events_event_name_allowed;
alter table public.analytics_events
  add constraint analytics_events_event_name_allowed check (
    event_name in (
      'b2b_login_success',
      'b2b_catalog_view',
      'b2b_product_view',
      'b2b_search_filter',
      'b2b_product_finder_start',
      'b2b_product_finder_answer',
      'b2b_product_finder_complete',
      'b2b_product_finder_result_click',
      'b2b_rfq_add',
      'b2b_rfq_submit',
      'b2c_product_view',
      'b2c_search_category',
      'b2c_tag_click',
      'b2c_tag_view',
      'b2c_help_widget_open',
      'b2c_product_finder_start',
      'b2c_product_finder_answer',
      'b2c_product_finder_complete',
      'b2c_product_finder_result_click',
      'b2c_line_click',
      'b2c_ai_demo_open',
      'b2c_cart_add',
      'b2c_checkout_start',
      'b2c_mock_order_created'
    )
  );

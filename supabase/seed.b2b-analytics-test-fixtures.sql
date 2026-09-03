-- 元家 B2B Analytics 報表測試 fixture（選用）
--
-- 只供本機或隔離測試資料庫使用，不併入 supabase/seed.sql，也不要對正式資料庫執行。
-- 先套用 seed.b2b-test-fixtures.sql，再用 scripts/provision-b2b-isolation-fixture.mjs
-- 將 W483038 綁定到本機測試 Auth user；本檔不建立 Auth user、不保存密碼。
--
-- 這組資料只使用 W483038 與現有展示商品，建立兩個 session、完整十種 B2B 事件、
-- 兩筆 RFQ 與三筆 RFQ 明細，供 Admin Analytics 報表與篩選手動驗收。

begin;

do $$
begin
  if not exists (
    select 1
    from public.companies
    where client_code = 'W483038'
      and is_active = true
      and auth_user_id is not null
  ) then
    raise exception using
      message = 'W483038 must be an active company bound to a local test Auth user before applying the Analytics fixture';
  end if;

  if (
    select count(*)
    from public.b2b_products
    where product_code in ('B2B-FISH-001', 'B2B-FISH-003')
  ) <> 2 then
    raise exception using
      message = 'Run supabase/seed.sql before applying the Analytics fixture';
  end if;

  if (
    select count(*)
    from public.b2b_product_spec_options
    where option_code in (
      'B2B-FISH-001-200G',
      'B2B-FISH-001-300G',
      'B2B-FISH-003-DEFAULT'
    )
  ) <> 3 then
    raise exception using
      message = 'The B2B specification options are missing; run the current migrations and supabase/seed.sql first';
  end if;
end;
$$;

-- 只重置本 fixture 自己的資料，保留其他測試與展示資料。
delete from public.analytics_events
where surface = 'b2b'
  and session_id like 'fixture-b2b-analytics-%';

delete from public.b2b_rfq_items item
using public.b2b_rfqs rfq
where item.rfq_id = rfq.id
  and rfq.total_note in (
    'fixture:b2b-analytics:rfq-1',
    'fixture:b2b-analytics:rfq-2'
  );

delete from public.b2b_rfqs
where total_note in (
  'fixture:b2b-analytics:rfq-1',
  'fixture:b2b-analytics:rfq-2'
);

insert into public.b2b_rfqs (
  company_id,
  status,
  total_note,
  customer_tier_snapshot,
  channel_snapshot,
  created_at,
  updated_at
)
select company.id,
  fixture.status,
  fixture.total_note,
  rule.tier_label,
  rule.channel_label,
  fixture.created_at,
  fixture.created_at
from public.companies company
join public.customer_prefix_rules rule on rule.prefix = 'W' and rule.is_active = true
cross join (
  values
    ('new'::text, 'fixture:b2b-analytics:rfq-1'::text, '2026-08-25 01:08:30+00'::timestamptz),
    ('processing'::text, 'fixture:b2b-analytics:rfq-2'::text, '2026-08-27 01:03:30+00'::timestamptz)
) as fixture(status, total_note, created_at)
where company.client_code = 'W483038';

insert into public.b2b_rfq_items (
  rfq_id,
  product_id,
  specification_option_id,
  specification_text_snapshot,
  packaging_text_snapshot,
  quantity,
  unit,
  item_note
)
select rfq.id,
  product.id,
  option.id,
  option.specification_text,
  option.packaging_text,
  fixture.quantity,
  '箱',
  'Analytics fixture 測試明細'
from (
  values
    ('fixture:b2b-analytics:rfq-1'::text, 'B2B-FISH-001'::text, 'B2B-FISH-001-200G'::text, 12::numeric),
    ('fixture:b2b-analytics:rfq-1'::text, 'B2B-FISH-001'::text, 'B2B-FISH-001-300G'::text, 6::numeric),
    ('fixture:b2b-analytics:rfq-2'::text, 'B2B-FISH-003'::text, 'B2B-FISH-003-DEFAULT'::text, 8::numeric)
) as fixture(total_note, product_code, option_code, quantity)
join public.b2b_rfqs rfq on rfq.total_note = fixture.total_note
join public.b2b_products product on product.product_code = fixture.product_code
join public.b2b_product_spec_options option
  on option.option_code = fixture.option_code
 and option.product_id = product.id;

with fixture_events(event_name, session_id, occurred_at, product_code, event_data) as (
  values
    ('b2b_login_success', 'fixture-b2b-analytics-20260825-01', '2026-08-25 01:00:00+00'::timestamptz, null::text, '{}'::jsonb),
    ('b2b_catalog_view', 'fixture-b2b-analytics-20260825-01', '2026-08-25 01:01:00+00'::timestamptz, null::text, '{}'::jsonb),
    ('b2b_product_view', 'fixture-b2b-analytics-20260825-01', '2026-08-25 01:02:00+00'::timestamptz, 'B2B-FISH-001', '{}'::jsonb),
    ('b2b_search_filter', 'fixture-b2b-analytics-20260825-01', '2026-08-25 01:03:00+00'::timestamptz, null::text, jsonb_build_object(
      'filter_type', 'tag',
      'selected_option_ids', jsonb_build_array('b2b-fish'),
      'result_count', 3
    )),
    ('b2b_product_finder_start', 'fixture-b2b-analytics-20260825-01', '2026-08-25 01:04:00+00'::timestamptz, null::text, '{}'::jsonb),
    ('b2b_product_finder_answer', 'fixture-b2b-analytics-20260825-01', '2026-08-25 01:05:00+00'::timestamptz, null::text, jsonb_build_object(
      'question_key', 'tag',
      'option_id', 'b2b-fish'
    )),
    ('b2b_product_finder_complete', 'fixture-b2b-analytics-20260825-01', '2026-08-25 01:06:00+00'::timestamptz, null::text, '{}'::jsonb),
    ('b2b_product_finder_result_click', 'fixture-b2b-analytics-20260825-01', '2026-08-25 01:07:00+00'::timestamptz, 'B2B-FISH-001', jsonb_build_object(
      'product_id', (select id::text from public.b2b_products where product_code = 'B2B-FISH-001')
    )),
    ('b2b_rfq_add', 'fixture-b2b-analytics-20260825-01', '2026-08-25 01:08:00+00'::timestamptz, 'B2B-FISH-001', jsonb_build_object(
      'product_id', (select id::text from public.b2b_products where product_code = 'B2B-FISH-001')
    )),
    ('b2b_rfq_submit', 'fixture-b2b-analytics-20260825-01', '2026-08-25 01:09:00+00'::timestamptz, null::text, jsonb_build_object(
      'rfq_id', (select id::text from public.b2b_rfqs where total_note = 'fixture:b2b-analytics:rfq-1')
    )),
    ('b2b_login_success', 'fixture-b2b-analytics-20260827-02', '2026-08-27 01:00:00+00'::timestamptz, null::text, '{}'::jsonb),
    ('b2b_catalog_view', 'fixture-b2b-analytics-20260827-02', '2026-08-27 01:01:00+00'::timestamptz, null::text, '{}'::jsonb),
    ('b2b_product_view', 'fixture-b2b-analytics-20260827-02', '2026-08-27 01:02:00+00'::timestamptz, 'B2B-FISH-003', '{}'::jsonb),
    ('b2b_rfq_add', 'fixture-b2b-analytics-20260827-02', '2026-08-27 01:03:00+00'::timestamptz, 'B2B-FISH-003', jsonb_build_object(
      'product_id', (select id::text from public.b2b_products where product_code = 'B2B-FISH-003')
    )),
    ('b2b_rfq_submit', 'fixture-b2b-analytics-20260827-02', '2026-08-27 01:04:00+00'::timestamptz, null::text, jsonb_build_object(
      'rfq_id', (select id::text from public.b2b_rfqs where total_note = 'fixture:b2b-analytics:rfq-2')
    ))
)
insert into public.analytics_events (
  event_name,
  surface,
  product_reference,
  product_category,
  product_brand,
  customer_tier_snapshot,
  channel_snapshot,
  occurred_at,
  actor_user_id,
  company_id,
  session_id,
  customer_code_snapshot,
  event_data
)
select fixture.event_name,
  'b2b',
  product.id,
  product.category,
  product.brand,
  rule.tier_label,
  rule.channel_label,
  fixture.occurred_at,
  company.auth_user_id,
  company.id,
  fixture.session_id,
  company.client_code,
  fixture.event_data
from fixture_events fixture
join public.companies company on company.client_code = 'W483038'
join public.customer_prefix_rules rule on rule.prefix = 'W' and rule.is_active = true
left join public.b2b_products product on product.product_code = fixture.product_code;

commit;

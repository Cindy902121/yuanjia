-- B2B 行為分析：伺服器衍生身份、結構化事件資料、資料庫聚合與匯出稽核。
--
-- 原始事件不提供給前端或 CSV；Admin 報表只透過本檔的 service_role RPC 讀取聚合結果。

begin;

alter table public.analytics_events
  add column actor_user_id uuid references auth.users (id) on delete set null,
  add column company_id uuid references public.companies (id) on delete set null,
  add column session_id text,
  add column customer_code_snapshot text,
  add column event_data jsonb not null default '{}'::jsonb;

alter table public.analytics_events
  add constraint analytics_events_event_data_object
  check (jsonb_typeof(event_data) = 'object'),
  add constraint analytics_events_session_id_length
  check (session_id is null or length(session_id) between 1 and 128),
  add constraint analytics_events_customer_code_snapshot_format
  check (customer_code_snapshot is null or customer_code_snapshot ~ '^[ZEW][0-9]{6}$'),
  add constraint analytics_events_b2c_identity_empty
  check (
    surface = 'b2b'
    or (
      actor_user_id is null
      and company_id is null
      and session_id is null
      and customer_code_snapshot is null
    )
  );

create index analytics_events_b2b_occurred_at_idx
  on public.analytics_events (occurred_at desc)
  where surface = 'b2b';
create index analytics_events_b2b_company_occurred_at_idx
  on public.analytics_events (company_id, occurred_at desc)
  where surface = 'b2b';
create index analytics_events_actor_user_id_idx
  on public.analytics_events (actor_user_id);
create index analytics_events_company_id_idx
  on public.analytics_events (company_id);
create index analytics_events_b2b_session_occurred_at_idx
  on public.analytics_events (session_id, occurred_at desc)
  where surface = 'b2b';
create index analytics_events_b2b_filter_type_idx
  on public.analytics_events ((event_data ->> 'filter_type'))
  where surface = 'b2b';
create index analytics_events_b2b_finder_question_idx
  on public.analytics_events ((event_data ->> 'question_key'))
  where surface = 'b2b';

create table public.analytics_export_audits (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users (id) on delete restrict,
  purpose text not null
    constraint analytics_export_audits_purpose_check
    check (purpose in ('operations_analysis', 'customer_service', 'audit', 'other')),
  note text,
  query_scope jsonb not null default '{}'::jsonb
    constraint analytics_export_audits_query_scope_object_check
    check (jsonb_typeof(query_scope) = 'object'),
  file_format text not null default 'csv'
    constraint analytics_export_audits_file_format_check
    check (file_format = 'csv'),
  row_count integer not null default 0
    constraint analytics_export_audits_row_count_check
    check (row_count >= 0),
  created_at timestamptz not null default now()
);

create index analytics_export_audits_admin_created_at_idx
  on public.analytics_export_audits (admin_user_id, created_at desc);

alter table public.analytics_export_audits enable row level security;
revoke all on table public.analytics_export_audits from public, anon, authenticated;
grant all on table public.analytics_export_audits to service_role;

-- 報表查詢只在資料庫內做聚合，且函式採 invoker；只有 server-side service_role 可執行。
create or replace function public.admin_b2b_analytics_summary(
  p_date_from timestamptz,
  p_date_to timestamptz,
  p_grain text default 'day',
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language sql
set search_path = ''
as $$
  with filtered_events as (
    select event.*
    from public.analytics_events as event
    where event.surface = 'b2b'
      and (p_date_from is null or event.occurred_at >= p_date_from)
      and (p_date_to is null or event.occurred_at < p_date_to)
      and (
        coalesce(p_filters -> 'tiers', '[]'::jsonb) = '[]'::jsonb
        or event.customer_tier_snapshot in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'tiers', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'channels', '[]'::jsonb) = '[]'::jsonb
        or event.channel_snapshot in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'channels', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'products', '[]'::jsonb) = '[]'::jsonb
        or event.product_reference::text in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'products', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'categories', '[]'::jsonb) = '[]'::jsonb
        or event.product_category in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'categories', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'brands', '[]'::jsonb) = '[]'::jsonb
        or event.product_brand in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'brands', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'event_names', '[]'::jsonb) = '[]'::jsonb
        or event.event_name in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'event_names', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'filter_types', '[]'::jsonb) = '[]'::jsonb
        or event.event_data ->> 'filter_type' in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'filter_types', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'finder_questions', '[]'::jsonb) = '[]'::jsonb
        or event.event_data ->> 'question_key' in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'finder_questions', '[]'::jsonb))
        )
      )
  ),
  -- 舊事件沒有新身份欄位，只保留在 filtered_events 的總事件數；其他指標從 cutover 後事件計算。
  eligible_events as (
    select event.*
    from filtered_events as event
    where event.actor_user_id is not null
      and event.company_id is not null
      and event.session_id is not null
      and event.customer_code_snapshot is not null
  ),
  event_totals as (
    select
      (select count(*) from filtered_events)::integer as events,
      (select count(distinct company_id) from eligible_events)::integer as active_companies,
      (select count(distinct actor_user_id) from eligible_events)::integer as active_users,
      (select count(distinct session_id) from eligible_events)::integer as active_sessions,
      coalesce(round(
        (select count(*) from eligible_events)::numeric /
        nullif((select count(distinct company_id) from eligible_events), 0),
        2
      ), 0) as avg_events_per_active_company
  ),
  event_name_counts as (
    select event_name, count(*)::integer as events,
      count(distinct company_id)::integer as active_companies,
      count(distinct session_id)::integer as active_sessions
    from eligible_events
    group by event_name
  ),
  trend_counts as (
    select
      case
        when coalesce(p_grain, 'day') = 'month' then date_trunc('month', occurred_at at time zone 'Asia/Taipei')::date
        when coalesce(p_grain, 'day') = 'week' then date_trunc('week', occurred_at at time zone 'Asia/Taipei')::date
        else (occurred_at at time zone 'Asia/Taipei')::date
      end as bucket,
      count(*)::integer as events,
      count(distinct company_id)::integer as active_companies,
      count(distinct session_id)::integer as active_sessions
    from eligible_events
    group by 1
  ),
  tier_counts as (
    select
      coalesce(nullif(trim(customer_tier_snapshot), ''), 'unclassified') as raw_label,
      count(*)::integer as events,
      count(distinct company_id)::integer as active_companies,
      count(distinct session_id)::integer as active_sessions
    from eligible_events
    group by 1
  ),
  tier_grouped as (
    select
      case
        when raw_label = 'unclassified' then '未分類'
        when active_companies < 5 then '其他（已遮罩）'
        else raw_label
      end as label,
      sum(events)::integer as events,
      sum(active_companies)::integer as active_companies,
      sum(active_sessions)::integer as active_sessions
    from tier_counts
    group by 1
  ),
  channel_counts as (
    select
      coalesce(nullif(trim(channel_snapshot), ''), 'unclassified') as raw_label,
      count(*)::integer as events,
      count(distinct company_id)::integer as active_companies,
      count(distinct session_id)::integer as active_sessions
    from eligible_events
    group by 1
  ),
  channel_grouped as (
    select
      case
        when raw_label = 'unclassified' then '未分類'
        when active_companies < 5 then '其他（已遮罩）'
        else raw_label
      end as label,
      sum(events)::integer as events,
      sum(active_companies)::integer as active_companies,
      sum(active_sessions)::integer as active_sessions
    from channel_counts
    group by 1
  ),
  finder_answer_counts_raw as (
    select
      event.event_data ->> 'question_key' as question_key,
      event.event_data ->> 'option_id' as option_id,
      count(*)::integer as events,
      count(distinct event.company_id)::integer as active_companies
    from eligible_events as event
    where event.event_name = 'b2b_product_finder_answer'
      and event.event_data ? 'question_key'
      and event.event_data ? 'option_id'
    group by event.event_data ->> 'question_key', event.event_data ->> 'option_id'
  ),
  finder_answer_counts as (
    select *
    from finder_answer_counts_raw
    where active_companies >= 5
    union all
    select
      event.event_data ->> 'question_key' as question_key,
      '其他（已遮罩）'::text as option_id,
      count(*)::integer as events,
      count(distinct event.company_id)::integer as active_companies
    from eligible_events as event
    where event.event_name = 'b2b_product_finder_answer'
      and event.event_data ? 'question_key'
      and event.event_data ? 'option_id'
      and exists (
        select 1
        from finder_answer_counts_raw as raw
        where raw.question_key = event.event_data ->> 'question_key'
          and raw.option_id = event.event_data ->> 'option_id'
          and raw.active_companies < 5
      )
    group by event.event_data ->> 'question_key'
  ),
  rfq_submit_events as (
    select
      event.id as event_id,
      event.company_id,
      event.event_data ->> 'rfq_id' as rfq_id
    from public.analytics_events as event
    where event.surface = 'b2b'
      and event.event_name = 'b2b_rfq_submit'
      and (p_date_from is null or event.occurred_at >= p_date_from)
      and (p_date_to is null or event.occurred_at < p_date_to)
      and (
        coalesce(p_filters -> 'tiers', '[]'::jsonb) = '[]'::jsonb
        or event.customer_tier_snapshot in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'tiers', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'channels', '[]'::jsonb) = '[]'::jsonb
        or event.channel_snapshot in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'channels', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'event_names', '[]'::jsonb) = '[]'::jsonb
        or 'b2b_rfq_submit' in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'event_names', '[]'::jsonb))
        )
      )
      and event.actor_user_id is not null
      and event.company_id is not null
      and event.session_id is not null
      and event.customer_code_snapshot is not null
  ),
  product_event_rows as (
    select distinct
      event.id as event_id,
      event.company_id,
      event.product_reference as product_id,
      event.event_name
    from eligible_events as event
    where event.product_reference is not null
    union
    select distinct
      submit.event_id,
      submit.company_id,
      item.product_id,
      'b2b_rfq_submit' as event_name
    from rfq_submit_events as submit
    join public.b2b_rfq_items as item on item.rfq_id::text = submit.rfq_id
    join public.b2b_products as product on product.id = item.product_id
    where (
      coalesce(p_filters -> 'products', '[]'::jsonb) = '[]'::jsonb
      or product.id::text in (
        select value from jsonb_array_elements_text(coalesce(p_filters -> 'products', '[]'::jsonb))
      )
    )
      and (
        coalesce(p_filters -> 'categories', '[]'::jsonb) = '[]'::jsonb
        or product.category in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'categories', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'brands', '[]'::jsonb) = '[]'::jsonb
        or product.brand in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'brands', '[]'::jsonb))
        )
      )
  ),
  product_counts_raw as (
    select
      event.product_id,
      product.product_code,
      product.name,
      product.category,
      product.brand,
      count(*)::integer as events,
      count(distinct event.company_id)::integer as active_companies,
      count(*) filter (where event.event_name = 'b2b_product_view')::integer as product_views,
      count(*) filter (where event.event_name = 'b2b_rfq_add')::integer as rfq_adds,
      count(*) filter (where event.event_name = 'b2b_rfq_submit')::integer as rfq_submits
    from product_event_rows as event
    join public.b2b_products as product on product.id = event.product_id
    group by event.product_id, product.product_code, product.name, product.category, product.brand
  ),
  product_counts as (
    select *
    from product_counts_raw
    where active_companies >= 5
    union all
    select
      null::uuid as product_id,
      null::text as product_code,
      '其他（已遮罩）'::text as name,
      null::text as category,
      null::text as brand,
      count(*)::integer as events,
      count(distinct event.company_id)::integer as active_companies,
      count(*) filter (where event.event_name = 'b2b_product_view')::integer as product_views,
      count(*) filter (where event.event_name = 'b2b_rfq_add')::integer as rfq_adds,
      count(*) filter (where event.event_name = 'b2b_rfq_submit')::integer as rfq_submits
    from product_event_rows as event
    where event.product_id in (
      select product_id from product_counts_raw where active_companies < 5
    )
    having count(*) > 0
  ),
  funnel_sessions as (
    select
      sessions.session_id,
      sessions.company_id,
      catalog.catalog_at,
      product.product_at,
      rfq_add.rfq_add_at,
      rfq_submit.rfq_submit_at,
      finder_start.finder_start_at,
      finder_answer.finder_answer_at,
      finder_complete.finder_complete_at,
      finder_result_click.finder_result_click_at
    from (
      select
        session_id,
        (array_agg(company_id order by occurred_at desc) filter (where company_id is not null))[1] as company_id
      from eligible_events
      where session_id is not null
      group by session_id
    ) as sessions
    left join lateral (
      select min(event.occurred_at) as catalog_at
      from eligible_events as event
      where event.session_id = sessions.session_id
        and event.event_name = 'b2b_catalog_view'
    ) as catalog on true
    left join lateral (
      select min(event.occurred_at) as product_at
      from eligible_events as event
      where event.session_id = sessions.session_id
        and catalog.catalog_at is not null
        and event.event_name = 'b2b_product_view'
        and event.occurred_at > catalog.catalog_at
    ) as product on true
    left join lateral (
      select min(event.occurred_at) as rfq_add_at
      from eligible_events as event
      where event.session_id = sessions.session_id
        and product.product_at is not null
        and event.event_name = 'b2b_rfq_add'
        and event.occurred_at > product.product_at
    ) as rfq_add on true
    left join lateral (
      select min(event.occurred_at) as rfq_submit_at
      from eligible_events as event
      where event.session_id = sessions.session_id
        and rfq_add.rfq_add_at is not null
        and event.event_name = 'b2b_rfq_submit'
        and event.occurred_at > rfq_add.rfq_add_at
    ) as rfq_submit on true
    left join lateral (
      select min(event.occurred_at) as finder_start_at
      from eligible_events as event
      where event.session_id = sessions.session_id
        and event.event_name = 'b2b_product_finder_start'
    ) as finder_start on true
    left join lateral (
      select min(event.occurred_at) as finder_answer_at
      from eligible_events as event
      where event.session_id = sessions.session_id
        and finder_start.finder_start_at is not null
        and event.event_name = 'b2b_product_finder_answer'
        and event.occurred_at > finder_start.finder_start_at
    ) as finder_answer on true
    left join lateral (
      select min(event.occurred_at) as finder_complete_at
      from eligible_events as event
      where event.session_id = sessions.session_id
        and finder_answer.finder_answer_at is not null
        and event.event_name = 'b2b_product_finder_complete'
        and event.occurred_at > finder_answer.finder_answer_at
    ) as finder_complete on true
    left join lateral (
      select min(event.occurred_at) as finder_result_click_at
      from eligible_events as event
      where event.session_id = sessions.session_id
        and finder_complete.finder_complete_at is not null
        and event.event_name = 'b2b_product_finder_result_click'
        and event.occurred_at > finder_complete.finder_complete_at
    ) as finder_result_click on true
  ),
  funnel_counts as (
    select
      count(*) filter (where catalog_at is not null)::integer as catalog_sessions,
      count(*) filter (where product_at is not null)::integer as product_sessions,
      count(*) filter (where rfq_add_at is not null)::integer as rfq_add_sessions,
      count(*) filter (where rfq_submit_at is not null)::integer as rfq_submit_sessions,
      count(distinct company_id) filter (where catalog_at is not null)::integer as catalog_companies,
      count(distinct company_id) filter (where product_at is not null)::integer as product_companies,
      count(distinct company_id) filter (where rfq_add_at is not null)::integer as rfq_add_companies,
      count(distinct company_id) filter (where rfq_submit_at is not null)::integer as rfq_submit_companies,
      count(*) filter (where finder_start_at is not null)::integer as finder_start_sessions,
      count(*) filter (where finder_answer_at is not null)::integer as finder_answer_sessions,
      count(*) filter (where finder_complete_at is not null)::integer as finder_complete_sessions,
      count(*) filter (where finder_result_click_at is not null)::integer as finder_result_click_sessions,
      count(distinct company_id) filter (where finder_start_at is not null)::integer as finder_start_companies,
      count(distinct company_id) filter (where finder_answer_at is not null)::integer as finder_answer_companies,
      count(distinct company_id) filter (where finder_complete_at is not null)::integer as finder_complete_companies,
      count(distinct company_id) filter (where finder_result_click_at is not null)::integer as finder_result_click_companies
    from funnel_sessions
  ),
  rfq_scope as (
    select rfq.id, rfq.company_id
    from public.b2b_rfqs as rfq
    where (p_date_from is null or rfq.created_at >= p_date_from)
      and (p_date_to is null or rfq.created_at < p_date_to)
      and (
        coalesce(p_filters -> 'tiers', '[]'::jsonb) = '[]'::jsonb
        or rfq.customer_tier_snapshot in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'tiers', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'channels', '[]'::jsonb) = '[]'::jsonb
        or rfq.channel_snapshot in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'channels', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'products', '[]'::jsonb) = '[]'::jsonb
        and coalesce(p_filters -> 'categories', '[]'::jsonb) = '[]'::jsonb
        and coalesce(p_filters -> 'brands', '[]'::jsonb) = '[]'::jsonb
        or exists (
          select 1
          from public.b2b_rfq_items as item
          join public.b2b_products as product on product.id = item.product_id
          where item.rfq_id = rfq.id
            and (
              coalesce(p_filters -> 'products', '[]'::jsonb) = '[]'::jsonb
              or product.id::text in (
                select value from jsonb_array_elements_text(coalesce(p_filters -> 'products', '[]'::jsonb))
              )
            )
            and (
              coalesce(p_filters -> 'categories', '[]'::jsonb) = '[]'::jsonb
              or product.category in (
                select value from jsonb_array_elements_text(coalesce(p_filters -> 'categories', '[]'::jsonb))
              )
            )
            and (
              coalesce(p_filters -> 'brands', '[]'::jsonb) = '[]'::jsonb
              or product.brand in (
                select value from jsonb_array_elements_text(coalesce(p_filters -> 'brands', '[]'::jsonb))
              )
            )
        )
      )
  ),
  rfq_items as (
    select scope.id as rfq_id, scope.company_id, item.product_id, item.quantity
    from rfq_scope as scope
    join public.b2b_rfq_items as item on item.rfq_id = scope.id
    join public.b2b_products as product on product.id = item.product_id
    where (
      coalesce(p_filters -> 'products', '[]'::jsonb) = '[]'::jsonb
      or product.id::text in (
        select value from jsonb_array_elements_text(coalesce(p_filters -> 'products', '[]'::jsonb))
      )
    )
      and (
        coalesce(p_filters -> 'categories', '[]'::jsonb) = '[]'::jsonb
        or product.category in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'categories', '[]'::jsonb))
        )
      )
      and (
        coalesce(p_filters -> 'brands', '[]'::jsonb) = '[]'::jsonb
        or product.brand in (
          select value from jsonb_array_elements_text(coalesce(p_filters -> 'brands', '[]'::jsonb))
        )
      )
  ),
  rfq_product_counts_raw as (
    select
      item.product_id,
      product.product_code,
      product.name,
      product.category,
      product.brand,
      count(distinct item.rfq_id)::integer as rfqs,
      count(distinct item.company_id)::integer as active_companies,
      count(*)::integer as line_items,
      coalesce(sum(item.quantity), 0) as requested_quantity
    from rfq_items as item
    join public.b2b_products as product on product.id = item.product_id
    group by item.product_id, product.product_code, product.name, product.category, product.brand
  ),
  rfq_product_counts as (
    select *
    from rfq_product_counts_raw
    where active_companies >= 5
    union all
    select
      null::uuid as product_id,
      null::text as product_code,
      '其他（已遮罩）'::text as name,
      null::text as category,
      null::text as brand,
      count(distinct item.rfq_id)::integer as rfqs,
      count(distinct item.company_id)::integer as active_companies,
      count(*)::integer as line_items,
      coalesce(sum(item.quantity), 0) as requested_quantity
    from rfq_items as item
    where item.product_id in (
      select product_id from rfq_product_counts_raw where active_companies < 5
    )
    having count(*) > 0
  ),
  rfq_totals as (
    select
      count(distinct scope.id)::integer as rfqs,
      count(distinct scope.company_id)::integer as active_companies,
      count(item.product_id)::integer as line_items,
      coalesce(sum(item.quantity), 0) as requested_quantity
    from rfq_scope as scope
    left join rfq_items as item on item.rfq_id = scope.id
  ),
  tier_options as (
    select distinct tier_label as value
    from public.customer_prefix_rules
    where is_active = true
    union
    select distinct coalesce(nullif(trim(customer_tier_snapshot), ''), 'unclassified')
    from public.analytics_events
    where surface = 'b2b'
  ),
  channel_options as (
    select distinct channel_label as value
    from public.customer_prefix_rules
    where is_active = true
    union
    select distinct coalesce(nullif(trim(channel_snapshot), ''), 'unclassified')
    from public.analytics_events
    where surface = 'b2b'
  ),
  filter_type_options as (
    select distinct event_data ->> 'filter_type' as value
    from public.analytics_events
    where surface = 'b2b' and event_data ? 'filter_type'
  ),
  finder_question_options as (
    select distinct event_data ->> 'question_key' as value
    from public.analytics_events
    where surface = 'b2b' and event_data ? 'question_key'
  )
  select jsonb_build_object(
    'totals', (select to_jsonb(event_totals) from event_totals),
    'events_by_name', coalesce((
      select jsonb_agg(to_jsonb(event_name_counts) order by events desc, event_name)
      from event_name_counts
    ), '[]'::jsonb),
    'trend', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date_bucket', bucket,
        'events', events,
        'active_companies', active_companies,
        'active_sessions', active_sessions
      ) order by bucket)
      from trend_counts
    ), '[]'::jsonb),
    'tier_breakdown', coalesce((
      select jsonb_agg(to_jsonb(tier_grouped) order by active_companies desc, label)
      from tier_grouped
    ), '[]'::jsonb),
    'channel_breakdown', coalesce((
      select jsonb_agg(to_jsonb(channel_grouped) order by active_companies desc, label)
      from channel_grouped
    ), '[]'::jsonb),
    'product_ranking', coalesce((
      select jsonb_agg(to_jsonb(product_counts) order by active_companies desc, events desc, product_code)
      from product_counts
    ), '[]'::jsonb),
    'finder_answers', coalesce((
      select jsonb_agg(to_jsonb(finder_answer_counts) order by question_key, events desc, option_id)
      from finder_answer_counts
    ), '[]'::jsonb),
    'funnels', jsonb_build_object(
      'main', jsonb_build_object(
        'sessions', jsonb_build_object(
          'catalog_view', (select catalog_sessions from funnel_counts),
          'product_view', (select product_sessions from funnel_counts),
          'rfq_add', (select rfq_add_sessions from funnel_counts),
          'rfq_submit', (select rfq_submit_sessions from funnel_counts)
        ),
        'companies', jsonb_build_object(
          'catalog_view', (select catalog_companies from funnel_counts),
          'product_view', (select product_companies from funnel_counts),
          'rfq_add', (select rfq_add_companies from funnel_counts),
          'rfq_submit', (select rfq_submit_companies from funnel_counts)
        )
      ),
      'finder', jsonb_build_object(
        'sessions', jsonb_build_object(
          'start', (select finder_start_sessions from funnel_counts),
          'answer', (select finder_answer_sessions from funnel_counts),
          'complete', (select finder_complete_sessions from funnel_counts),
          'result_click', (select finder_result_click_sessions from funnel_counts)
        ),
        'companies', jsonb_build_object(
          'start', (select finder_start_companies from funnel_counts),
          'answer', (select finder_answer_companies from funnel_counts),
          'complete', (select finder_complete_companies from funnel_counts),
          'result_click', (select finder_result_click_companies from funnel_counts)
        )
      )
    ),
    'rfq_summary', (select to_jsonb(rfq_totals) from rfq_totals),
    'rfq_product_ranking', coalesce((
      select jsonb_agg(to_jsonb(rfq_product_counts) order by active_companies desc, rfqs desc, product_code)
      from rfq_product_counts
    ), '[]'::jsonb),
    'options', jsonb_build_object(
      'tiers', coalesce((select jsonb_agg(value order by value) from tier_options), '[]'::jsonb),
      'channels', coalesce((select jsonb_agg(value order by value) from channel_options), '[]'::jsonb),
      'filter_types', coalesce((select jsonb_agg(value order by value) from filter_type_options where value is not null), '[]'::jsonb),
      'finder_questions', coalesce((select jsonb_agg(value order by value) from finder_question_options where value is not null), '[]'::jsonb),
      'products', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', product.id,
          'product_code', product.product_code,
          'name', product.name,
          'category', product.category,
          'brand', product.brand
        ) order by product.product_code)
        from public.b2b_products as product
      ), '[]'::jsonb)
    )
  );
$$;

revoke all on function public.admin_b2b_analytics_summary(timestamptz, timestamptz, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.admin_b2b_analytics_summary(timestamptz, timestamptz, text, jsonb)
  to service_role;

create or replace function public.cleanup_old_analytics_events(
  p_retention interval default interval '24 months'
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  deleted_count bigint;
begin
  delete from public.analytics_events
  where occurred_at < now() - p_retention;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_old_analytics_events(interval) from public, anon, authenticated;
grant execute on function public.cleanup_old_analytics_events(interval) to service_role;

-- 若專案已啟用 pg_cron，使用官方 schedule 函式建立每月清理；未啟用時保留同名函式供外部排程呼叫。
do $$
declare
  scheduled boolean;
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      execute 'create extension if not exists pg_cron';
      execute 'select exists (select 1 from cron.job where jobname = ''yuanjia_analytics_retention'')'
        into scheduled;
      if not scheduled then
        execute 'select cron.schedule($1, $2, $3)'
          using 'yuanjia_analytics_retention', '0 3 1 * *', 'select public.cleanup_old_analytics_events()';
      end if;
    exception when others then
      raise notice 'pg_cron is unavailable; call public.cleanup_old_analytics_events() from the deployment scheduler.';
    end;
  end if;
end;
$$;

commit;

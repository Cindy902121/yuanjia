-- Admin Analytics 擴充：常用篩選、排程匯出、異常告警與受控客戶明細。
-- 所有表與 RPC 僅供 server-side service_role 使用；前端只讀取 API 已聚合結果。

begin;

create table public.admin_analytics_saved_filters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_analytics_saved_filters_name_check
    check (length(trim(name)) between 1 and 80),
  constraint admin_analytics_saved_filters_scope_check
    check (jsonb_typeof(scope) = 'object')
);

create unique index admin_analytics_saved_filters_name_idx
  on public.admin_analytics_saved_filters (lower(name));

create table public.admin_analytics_schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  frequency text not null
    constraint admin_analytics_schedules_frequency_check
    check (frequency in ('daily', 'weekly', 'monthly')),
  time_local time not null,
  weekday smallint,
  month_day smallint,
  timezone text not null default 'Asia/Taipei'
    constraint admin_analytics_schedules_timezone_check
    check (timezone = 'Asia/Taipei'),
  query_scope jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_analytics_schedules_name_check
    check (length(trim(name)) between 1 and 80),
  constraint admin_analytics_schedules_weekday_check
    check (weekday is null or weekday between 0 and 6),
  constraint admin_analytics_schedules_month_day_check
    check (month_day is null or month_day between 1 and 31),
  constraint admin_analytics_schedules_query_scope_check
    check (jsonb_typeof(query_scope) = 'object'),
  constraint admin_analytics_schedules_pattern_check
    check (
      (frequency = 'daily' and weekday is null and month_day is null)
      or (frequency = 'weekly' and weekday is not null and month_day is null)
      or (frequency = 'monthly' and weekday is null and month_day is not null)
    )
);

create index admin_analytics_schedules_due_idx
  on public.admin_analytics_schedules (is_active, next_run_at);

create table public.admin_analytics_export_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references public.admin_analytics_schedules (id) on delete set null,
  triggered_by uuid references auth.users (id) on delete set null,
  status text not null default 'queued'
    constraint admin_analytics_export_runs_status_check
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  attempt integer not null default 0
    constraint admin_analytics_export_runs_attempt_check
    check (attempt >= 0),
  max_attempts integer not null default 3
    constraint admin_analytics_export_runs_max_attempts_check
    check (max_attempts between 1 and 3),
  scheduled_for timestamptz not null,
  query_scope jsonb not null default '{}'::jsonb,
  file_path text,
  file_name text,
  row_count integer not null default 0
    constraint admin_analytics_export_runs_row_count_check
    check (row_count >= 0),
  error_message text,
  next_retry_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_analytics_export_runs_query_scope_check
    check (jsonb_typeof(query_scope) = 'object')
);

create unique index admin_analytics_export_runs_schedule_slot_idx
  on public.admin_analytics_export_runs (schedule_id, scheduled_for)
  where schedule_id is not null;
create index admin_analytics_export_runs_queue_idx
  on public.admin_analytics_export_runs (status, next_retry_at, scheduled_for);
create index admin_analytics_export_runs_expiry_idx
  on public.admin_analytics_export_runs (expires_at)
  where expires_at is not null;

create table public.admin_analytics_alerts (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  scope_key text not null default 'global',
  status text not null default 'unread'
    constraint admin_analytics_alerts_status_check
    check (status in ('unread', 'acknowledged', 'recovered')),
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  acknowledged_by uuid references auth.users (id) on delete set null,
  acknowledged_at timestamptz,
  recovered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_analytics_alerts_rule_key_check
    check (length(trim(rule_key)) between 1 and 120),
  constraint admin_analytics_alerts_scope_key_check
    check (length(trim(scope_key)) between 1 and 160),
  constraint admin_analytics_alerts_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

create unique index admin_analytics_alerts_open_key_idx
  on public.admin_analytics_alerts (rule_key, scope_key)
  where status <> 'recovered';
create index admin_analytics_alerts_status_idx
  on public.admin_analytics_alerts (status, last_seen_at desc);

create trigger admin_analytics_saved_filters_updated_at
  before update on public.admin_analytics_saved_filters
  for each row execute function public.set_updated_at();
create trigger admin_analytics_schedules_updated_at
  before update on public.admin_analytics_schedules
  for each row execute function public.set_updated_at();
create trigger admin_analytics_export_runs_updated_at
  before update on public.admin_analytics_export_runs
  for each row execute function public.set_updated_at();
create trigger admin_analytics_alerts_updated_at
  before update on public.admin_analytics_alerts
  for each row execute function public.set_updated_at();

alter table public.admin_analytics_saved_filters enable row level security;
alter table public.admin_analytics_schedules enable row level security;
alter table public.admin_analytics_export_runs enable row level security;
alter table public.admin_analytics_alerts enable row level security;

revoke all on table public.admin_analytics_saved_filters from public, anon, authenticated;
revoke all on table public.admin_analytics_schedules from public, anon, authenticated;
revoke all on table public.admin_analytics_export_runs from public, anon, authenticated;
revoke all on table public.admin_analytics_alerts from public, anon, authenticated;
grant all on table public.admin_analytics_saved_filters to service_role;
grant all on table public.admin_analytics_schedules to service_role;
grant all on table public.admin_analytics_export_runs to service_role;
grant all on table public.admin_analytics_alerts to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'admin-analytics-exports',
  'admin-analytics-exports',
  false,
  52428800,
  array['text/csv', 'text/plain']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.admin_b2b_analytics_company_detail(
  p_date_from timestamptz,
  p_date_to timestamptz,
  p_filters jsonb default '{}'::jsonb,
  p_search text default null,
  p_page integer default 1,
  p_page_size integer default 50
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
  eligible_events as (
    select event.*
    from filtered_events as event
    where event.actor_user_id is not null
      and event.company_id is not null
      and event.session_id is not null
      and event.customer_code_snapshot is not null
  ),
  scope_stats as (
    select count(distinct company_id)::integer as active_companies
    from eligible_events
  ),
  company_events as (
    select
      company_id,
      count(*)::integer as event_count,
      count(distinct actor_user_id)::integer as active_users,
      count(distinct session_id)::integer as active_sessions,
      count(*) filter (where product_reference is not null)::integer as product_events,
      count(*) filter (where event_name in ('b2b_rfq_add', 'b2b_rfq_submit'))::integer as rfq_events,
      max(occurred_at) as last_activity_at
    from eligible_events
    group by company_id
  ),
  rfq_counts as (
    select company_id, count(*)::integer as rfq_count
    from public.b2b_rfqs
    where (p_date_from is null or created_at >= p_date_from)
      and (p_date_to is null or created_at < p_date_to)
    group by company_id
  ),
  visible as (
    select
      companies.id,
      companies.name,
      companies.client_code,
      companies.is_active,
      company_events.event_count,
      company_events.active_users,
      company_events.active_sessions,
      company_events.product_events,
      company_events.rfq_events,
      coalesce(rfq_counts.rfq_count, 0)::integer as rfq_count,
      company_events.last_activity_at
    from company_events
    join public.companies as companies on companies.id = company_events.company_id
    left join rfq_counts on rfq_counts.company_id = company_events.company_id
    where (
      nullif(trim(coalesce(p_search, '')), '') is null
      or lower(companies.name) like '%' || lower(trim(p_search)) || '%'
      or lower(companies.client_code) like '%' || lower(trim(p_search)) || '%'
    )
  ),
  page_rows as (
    select visible.*
    from visible
    order by last_activity_at desc, id
    offset (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 50), 1), 50)
    limit least(greatest(coalesce(p_page_size, 50), 1), 50)
  )
  select case
    when (select active_companies from scope_stats) < 5 then
      jsonb_build_object(
        'masked', true,
        'active_companies', (select active_companies from scope_stats)
      )
    else jsonb_build_object(
      'masked', false,
      'active_companies', (select active_companies from scope_stats),
      'total', (select count(*)::integer from visible),
      'page', greatest(coalesce(p_page, 1), 1),
      'page_size', least(greatest(coalesce(p_page_size, 50), 1), 50),
      'companies', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'name', name,
            'client_code', client_code,
            'is_active', is_active,
            'event_count', event_count,
            'active_users', active_users,
            'active_sessions', active_sessions,
            'product_events', product_events,
            'rfq_events', rfq_events,
            'rfq_count', rfq_count,
            'last_activity_at', last_activity_at
          )
          order by last_activity_at desc, id
        )
        from page_rows
      ), '[]'::jsonb)
    )
  end;
$$;

revoke all on function public.admin_b2b_analytics_company_detail(timestamptz, timestamptz, jsonb, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.admin_b2b_analytics_company_detail(timestamptz, timestamptz, jsonb, text, integer, integer)
  to service_role;

commit;

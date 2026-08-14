-- 元家 MVP：遠端 schema-only baseline
--
-- 來源：Yuanjia Project（ixggooilggtesdrmjeon）於 2026-08-12 的唯讀盤點。
-- 目的：供全新本地資料庫建立目前已確認的資料結構。
--
-- 刻意不包含：
--   * RLS enablement / policies
--   * anon、authenticated、service_role GRANT
--   * analytics event API allow-list
--   * demo rows、Auth users、companies identity provisioning
-- 以上內容應由後續、獨立 migration 或安全的 seed／部署流程處理。
--
-- 這不是既有遠端資料庫的 reconciliation migration。遠端已有同名表時，
-- 不得直接執行本檔；先建立 migration history baseline 或另寫非破壞性
-- reconciliation migration，並逐項取得確認。

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete restrict,
  client_code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_prefix_rules (
  id uuid primary key default gen_random_uuid(),
  prefix text not null unique,
  tier_label text not null,
  channel_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_prefix_rules_prefix_not_blank check (length(trim(prefix)) > 0)
);

create table public.app_admins (
  user_id uuid primary key references auth.users (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.b2c_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null,
  category text not null,
  specification text not null,
  price numeric(10, 2) not null check (price >= 0),
  origin text not null,
  storage_method text not null,
  description text not null,
  food_safety_info text,
  quality_info text,
  mock_inventory integer not null default 0 check (mock_inventory >= 0),
  image_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint b2c_products_slug_not_blank check (length(trim(slug)) > 0)
);

create table public.b2b_products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  name text not null,
  brand text not null,
  category text not null,
  specification text not null,
  packaging text,
  origin text not null,
  storage_method text not null,
  description text not null,
  image_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint b2b_products_product_code_not_blank check (length(trim(product_code)) > 0)
);

create table public.b2c_tags (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint b2c_tags_group_name_not_blank check (length(trim(group_name)) > 0)
);

create table public.b2b_tags (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint b2b_tags_group_name_not_blank check (length(trim(group_name)) > 0)
);

create table public.b2c_product_tags (
  product_id uuid not null references public.b2c_products (id) on delete cascade,
  tag_id uuid not null references public.b2c_tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

create table public.b2b_product_tags (
  product_id uuid not null references public.b2b_products (id) on delete cascade,
  tag_id uuid not null references public.b2b_tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

create table public.b2b_rfqs (
  id uuid constraint rfqs_pkey primary key default gen_random_uuid(),
  company_id uuid not null constraint rfqs_company_id_fkey
    references public.companies (id) on delete restrict,
  status text not null default 'new'
    constraint rfqs_status_check check (status in ('new', 'processing', 'closed')),
  total_note text,
  customer_tier_snapshot text not null default 'unclassified',
  channel_snapshot text not null default 'unclassified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.b2b_rfq_items (
  id uuid constraint rfq_items_pkey primary key default gen_random_uuid(),
  rfq_id uuid not null constraint rfq_items_rfq_id_fkey
    references public.b2b_rfqs (id) on delete cascade,
  product_id uuid not null constraint rfq_items_product_id_fkey
    references public.b2b_products (id) on delete restrict,
  quantity numeric(12, 2) not null
    constraint rfq_items_quantity_check check (quantity > 0),
  unit text not null,
  item_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.b2c_orders (
  id uuid constraint mock_orders_pkey primary key default gen_random_uuid(),
  status text not null default 'created'
    constraint mock_orders_status_check check (status in ('created', 'processing', 'completed')),
  recipient_name text not null,
  recipient_phone text not null,
  recipient_email text not null,
  delivery_address text not null,
  privacy_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.b2c_order_items (
  id uuid constraint mock_order_items_pkey primary key default gen_random_uuid(),
  mock_order_id uuid not null constraint mock_order_items_mock_order_id_fkey
    references public.b2c_orders (id) on delete cascade,
  product_id uuid not null constraint mock_order_items_product_id_fkey
    references public.b2c_products (id) on delete restrict,
  quantity integer not null
    constraint mock_order_items_quantity_check check (quantity > 0),
  unit_price numeric(10, 2) not null
    constraint mock_order_items_unit_price_check check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  surface text not null
    constraint analytics_events_surface_check check (surface in ('b2c', 'b2b')),
  product_reference uuid,
  product_category text,
  product_brand text,
  customer_tier_snapshot text,
  channel_snapshot text,
  occurred_at timestamptz not null default now(),
  constraint analytics_events_event_name_not_blank check (length(trim(event_name)) > 0)
);

create index rfqs_company_id_created_at_idx
  on public.b2b_rfqs (company_id, created_at desc);
create index rfq_items_rfq_id_idx
  on public.b2b_rfq_items (rfq_id);
create index b2c_product_tags_tag_id_idx
  on public.b2c_product_tags (tag_id);
create index b2b_product_tags_tag_id_idx
  on public.b2b_product_tags (tag_id);
create index analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);
create index analytics_events_event_name_idx
  on public.analytics_events (event_name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

create trigger customer_prefix_rules_set_updated_at
before update on public.customer_prefix_rules
for each row execute function public.set_updated_at();

create trigger app_admins_set_updated_at
before update on public.app_admins
for each row execute function public.set_updated_at();

create trigger b2c_products_set_updated_at
before update on public.b2c_products
for each row execute function public.set_updated_at();

create trigger b2b_products_set_updated_at
before update on public.b2b_products
for each row execute function public.set_updated_at();

create trigger b2c_tags_set_updated_at
before update on public.b2c_tags
for each row execute function public.set_updated_at();

create trigger b2b_tags_set_updated_at
before update on public.b2b_tags
for each row execute function public.set_updated_at();

create trigger rfqs_set_updated_at
before update on public.b2b_rfqs
for each row execute function public.set_updated_at();

create trigger rfq_items_set_updated_at
before update on public.b2b_rfq_items
for each row execute function public.set_updated_at();

create trigger mock_orders_set_updated_at
before update on public.b2c_orders
for each row execute function public.set_updated_at();

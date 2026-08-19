-- B2B 商品多規格／多包裝選項。
--
-- b2b_products 的 specification／packaging 保留作為既有商品摘要與相容欄位；
-- 本表保存可供 B2B 客戶選取的實際詢價選項。價格、庫存與供應能力不在本模型內。

begin;

create table public.b2b_product_spec_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null
    constraint b2b_product_spec_options_product_id_fkey
    references public.b2b_products (id) on delete cascade,
  option_code text not null unique,
  specification_text text not null,
  packaging_text text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint b2b_product_spec_options_option_code_not_blank
    check (length(trim(option_code)) > 0),
  constraint b2b_product_spec_options_specification_not_blank
    check (length(trim(specification_text)) > 0),
  constraint b2b_product_spec_options_packaging_not_blank
    check (length(trim(packaging_text)) > 0),
  constraint b2b_product_spec_options_display_order_non_negative
    check (display_order >= 0)
);

create index b2b_product_spec_options_product_active_order_idx
  on public.b2b_product_spec_options (product_id, is_active, display_order, option_code);

create trigger b2b_product_spec_options_set_updated_at
before update on public.b2b_product_spec_options
for each row execute function public.set_updated_at();

alter table public.b2b_product_spec_options enable row level security;

revoke all on table public.b2b_product_spec_options from anon, authenticated;
grant select on table public.b2b_product_spec_options to authenticated;
grant all on table public.b2b_product_spec_options to service_role;

create policy "b2b_active_spec_options_company_read"
on public.b2b_product_spec_options for select to authenticated
using (
  is_active
  and exists (
    select 1
    from public.companies company
    where company.auth_user_id = (select auth.uid())
      and company.is_active = true
  )
  and exists (
    select 1
    from public.b2b_products product
    where product.id = b2b_product_spec_options.product_id
      and product.is_active = true
  )
);

alter table public.b2b_product_spec_options
  add constraint b2b_product_spec_options_id_product_id_key unique (id, product_id);

alter table public.b2b_rfq_items
  add column specification_option_id uuid,
  add column other_specification text,
  add column other_packaging text,
  add column specification_text_snapshot text,
  add column packaging_text_snapshot text;

alter table public.b2b_rfq_items
  add constraint rfq_items_specification_option_product_fkey
  foreign key (specification_option_id, product_id)
  references public.b2b_product_spec_options (id, product_id)
  on delete restrict;

create index b2b_rfq_items_specification_option_id_idx
  on public.b2b_rfq_items (specification_option_id);

-- 既有 RFQ 可能沒有規格選項；NOT VALID 保留舊資料，並限制新寫入資料
-- 必須選一個啟用選項，或填寫至少一個「其他」欄位。
alter table public.b2b_rfq_items
  add constraint rfq_items_specification_selection_check
  check (
    (
      specification_option_id is not null
      and other_specification is null
      and other_packaging is null
    )
    or (
      specification_option_id is null
      and (
        nullif(trim(other_specification), '') is not null
        or nullif(trim(other_packaging), '') is not null
      )
    )
  ) not valid;

commit;

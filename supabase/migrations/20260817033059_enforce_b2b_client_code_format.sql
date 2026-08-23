-- B2B 客戶代碼改為：Z、E、W 任一前綴 + 6 碼數字。
--
-- NOT VALID 讓既有尚未整理的 legacy company row 可以先保留；約束會立即
-- 套用到新建與更新的資料。清理完既有 legacy code 後，再執行 VALIDATE。

begin;

-- 只轉換 repository 內固定的展示／測試鍵，保留原有 auth_user_id。
-- 正式客戶若仍使用 legacy code，請由管理者先確認新代碼後再個別更新。
update public.companies
set client_code = 'Z232113',
    updated_at = now()
where client_code = 'B2B-TEST-001'
  and not exists (
    select 1 from public.companies existing where existing.client_code = 'Z232113'
  );

update public.companies
set client_code = 'E853699',
    updated_at = now()
where client_code = 'B2B-TEST-DISABLED-001'
  and not exists (
    select 1 from public.companies existing where existing.client_code = 'E853699'
  );

update public.companies
set client_code = 'W483038',
    updated_at = now()
where client_code = 'B2B-TEST-002'
  and not exists (
    select 1 from public.companies existing where existing.client_code = 'W483038'
  );

alter table public.companies
  drop constraint if exists companies_client_code_format_check;

alter table public.companies
  add constraint companies_client_code_format_check
  check (client_code ~ '^[ZEW][0-9]{6}$')
  not valid;

insert into public.customer_prefix_rules (prefix, tier_label, channel_label, is_active)
values
  ('Z', '月營業額 20 萬以下', 'B2B', true),
  ('E', '月營業額 50 萬以下', 'B2B', true),
  ('W', '其他', 'B2B', true)
on conflict (prefix) do update
set tier_label = excluded.tier_label,
    channel_label = excluded.channel_label,
    is_active = excluded.is_active;

update public.customer_prefix_rules
set is_active = false,
    updated_at = now()
where prefix not in ('Z', 'E', 'W');

commit;

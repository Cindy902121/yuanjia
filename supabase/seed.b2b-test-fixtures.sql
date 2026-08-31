-- 元家 B2B 權限／隔離測試 fixture（選用）
--
-- 這份檔案刻意不併入 supabase/seed.sql：只有在本機或隔離測試資料庫
-- 需要驗收停用商品、停用公司與跨公司隔離時才明確執行。
-- 不要對正式資料庫執行；本檔不建立 Auth user、不保存密碼。
--
-- 所有 fixture 都使用獨立的 TEST 業務鍵。company insert 刻意省略
-- auth_user_id，重跑時只更新 fixture 自己的名稱／啟用狀態，不會解除任何既有
-- Auth identity 綁定。第二家公司要登入，必須另外建立測試 Auth user，並只把
-- 該 user UUID 綁到 W483038。

begin;

insert into public.companies (client_code, name, is_active)
values
  ('E853699', '停用公司登入測試', false),
  ('W483038', '第二家公司隔離測試', true)
on conflict (client_code) do update
set name = excluded.name,
    is_active = excluded.is_active;

-- 這筆商品不掛任何展示標籤，且永遠維持停用；公開／B2B 型錄查詢不會回傳它。
insert into public.b2b_products (
  product_code, name, brand, category, specification, packaging, origin,
  storage_method, description, status
)
values (
  'B2B-TEST-INACTIVE-001',
  'B2B 停用商品測試品（不顯示）',
  '元家測試',
  '測試資料',
  '測試規格',
  '測試包裝',
  '測試來源',
  '冷凍測試',
  '僅供停用商品權限驗收，不屬於正常展示商品。',
  'offline'
)
on conflict (product_code) do update
set name = excluded.name,
    brand = excluded.brand,
    category = excluded.category,
    specification = excluded.specification,
    packaging = excluded.packaging,
    origin = excluded.origin,
    storage_method = excluded.storage_method,
    description = excluded.description,
    status = 'offline';

commit;

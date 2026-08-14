-- 元家 MVP 可重複執行的展示 seed
--
-- 這份 seed 只建立網站展示資料，不建立 Supabase Auth user，也不保存密碼。
-- 已存在的 demo row 只以穩定業務鍵 upsert；company 的 auth_user_id 永不被
-- seed 覆蓋，避免重新執行時解除既有 Auth identity 綁定。
-- 這份 seed 採非破壞性重跑策略：不刪除資料庫中額外存在的 row 或舊關聯；
-- 每次執行只會補齊／更新下方展示鍵，並維持同一組展示資料可重複套用。
--
-- 目前展示集包含 5 筆 B2C、8 筆 B2B、10／15 個標籤，
-- 以及 15／31 筆標籤關聯；B2B 展示分類依 FDD 涵蓋蝦蟹類、魚類、貝類、
-- 軟體類、肉類與調理食品。

begin;

-- Auth identity 必須透過 Supabase Auth／Dashboard／管理 API 建立；這裡只保留
-- 一個可供本地測試的公司資料列。若已有 auth_user_id，upsert 不會改動它。
insert into public.companies (client_code, name, is_active)
values ('B2B-TEST-001', '王品餐飲測試企業', true)
on conflict (client_code) do update
set name = excluded.name,
    is_active = true;

insert into public.customer_prefix_rules (prefix, tier_label, channel_label, is_active)
values
  ('REST', 'A級', '餐飲', true),
  ('RETL', 'B級', '零售', true),
  ('CATE', 'C級', '團膳', true)
on conflict (prefix) do update
set tier_label = excluded.tier_label,
    channel_label = excluded.channel_label,
    is_active = excluded.is_active;

insert into public.b2c_tags (group_name, slug, name, is_active)
values
  ('食材', 'fish', '魚類', true),
  ('食材', 'shrimp', '蝦類', true),
  ('食材', 'shellfish', '貝類', true),
  ('料理方式', 'hot-pot', '火鍋', true),
  ('料理方式', 'pan-fry', '煎烤', true),
  ('料理方式', 'air-fry', '氣炸', true),
  ('需求特性', 'high-protein', '高蛋白', true),
  ('需求特性', 'kid-friendly', '適合小孩', true),
  ('加工方式', 'ready-to-cook', '即煮', true),
  ('加工方式', 'seasoned', '調味', true)
on conflict (slug) do update
set group_name = excluded.group_name,
    name = excluded.name,
    is_active = excluded.is_active;

insert into public.b2b_tags (group_name, slug, name, is_active)
values
  ('食材', 'b2b-fish', '魚類', true),
  ('食材', 'b2b-shrimp', '蝦蟹類', true),
  ('食材', 'b2b-shellfish', '貝類', true),
  ('食材', 'b2b-soft-body', '軟體類', true),
  ('食材', 'b2b-meat', '肉類', true),
  ('食材', 'processed-food', '調理食品', true),
  ('加工／規格', 'whole-fish', '整尾', true),
  ('加工／規格', 'fillet', '切片', true),
  ('加工／規格', 'raw-material', '原料', true),
  ('加工／規格', 'cut-piece', '切塊', true),
  ('加工／規格', 'seasoned', '調味', true),
  ('用途', 'restaurant', '餐飲料理', true),
  ('用途', 'retail', '零售販售', true),
  ('用途', 'bulk-supply', '團膳／大量供應', true),
  ('保存／包裝', 'frozen', '冷凍保存', true)
on conflict (slug) do update
set group_name = excluded.group_name,
    name = excluded.name,
    is_active = excluded.is_active;

insert into public.b2c_products (
  slug, name, brand, category, specification, price, origin, storage_method,
  description, food_safety_info, quality_info, mock_inventory, is_active
)
values
  ('norwegian-salmon-fillet', '挪威鮭魚菲力', '宅鮮配', '魚類', '200g/包', 239, '挪威', '冷凍 -18°C 以下', '油脂豐富，適合煎烤與氣炸。', '低溫冷鏈配送。', '展示用品質資訊。', 20, true),
  ('taiwan-milkfish-belly', '台灣虱目魚肚', '宅鮮配', '魚類', '180g/包', 169, '台灣', '冷凍 -18°C 以下', '肉質細緻，適合香煎與煮湯。', '低溫冷鏈配送。', '展示用品質資訊。', 25, true),
  ('argentine-red-shrimp', '阿根廷天使紅蝦', '宅鮮配', '蝦類', '500g/盒', 329, '阿根廷', '冷凍 -18°C 以下', '鮮甜飽滿，適合火鍋與燒烤。', '低溫冷鏈配送。', '展示用品質資訊。', 15, true),
  ('taiwan-clam', '台灣鮮甜蛤蜊', '宅鮮配', '貝類', '500g/包', 139, '台灣', '冷凍 -18°C 以下', '適合煮湯與義大利麵。', '低溫冷鏈配送。', '展示用品質資訊。', 30, true),
  ('seasoned-mackerel', '日式調味鯖魚', '宅鮮配', '魚類', '140g/片', 119, '挪威', '冷凍 -18°C 以下', '調味完成，快速加熱即可享用。', '低溫冷鏈配送。', '展示用品質資訊。', 18, true)
on conflict (slug) do update
set name = excluded.name,
    brand = excluded.brand,
    category = excluded.category,
    specification = excluded.specification,
    price = excluded.price,
    origin = excluded.origin,
    storage_method = excluded.storage_method,
    description = excluded.description,
    food_safety_info = excluded.food_safety_info,
    quality_info = excluded.quality_info,
    mock_inventory = excluded.mock_inventory,
    is_active = excluded.is_active;

insert into public.b2b_products (
  product_code, name, brand, category, specification, packaging, origin,
  storage_method, description, is_active
)
values
  ('B2B-FISH-001', '智利鮭魚切片', '元家', '魚類', '200g/片', '20片/箱', '智利', '冷凍 -18°C 以下', '餐飲與零售展示用鮭魚切片。', true),
  ('B2B-FISH-002', '午仔魚整尾', '元家', '魚類', '450-550g/尾', '10尾/箱', '台灣', '冷凍 -18°C 以下', '展示用整尾魚品項。', true),
  ('B2B-SHRIMP-001', '白蝦原料', '元家', '蝦蟹類', '31/40 規格', '10kg/箱', '厄瓜多', '冷凍 -18°C 以下', '團膳與餐飲展示用原料。', true),
  ('B2B-SHELL-001', '熟凍扇貝', '元家', '貝類', '20/30 規格', '5kg/箱', '日本', '冷凍 -18°C 以下', '零售展示用熟凍扇貝。', true),
  ('B2B-FISH-003', '鯖魚菲力', '元家', '魚類', '120-150g/片', '10kg/箱', '挪威', '冷凍 -18°C 以下', '餐飲展示用鯖魚菲力。', true),
  ('B2B-SOFT-001', '透抽圈', '元家', '軟體類', '3-5cm/圈', '5kg/箱', '台灣', '冷凍 -18°C 以下', '餐飲展示用軟體類切塊品項。', true),
  ('B2B-MEAT-001', '去骨雞腿肉切塊', '元家', '肉類', '2kg/包', '10kg/箱', '台灣', '冷凍 -18°C 以下', '團膳展示用肉類切塊品項。', true),
  ('B2B-PREP-001', '調理海鮮丸', '元家', '調理食品', '30g/顆', '5kg/箱', '台灣', '冷凍 -18°C 以下', '餐飲展示用調理食品。', true)
on conflict (product_code) do update
set name = excluded.name,
    brand = excluded.brand,
    category = excluded.category,
    specification = excluded.specification,
    packaging = excluded.packaging,
    origin = excluded.origin,
    storage_method = excluded.storage_method,
    description = excluded.description,
    is_active = excluded.is_active;

-- 以 product slug／product code + tag slug 查詢 UUID，不把不穩定 UUID 寫死。
-- 關聯使用複合主鍵，重跑時只會保留一份。
insert into public.b2c_product_tags (product_id, tag_id)
select product.id, tag.id
from public.b2c_products product
join public.b2c_tags tag on (product.slug, tag.slug) in (
  ('norwegian-salmon-fillet', 'fish'),
  ('norwegian-salmon-fillet', 'pan-fry'),
  ('norwegian-salmon-fillet', 'air-fry'),
  ('norwegian-salmon-fillet', 'high-protein'),
  ('taiwan-milkfish-belly', 'fish'),
  ('taiwan-milkfish-belly', 'pan-fry'),
  ('taiwan-milkfish-belly', 'kid-friendly'),
  ('argentine-red-shrimp', 'shrimp'),
  ('argentine-red-shrimp', 'hot-pot'),
  ('argentine-red-shrimp', 'high-protein'),
  ('taiwan-clam', 'shellfish'),
  ('taiwan-clam', 'hot-pot'),
  ('seasoned-mackerel', 'fish'),
  ('seasoned-mackerel', 'seasoned'),
  ('seasoned-mackerel', 'ready-to-cook')
)
on conflict (product_id, tag_id) do nothing;

insert into public.b2b_product_tags (product_id, tag_id)
select product.id, tag.id
from public.b2b_products product
join public.b2b_tags tag on (product.product_code, tag.slug) in (
  ('B2B-FISH-001', 'b2b-fish'),
  ('B2B-FISH-001', 'fillet'),
  ('B2B-FISH-001', 'restaurant'),
  ('B2B-FISH-001', 'frozen'),
  ('B2B-FISH-002', 'b2b-fish'),
  ('B2B-FISH-002', 'whole-fish'),
  ('B2B-FISH-002', 'restaurant'),
  ('B2B-FISH-002', 'frozen'),
  ('B2B-SHRIMP-001', 'b2b-shrimp'),
  ('B2B-SHRIMP-001', 'raw-material'),
  ('B2B-SHRIMP-001', 'bulk-supply'),
  ('B2B-SHRIMP-001', 'frozen'),
  ('B2B-SHELL-001', 'b2b-shellfish'),
  ('B2B-SHELL-001', 'retail'),
  ('B2B-SHELL-001', 'frozen'),
  ('B2B-FISH-003', 'b2b-fish'),
  ('B2B-FISH-003', 'fillet'),
  ('B2B-FISH-003', 'restaurant'),
  ('B2B-FISH-003', 'frozen'),
  ('B2B-SOFT-001', 'b2b-soft-body'),
  ('B2B-SOFT-001', 'cut-piece'),
  ('B2B-SOFT-001', 'restaurant'),
  ('B2B-SOFT-001', 'frozen'),
  ('B2B-MEAT-001', 'b2b-meat'),
  ('B2B-MEAT-001', 'cut-piece'),
  ('B2B-MEAT-001', 'bulk-supply'),
  ('B2B-MEAT-001', 'frozen'),
  ('B2B-PREP-001', 'processed-food'),
  ('B2B-PREP-001', 'seasoned'),
  ('B2B-PREP-001', 'restaurant'),
  ('B2B-PREP-001', 'frozen')
)
on conflict (product_id, tag_id) do nothing;

commit;

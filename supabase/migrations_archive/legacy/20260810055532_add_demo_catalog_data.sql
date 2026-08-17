-- 僅供 MVP 展示與開發測試使用；不含真實客戶或 ERP 資料。

insert into public.customer_prefix_rules (prefix, tier_label, channel_label)
values
  ('REST', 'A級', '餐飲'),
  ('RETL', 'B級', '零售'),
  ('CATE', 'C級', '團膳')
on conflict (prefix) do update
set tier_label = excluded.tier_label,
    channel_label = excluded.channel_label,
    is_active = true;

insert into public.b2c_tags (group_name, slug, name)
values
  ('食材', 'fish', '魚類'),
  ('食材', 'shrimp', '蝦類'),
  ('食材', 'shellfish', '貝類'),
  ('料理方式', 'hot-pot', '火鍋'),
  ('料理方式', 'pan-fry', '煎烤'),
  ('料理方式', 'air-fry', '氣炸'),
  ('需求特性', 'high-protein', '高蛋白'),
  ('需求特性', 'kid-friendly', '適合小孩'),
  ('加工方式', 'ready-to-cook', '即煮'),
  ('加工方式', 'seasoned', '調味')
on conflict (slug) do update
set group_name = excluded.group_name,
    name = excluded.name,
    is_active = true;

insert into public.b2b_tags (group_name, slug, name)
values
  ('產品分類', 'b2b-fish', '魚類'),
  ('產品分類', 'b2b-shrimp', '蝦類'),
  ('產品分類', 'b2b-shellfish', '貝類'),
  ('產品型態', 'whole-fish', '整尾'),
  ('產品型態', 'fillet', '切片'),
  ('產品型態', 'raw-material', '原料'),
  ('使用情境', 'restaurant', '餐飲料理'),
  ('使用情境', 'retail', '零售販售'),
  ('使用情境', 'bulk-supply', '團膳大量供應'),
  ('保存方式', 'frozen', '冷凍保存')
on conflict (slug) do update
set group_name = excluded.group_name,
    name = excluded.name,
    is_active = true;

insert into public.b2c_products (
  slug, name, brand, category, specification, price, origin, storage_method,
  description, food_safety_info, quality_info, mock_inventory
)
values
  ('norwegian-salmon-fillet', '挪威鮭魚菲力', '宅鮮配', '魚類', '200g/包', 239, '挪威', '冷凍 -18°C 以下', '油脂豐富，適合煎烤與氣炸。', '低溫冷鏈配送。', '展示用品質資訊。', 20),
  ('taiwan-milkfish-belly', '台灣虱目魚肚', '宅鮮配', '魚類', '180g/包', 169, '台灣', '冷凍 -18°C 以下', '肉質細緻，適合香煎與煮湯。', '低溫冷鏈配送。', '展示用品質資訊。', 25),
  ('argentine-red-shrimp', '阿根廷天使紅蝦', '宅鮮配', '蝦類', '500g/盒', 329, '阿根廷', '冷凍 -18°C 以下', '鮮甜飽滿，適合火鍋與燒烤。', '低溫冷鏈配送。', '展示用品質資訊。', 15),
  ('taiwan-clam', '台灣鮮甜蛤蜊', '宅鮮配', '貝類', '500g/包', 139, '台灣', '冷凍 -18°C 以下', '適合煮湯與義大利麵。', '低溫冷鏈配送。', '展示用品質資訊。', 30),
  ('seasoned-mackerel', '日式調味鯖魚', '宅鮮配', '魚類', '140g/片', 119, '挪威', '冷凍 -18°C 以下', '調味完成，快速加熱即可享用。', '低溫冷鏈配送。', '展示用品質資訊。', 18)
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
    is_active = true;

insert into public.b2b_products (
  product_code, name, brand, category, specification, packaging, origin,
  storage_method, description
)
values
  ('B2B-FISH-001', '智利鮭魚切片', '元家', '魚類', '200g/片', '20片/箱', '智利', '冷凍 -18°C 以下', '餐飲與零售展示用鮭魚切片。'),
  ('B2B-FISH-002', '午仔魚整尾', '元家', '魚類', '450-550g/尾', '10尾/箱', '台灣', '冷凍 -18°C 以下', '展示用整尾魚品項。'),
  ('B2B-SHRIMP-001', '白蝦原料', '元家', '蝦類', '31/40 規格', '10kg/箱', '厄瓜多', '冷凍 -18°C 以下', '團膳與餐飲展示用原料。'),
  ('B2B-SHELL-001', '熟凍扇貝', '元家', '貝類', '20/30 規格', '5kg/箱', '日本', '冷凍 -18°C 以下', '零售展示用熟凍扇貝。'),
  ('B2B-FISH-003', '鯖魚菲力', '元家', '魚類', '120-150g/片', '10kg/箱', '挪威', '冷凍 -18°C 以下', '餐飲展示用鯖魚菲力。')
on conflict (product_code) do update
set name = excluded.name,
    brand = excluded.brand,
    category = excluded.category,
    specification = excluded.specification,
    packaging = excluded.packaging,
    origin = excluded.origin,
    storage_method = excluded.storage_method,
    description = excluded.description,
    is_active = true;

insert into public.b2c_product_tags (product_id, tag_id)
select product.id, tag.id
from public.b2c_products product
join public.b2c_tags tag on (product.slug, tag.slug) in (
  ('norwegian-salmon-fillet', 'fish'), ('norwegian-salmon-fillet', 'pan-fry'), ('norwegian-salmon-fillet', 'air-fry'), ('norwegian-salmon-fillet', 'high-protein'),
  ('taiwan-milkfish-belly', 'fish'), ('taiwan-milkfish-belly', 'pan-fry'), ('taiwan-milkfish-belly', 'kid-friendly'),
  ('argentine-red-shrimp', 'shrimp'), ('argentine-red-shrimp', 'hot-pot'), ('argentine-red-shrimp', 'high-protein'),
  ('taiwan-clam', 'shellfish'), ('taiwan-clam', 'hot-pot'),
  ('seasoned-mackerel', 'fish'), ('seasoned-mackerel', 'seasoned'), ('seasoned-mackerel', 'ready-to-cook')
)
on conflict do nothing;

insert into public.b2b_product_tags (product_id, tag_id)
select product.id, tag.id
from public.b2b_products product
join public.b2b_tags tag on (product.product_code, tag.slug) in (
  ('B2B-FISH-001', 'b2b-fish'), ('B2B-FISH-001', 'fillet'), ('B2B-FISH-001', 'restaurant'), ('B2B-FISH-001', 'frozen'),
  ('B2B-FISH-002', 'b2b-fish'), ('B2B-FISH-002', 'whole-fish'), ('B2B-FISH-002', 'restaurant'), ('B2B-FISH-002', 'frozen'),
  ('B2B-SHRIMP-001', 'b2b-shrimp'), ('B2B-SHRIMP-001', 'raw-material'), ('B2B-SHRIMP-001', 'bulk-supply'), ('B2B-SHRIMP-001', 'frozen'),
  ('B2B-SHELL-001', 'b2b-shellfish'), ('B2B-SHELL-001', 'retail'), ('B2B-SHELL-001', 'frozen'),
  ('B2B-FISH-003', 'b2b-fish'), ('B2B-FISH-003', 'fillet'), ('B2B-FISH-003', 'restaurant'), ('B2B-FISH-003', 'frozen')
)
on conflict do nothing;

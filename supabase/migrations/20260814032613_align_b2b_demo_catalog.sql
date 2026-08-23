-- Align existing B2B demo rows with the PRD/FDD display-data contract.
-- This migration is additive and keeps the existing b2b-shrimp condition key
-- while presenting the approved single category name 「蝦蟹類」.

begin;

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

update public.b2b_products
set category = '蝦蟹類',
    updated_at = now()
where product_code = 'B2B-SHRIMP-001';

insert into public.b2b_products (
  product_code, name, brand, category, specification, packaging, origin,
  storage_method, description, is_active
)
values
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
    is_active = excluded.is_active,
    updated_at = now();

insert into public.b2b_product_tags (product_id, tag_id)
select product.id, tag.id
from public.b2b_products product
join public.b2b_tags tag on (product.product_code, tag.slug) in (
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

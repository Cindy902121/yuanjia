-- B2B 需求篩選器的固定通路葉節點與商品多對多關聯。
-- 父通路與顯示文案由 API 白名單管理；商品只儲存可被推薦的葉節點標籤。

begin;

insert into public.b2b_tags (group_name, slug, name, is_active)
values
  ('通路', 'wholesale_small', '小盤', true),
  ('通路', 'wholesale_mid_large', '中大型盤商', true),
  ('通路', 'ecommerce_group_buy', '團購', true),
  ('通路', 'ecommerce_live', '直播', true),
  ('通路', 'ecommerce_marketplace', '網購平台', true),
  ('通路', 'mass_retail', '量販／超市', true),
  ('通路', 'traditional_market', '傳統菜市場', true),
  ('通路', 'seafood_specialty_store', '海鮮專賣店', true),
  ('通路', 'foodservice_general', '一般餐飲', true),
  ('通路', 'foodservice_chain', '連鎖', true),
  ('通路', 'foodservice_banquet_catering', '宴會・外燴', true),
  ('通路', 'foodservice_hotel', '飯店', true)
on conflict (slug) do update
set group_name = excluded.group_name,
    name = excluded.name,
    is_active = excluded.is_active;

insert into public.b2b_product_tags (product_id, tag_id)
select product.id, tag.id
from public.b2b_products product
join public.b2b_tags tag on (product.product_code, tag.slug) in (
  ('B2B-SHRIMP-001', 'wholesale_small'),
  ('B2B-SHRIMP-001', 'wholesale_mid_large'),
  ('B2B-MEAT-001', 'wholesale_mid_large'),
  ('B2B-PREP-001', 'ecommerce_group_buy'),
  ('B2B-PREP-001', 'ecommerce_live'),
  ('B2B-PREP-001', 'ecommerce_marketplace'),
  ('B2B-SHELL-001', 'mass_retail'),
  ('B2B-FISH-001', 'traditional_market'),
  ('B2B-FISH-002', 'traditional_market'),
  ('B2B-FISH-002', 'seafood_specialty_store'),
  ('B2B-SHELL-001', 'seafood_specialty_store'),
  ('B2B-FISH-001', 'foodservice_general'),
  ('B2B-FISH-002', 'foodservice_general'),
  ('B2B-FISH-003', 'foodservice_general'),
  ('B2B-SOFT-001', 'foodservice_general'),
  ('B2B-PREP-001', 'foodservice_general'),
  ('B2B-FISH-003', 'foodservice_chain'),
  ('B2B-SOFT-001', 'foodservice_banquet_catering'),
  ('B2B-SOFT-001', 'foodservice_hotel')
)
on conflict (product_id, tag_id) do nothing;

commit;

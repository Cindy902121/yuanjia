-- 元家 B2B 權限／隔離測試 fixture 的安全清理（選用）
--
-- 只處理本 fixture 的固定業務鍵：
--   * 有 RFQ 參照的商品／公司不刪除，避免破壞測試證據或既有資料。
--   * 已綁 Auth identity 的公司不刪除，避免解除登入身分。
--   * 若清理條件不成立，資料會保留，可稍後再檢查後處理。

begin;

delete from public.b2b_product_tags relation
using public.b2b_products product
where relation.product_id = product.id
  and product.product_code = 'B2B-TEST-INACTIVE-001';

delete from public.b2b_products product
where product.product_code = 'B2B-TEST-INACTIVE-001'
  and not exists (
    select 1
    from public.b2b_rfq_items item
    where item.product_id = product.id
  );

delete from public.companies company
where company.client_code in ('E853699', 'W483038')
  and company.auth_user_id is null
  and not exists (
    select 1
    from public.b2b_rfqs rfq
    where rfq.company_id = company.id
  );

commit;

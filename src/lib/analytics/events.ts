/**
 * B2C 商品瀏覽相關的事件名稱，取自 FDD.md 6.7 的白名單子集。
 *
 * 白名單全部由伺服器驗證（見 FDD 6.7「伺服器規則：不接受 company_id、tier、channel、
 * 姓名、電話或 Email...metadata 只接受事件白名單內欄位」），前端只能送這幾個已核准
 * 的名稱，不能自己發明新事件名稱。
 */
export type B2cEventName =
  | "b2c_product_view"
  | "b2c_search_category"
  | "b2c_tag_click"
  | "b2c_tag_view";

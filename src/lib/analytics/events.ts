/**
 * B2C 事件名稱，取自 FDDv4.0.md §6.7 的白名單子集。
 *
 * 白名單全部由伺服器驗證（見 FDD §6.7「伺服器規則：不接受 company_id、tier、channel、
 * 姓名、電話或 Email...metadata 只接受事件白名單內欄位」），前端只能送這幾個已核准
 * 的名稱，不能自己發明新事件名稱。伺服器端完整白名單見 src/lib/analytics-events.ts
 * （C 建立，含 B2B 事件）；這裡只列 B2C 前端目前會用到的子集。
 *
 * 2026-08-17：補上購物車／結帳／浮動工具事件（B2C-04、B2C-05）：
 * b2c_cart_add、b2c_checkout_start、b2c_mock_order_created、b2c_help_widget_open、
 * b2c_product_finder_start／answer／complete／result_click、b2c_line_click、
 * b2c_ai_demo_open。
 */
export type B2cEventName =
  | "b2c_product_view"
  | "b2c_search_category"
  | "b2c_tag_click"
  | "b2c_tag_view"
  | "b2c_cart_add"
  | "b2c_checkout_start"
  | "b2c_mock_order_created"
  | "b2c_help_widget_open"
  | "b2c_product_finder_start"
  | "b2c_product_finder_answer"
  | "b2c_product_finder_complete"
  | "b2c_product_finder_result_click"
  | "b2c_line_click"
  | "b2c_ai_demo_open";

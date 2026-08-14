export const ANALYTICS_EVENT_NAMES = [
  "b2b_login_success",
  "b2b_catalog_view",
  "b2b_product_view",
  "b2b_search_filter",
  "b2b_product_finder_start",
  "b2b_product_finder_answer",
  "b2b_product_finder_complete",
  "b2b_product_finder_result_click",
  "b2b_rfq_add",
  "b2b_rfq_submit",
  "b2c_product_view",
  "b2c_search_category",
  "b2c_tag_click",
  "b2c_tag_view",
  "b2c_help_widget_open",
  "b2c_product_finder_start",
  "b2c_product_finder_answer",
  "b2c_product_finder_complete",
  "b2c_product_finder_result_click",
  "b2c_line_click",
  "b2c_ai_demo_open",
  "b2c_cart_add",
  "b2c_checkout_start",
  "b2c_mock_order_created",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export function isAnalyticsEventName(
  value: unknown,
): value is AnalyticsEventName {
  return (
    typeof value === "string" &&
    (ANALYTICS_EVENT_NAMES as readonly string[]).includes(value)
  );
}

export const ALLOWED_RFQ_UNITS = [
  "箱",
  "包",
  "盒",
  "公斤",
  "kg",
  "件",
  "尾",
] as const;

export function isAllowedRfqUnit(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (ALLOWED_RFQ_UNITS as readonly string[]).includes(value)
  );
}

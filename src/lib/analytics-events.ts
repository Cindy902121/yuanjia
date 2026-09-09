import { isUuid } from "./api";
import { B2B_FINDER_EVENT_OPTIONS } from "./product-finder";

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

export type B2bAnalyticsEventName = Extract<AnalyticsEventName, `b2b_${string}`>;

export const B2B_ANALYTICS_EVENT_NAMES = ANALYTICS_EVENT_NAMES.filter(
  (name): name is B2bAnalyticsEventName => name.startsWith("b2b_"),
);

const B2B_EVENT_DATA_KEYS: Partial<Record<B2bAnalyticsEventName, readonly string[]>> = {
  b2b_search_filter: ["filter_type", "selected_option_ids", "result_count"],
  b2b_product_finder_answer: ["question_key", "option_id"],
  b2b_product_finder_result_click: ["product_id"],
  b2b_rfq_add: ["product_id"],
  b2b_rfq_submit: ["rfq_id"],
};

const B2B_SEARCH_FILTER_TYPES = new Set(["keyword", "category", "brand", "tag"]);
const B2B_FINDER_QUESTION_KEYS: Set<string> = new Set(
  B2B_FINDER_EVENT_OPTIONS.map((option) => option.questionKey),
);
const B2B_FINDER_OPTION_IDS = new Set(
  B2B_FINDER_EVENT_OPTIONS.map((option) => option.optionId),
);

function text(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength
    ? value.trim()
    : null;
}

function count(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1000000
    ? value
    : null;
}

export function parseB2bEventData(
  eventName: B2bAnalyticsEventName,
  value: unknown,
): { data: Record<string, unknown> } | { error: string } {
  const data = value === undefined ? {} : value;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { error: "事件資料必須是 JSON 物件。" };
  }

  const input = data as Record<string, unknown>;
  const allowedKeys = B2B_EVENT_DATA_KEYS[eventName] ?? [];
  if (Object.keys(input).some((key) => !allowedKeys.includes(key))) {
    return { error: "事件資料包含未允許的欄位。" };
  }

  if (eventName === "b2b_search_filter") {
    const filterType = text(input.filter_type, 80);
    const selectedOptionIds = input.selected_option_ids;
    const resultCount = count(input.result_count);
    const optionIds = Array.isArray(selectedOptionIds)
      ? selectedOptionIds.map((option) => text(option, 120))
      : [];
    if (
      !filterType ||
      !B2B_SEARCH_FILTER_TYPES.has(filterType) ||
      !Array.isArray(selectedOptionIds) ||
      selectedOptionIds.length > 20 ||
      optionIds.some((option) => !option) ||
      new Set(optionIds).size !== optionIds.length ||
      (filterType === "keyword" && optionIds.length > 0) ||
      (filterType !== "keyword" && optionIds.length === 0) ||
      resultCount === null
    ) {
      return { error: "搜尋篩選事件資料不正確。" };
    }
    return {
      data: {
        filter_type: filterType,
        selected_option_ids: optionIds,
        result_count: resultCount,
      },
    };
  }

  if (eventName === "b2b_product_finder_answer") {
    const questionKey = text(input.question_key, 120);
    const optionId = text(input.option_id, 120);
    return questionKey && optionId && B2B_FINDER_QUESTION_KEYS.has(questionKey) && B2B_FINDER_OPTION_IDS.has(optionId)
      ? { data: { question_key: questionKey, option_id: optionId } }
      : { error: "需求篩選回答事件資料不正確。" };
  }

  if (eventName === "b2b_product_finder_result_click" || eventName === "b2b_rfq_add") {
    return isUuid(input.product_id)
      ? { data: { product_id: input.product_id } }
      : { error: "事件產品參照格式不正確。" };
  }

  if (eventName === "b2b_rfq_submit") {
    return isUuid(input.rfq_id)
      ? { data: { rfq_id: input.rfq_id } }
      : { error: "詢價事件參照格式不正確。" };
  }

  return Object.keys(input).length === 0
    ? { data: {} }
    : { error: "此事件不接受額外資料。" };
}

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

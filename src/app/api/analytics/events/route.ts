import {
  apiError,
  isUuid,
  json,
  readJson,
} from "@/lib/api";
import { cookies } from "next/headers";
import { getB2bContext } from "@/lib/auth-context";
import { resolveCustomerSnapshot } from "@/lib/customer-rules";
import {
  isAnalyticsEventName,
  parseB2bEventData,
  type B2bAnalyticsEventName,
  type AnalyticsEventName,
} from "@/lib/analytics-events";
import { createAdminClient } from "@/lib/supabase/admin";

type EventBody = {
  event_name?: unknown;
  product_id?: unknown;
  event_data?: unknown;
};

const ANALYTICS_SESSION_COOKIE = "yuanjia_analytics_session";
const ANALYTICS_SESSION_MAX_AGE = 30 * 60;

export async function POST(request: Request) {
  const body = (await readJson(request)) as EventBody | null;

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some(
      (key) => !["event_name", "product_id", "event_data"].includes(key),
    ) ||
    !isAnalyticsEventName(body.event_name)
  ) {
    return apiError("事件名稱不在允許範圍內。", 400);
  }

  const eventName = body.event_name as AnalyticsEventName;
  const isB2bEvent = eventName.startsWith("b2b_");
  const parsedEventData = isB2bEvent
    ? parseB2bEventData(eventName as B2bAnalyticsEventName, body.event_data)
    : body.event_data === undefined
      ? { data: {} }
      : { error: "B2C 事件不接受額外資料。" };
  if ("error" in parsedEventData) {
    return apiError(parsedEventData.error, 400);
  }

  const context = await getB2bContext();

  if (context.databaseError) {
    return apiError("目前無法確認事件權限。", 503);
  }
  if (isB2bEvent && (!context.user || !context.company)) {
    return apiError("B2B 事件需要有效的企業 session。", 401);
  }
  if (!isB2bEvent && context.company) {
    return apiError("企業 session 不可寫入 B2C 事件。", 403);
  }

  if (isB2bEvent && eventName === "b2b_search_filter") {
    const filterType = parsedEventData.data.filter_type;
    const rawOptionIds = parsedEventData.data.selected_option_ids;
    const optionIds = Array.isArray(rawOptionIds)
      ? rawOptionIds.filter((option): option is string => typeof option === "string")
      : [];

    if (typeof filterType !== "string" || optionIds.length !== (Array.isArray(rawOptionIds) ? rawOptionIds.length : 0)) {
      return apiError("搜尋篩選事件資料不正確。", 400);
    }

    if (filterType === "category" || filterType === "brand") {
      const { data, error } = await context.supabase
        .from("b2b_products")
        .select("category, brand")
        .eq("status", "published");
      if (error) return apiError("目前無法驗證事件篩選值。", 503);
      const allowed = new Set(
        (data ?? []).map((product) => filterType === "category" ? product.category : product.brand),
      );
      if (optionIds.some((option) => !allowed.has(option))) {
        return apiError("事件篩選值不在目前型錄選項內。", 400);
      }
    }

    if (filterType === "tag") {
      const { data, error } = await context.supabase
        .from("b2b_tags")
        .select("slug")
        .eq("is_active", true)
        .in("slug", optionIds);
      if (error) return apiError("目前無法驗證事件標籤。", 503);
      const allowed = new Set((data ?? []).map((tag) => tag.slug));
      if (optionIds.some((option) => !allowed.has(option))) {
        return apiError("事件標籤不在目前型錄選項內。", 400);
      }
    }
  }

  if (body.product_id !== undefined && !isUuid(body.product_id)) {
    return apiError("產品參照格式不正確。", 400);
  }

  const eventDataProductId =
    typeof parsedEventData.data.product_id === "string"
      ? parsedEventData.data.product_id
      : undefined;
  const productId = (body.product_id ?? eventDataProductId) as string | undefined;
  if (body.product_id !== undefined && eventDataProductId && body.product_id !== eventDataProductId) {
    return apiError("事件產品參照不一致。", 400);
  }

  if (
    isB2bEvent &&
    ["b2b_product_finder_result_click", "b2b_rfq_add"].includes(eventName) &&
    !productId
  ) {
    return apiError("事件需要產品參照。", 400);
  }

  let product: {
    id: string;
    category: string;
    brand: string;
  } | null = null;

  if (productId) {
    const { data, error } = await context.supabase
      .from(isB2bEvent ? "b2b_products" : "b2c_products")
      .select("id, category, brand")
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return apiError("目前無法驗證事件產品。", 503);
    }
    if (!data) {
      return apiError("事件產品不存在或尚未啟用。", 400);
    }
    product = data;
  }

  let customerTierSnapshot: string | null = null;
  let channelSnapshot: string | null = null;
  let sessionId: string | null = null;
  const cookieStore = isB2bEvent ? await cookies() : null;
  if (cookieStore) {
    const existing = cookieStore.get(ANALYTICS_SESSION_COOKIE)?.value;
    sessionId = isUuid(existing) ? existing : crypto.randomUUID();
  }

  if (isB2bEvent && context.company) {
    try {
      const snapshot = await resolveCustomerSnapshot(context.company.client_code);
      customerTierSnapshot = snapshot.customerTierSnapshot;
      channelSnapshot = snapshot.channelSnapshot;
    } catch {
      return apiError("目前無法建立事件級距快照。", 503);
    }
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  if (isB2bEvent && eventName === "b2b_rfq_submit") {
    const rfqId = parsedEventData.data.rfq_id;
    const { data: rfq, error: rfqError } = await admin
      .from("b2b_rfqs")
      .select("id")
      .eq("id", rfqId as string)
      .eq("company_id", context.company?.id ?? "")
      .maybeSingle();
    if (rfqError) return apiError("目前無法驗證詢價事件。", 503);
    if (!rfq) return apiError("詢價事件參照不存在。", 400);
  }

  const { data: event, error } = await admin
    .from("analytics_events")
    .insert({
      event_name: eventName,
      surface: isB2bEvent ? "b2b" : "b2c",
      product_reference: product?.id ?? null,
      product_category: product?.category ?? null,
      product_brand: product?.brand ?? null,
      customer_tier_snapshot: customerTierSnapshot,
      channel_snapshot: channelSnapshot,
      actor_user_id: isB2bEvent ? context.user?.id ?? null : null,
      company_id: isB2bEvent ? context.company?.id ?? null : null,
      session_id: sessionId,
      customer_code_snapshot: isB2bEvent ? context.company?.client_code ?? null : null,
      event_data: parsedEventData.data,
    })
    .select("id, event_name, surface, occurred_at")
    .single();

  if (error || !event) {
    console.error("Analytics event insert failed", error);
    return apiError("目前無法保存分析事件。", 503);
  }

  if (cookieStore && sessionId) {
    cookieStore.set(ANALYTICS_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      maxAge: ANALYTICS_SESSION_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return json({ event }, 201);
}

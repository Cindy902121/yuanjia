import {
  apiError,
  isUuid,
  json,
  readJson,
} from "@/lib/api";
import { getB2bContext } from "@/lib/auth-context";
import { resolveCustomerSnapshot } from "@/lib/customer-rules";
import {
  isAnalyticsEventName,
  type AnalyticsEventName,
} from "@/lib/analytics-events";
import { createAdminClient } from "@/lib/supabase/admin";

type EventBody = {
  event_name?: unknown;
  product_id?: unknown;
};

export async function POST(request: Request) {
  const body = (await readJson(request)) as EventBody | null;

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => key !== "event_name" && key !== "product_id") ||
    !isAnalyticsEventName(body.event_name)
  ) {
    return apiError("事件名稱不在允許範圍內。", 400);
  }

  const eventName = body.event_name as AnalyticsEventName;
  const isB2bEvent = eventName.startsWith("b2b_");
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
  if (body.product_id !== undefined && !isUuid(body.product_id)) {
    return apiError("產品參照格式不正確。", 400);
  }

  const productId = body.product_id as string | undefined;
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
    })
    .select("id, event_name, surface, occurred_at")
    .single();

  if (error || !event) {
    return apiError("目前無法保存分析事件。", 503);
  }

  return json({ event }, 201);
}

import { apiError, isUuid, json } from "@/lib/api";
import { getAdminContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";

function parseTaipeiDate(value: string | null, exclusiveEnd = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return null;
  }
  return new Date(
    Date.UTC(year, month - 1, day + (exclusiveEnd ? 1 : 0)) - 8 * 60 * 60 * 1000,
  ).toISOString();
}

async function hasEventValue(
  admin: ReturnType<typeof createAdminClient>,
  field: string,
  value: string,
) {
  const { data, error } = await admin
    .from("analytics_events")
    .select("id")
    .eq(field, value)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function requireAdmin() {
  const context = await getAdminContext();
  if (!context.user) {
    return { response: apiError("請先登入管理者帳號。", 401) };
  }
  if (context.configurationError || context.databaseError) {
    return { response: apiError("目前無法確認管理者權限。", 503) };
  }
  if (context.role !== "admin") {
    return { response: apiError("你沒有管理者權限。", 403) };
  }
  return {};
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  const url = new URL(request.url);
  const dateFromValue = url.searchParams.get("date_from");
  const dateToValue = url.searchParams.get("date_to");
  const dateFrom = parseTaipeiDate(dateFromValue);
  const dateTo = parseTaipeiDate(dateToValue, true);
  if (
    (url.searchParams.has("date_from") && !dateFrom) ||
    (url.searchParams.has("date_to") && !dateTo) ||
    (dateFrom && dateTo && dateFrom >= dateTo)
  ) {
    return apiError("日期篩選格式不正確。", 400);
  }

  const tierValue = url.searchParams.get("customer_tier_snapshot");
  const channelValue = url.searchParams.get("channel_snapshot");
  const productId = url.searchParams.get("product_reference");
  const categoryValue = url.searchParams.get("product_category");
  const brandValue = url.searchParams.get("product_brand");
  const tier = tierValue?.trim();
  const channel = channelValue?.trim();
  const category = categoryValue?.trim();
  const brand = brandValue?.trim();

  if (
    (url.searchParams.has("customer_tier_snapshot") && !tier) ||
    (url.searchParams.has("channel_snapshot") && !channel) ||
    (url.searchParams.has("product_category") && !category) ||
    (url.searchParams.has("product_brand") && !brand) ||
    (url.searchParams.has("product_reference") && !productId) ||
    (productId !== null && !isUuid(productId))
  ) {
    return apiError("產品篩選格式不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  if (productId) {
    const [{ data: b2cProduct, error: b2cError }, { data: b2bProduct, error: b2bError }] = await Promise.all([
      admin.from("b2c_products").select("id").eq("id", productId).maybeSingle(),
      admin.from("b2b_products").select("id").eq("id", productId).maybeSingle(),
    ]);
    if (b2cError || b2bError) return apiError("目前無法確認產品篩選。", 503);
    if (!b2cProduct && !b2bProduct) return apiError("產品篩選不存在。", 400);
  }

  try {
    const valueChecks = await Promise.all([
      tier ? hasEventValue(admin, "customer_tier_snapshot", tier) : true,
      channel ? hasEventValue(admin, "channel_snapshot", channel) : true,
      category ? hasEventValue(admin, "product_category", category) : true,
      brand ? hasEventValue(admin, "product_brand", brand) : true,
    ]);
    if (valueChecks.some((exists) => !exists)) {
      return apiError("分析篩選值不存在。", 400);
    }
  } catch {
    return apiError("目前無法確認分析篩選值。", 503);
  }

  let eventQuery = admin
    .from("analytics_events")
    .select(
      "event_name, surface, product_reference, product_category, product_brand, customer_tier_snapshot, channel_snapshot, occurred_at",
    )
    .order("occurred_at", { ascending: false })
    .limit(10000);

  if (dateFrom) {
    eventQuery = eventQuery.gte("occurred_at", dateFrom);
  }
  if (dateTo) {
    eventQuery = eventQuery.lt("occurred_at", dateTo);
  }
  if (tier) {
    eventQuery = eventQuery.eq("customer_tier_snapshot", tier);
  }
  if (channel) {
    eventQuery = eventQuery.eq("channel_snapshot", channel);
  }
  if (productId) {
    eventQuery = eventQuery.eq("product_reference", productId);
  }
  if (category) {
    eventQuery = eventQuery.eq("product_category", category);
  }
  if (brand) {
    eventQuery = eventQuery.eq("product_brand", brand);
  }

  const { data: events, error: eventError } = await eventQuery;
  if (eventError) {
    return apiError("目前無法讀取分析事件。", 503);
  }

  const eventsByName: Record<string, number> = {};
  const eventsBySurface = { b2c: 0, b2b: 0 };
  for (const event of events ?? []) {
    eventsByName[event.event_name] = (eventsByName[event.event_name] ?? 0) + 1;
    const surface = event.surface as "b2b" | "b2c";
    if (surface === "b2b" || surface === "b2c") {
      eventsBySurface[surface] += 1;
    }
  }

  const { data: rfqs, error: rfqError } = await admin
    .from("b2b_rfqs")
    .select("id, created_at")
    .limit(10000);
  if (rfqError) {
    return apiError("目前無法讀取詢價分析。", 503);
  }

  const rfqIds = (rfqs ?? []).map((rfq) => rfq.id);
  const { data: rfqItems, error: itemError } =
    rfqIds.length > 0
      ? await admin
          .from("b2b_rfq_items")
          .select("product_id, quantity")
          .in("rfq_id", rfqIds)
      : { data: [], error: null };

  if (itemError) {
    return apiError("目前無法讀取詢價品項分析。", 503);
  }

  const quantitiesByProduct = new Map<string, number>();
  for (const item of rfqItems ?? []) {
    quantitiesByProduct.set(
      item.product_id,
      (quantitiesByProduct.get(item.product_id) ?? 0) + Number(item.quantity),
    );
  }

  const rankingIds = [...quantitiesByProduct.keys()];
  const { data: rankingProducts, error: rankingError } =
    rankingIds.length > 0
      ? await admin
          .from("b2b_products")
          .select("id, product_code, name")
          .in("id", rankingIds)
      : { data: [], error: null };

  if (rankingError) {
    return apiError("目前無法整理詢價排名。", 503);
  }

  const productById = new Map(
    (rankingProducts ?? []).map((product) => [product.id, product]),
  );
  const rfqProductRanking = rankingIds
    .map((id) => ({
      ...(productById.get(id) ?? { id }),
      requested_quantity: quantitiesByProduct.get(id) ?? 0,
    }))
    .sort((left, right) => right.requested_quantity - left.requested_quantity);

  return json({
    filters: {
      date_from: dateFromValue ?? null,
      date_to: dateToValue ?? null,
      customer_tier_snapshot: tier ?? null,
      channel_snapshot: channel ?? null,
      product_reference: productId ?? null,
      product_category: category ?? null,
      product_brand: brand ?? null,
    },
    totals: {
      events: events?.length ?? 0,
      b2b_events: eventsBySurface.b2b,
      b2c_events: eventsBySurface.b2c,
      rfqs: rfqs?.length ?? 0,
    },
    events_by_name: eventsByName,
    events_by_surface: eventsBySurface,
    rfq_product_ranking: rfqProductRanking,
  });
}

import { apiError, isUuid, json } from "@/lib/api";
import { getAdminContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function requireAdmin() {
  const context = await getAdminContext();
  if (!context.user) {
    return { response: apiError("請先登入管理者帳號。", 401) };
  }
  if (context.configurationError || context.databaseError) {
    return { response: apiError("目前無法確認管理者權限。", 503) };
  }
  if (!context.isAdmin) {
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
  const dateFrom = parseDate(url.searchParams.get("date_from"));
  const dateTo = parseDate(url.searchParams.get("date_to"));
  if (
    (url.searchParams.has("date_from") && !dateFrom) ||
    (url.searchParams.has("date_to") && !dateTo)
  ) {
    return apiError("日期篩選格式不正確。", 400);
  }

  const tier = url.searchParams.get("customer_tier_snapshot")?.trim();
  const channel = url.searchParams.get("channel_snapshot")?.trim();
  const productId = url.searchParams.get("product_reference");
  const category = url.searchParams.get("product_category")?.trim();
  const brand = url.searchParams.get("product_brand")?.trim();

  if (productId && !isUuid(productId)) {
    return apiError("產品篩選格式不正確。", 400);
  }

  const admin = createAdminClient();
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
    eventQuery = eventQuery.lte("occurred_at", dateTo);
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

  let rfqQuery = admin.from("b2b_rfqs").select("id, created_at").limit(10000);
  if (dateFrom) {
    rfqQuery = rfqQuery.gte("created_at", dateFrom);
  }
  if (dateTo) {
    rfqQuery = rfqQuery.lte("created_at", dateTo);
  }
  const { data: rfqs, error: rfqError } = await rfqQuery;
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
    if (productId && item.product_id !== productId) {
      continue;
    }
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
      date_from: dateFrom,
      date_to: dateTo,
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

import { parsePage } from "@/lib/admin-view";
import { apiError, isUuid, json, readJson } from "@/lib/api";
import { requireBusinessAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const RFQ_STATUSES = ["new", "processing", "closed"] as const;
type RfqStatus = (typeof RFQ_STATUSES)[number];

function isRfqStatus(value: unknown): value is RfqStatus {
  return (
    typeof value === "string" &&
    (RFQ_STATUSES as readonly string[]).includes(value)
  );
}

export async function GET(request: Request) {
  const guard = await requireBusinessAdmin();
  if (guard.response) {
    return guard.response;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  if (status !== null && !isRfqStatus(status)) {
    return apiError("詢價狀態不正確。", 400);
  }

  const pagination = parsePage(url.searchParams, 200, 200);
  const sort = url.searchParams.get("sort") ?? "newest";
  const id = url.searchParams.get("id");
  if (!pagination || !["oldest", "newest"].includes(sort) || (id !== null && !isUuid(id))) return apiError("詢價篩選或頁碼不正確。", 400);
  const { page, pageSize } = pagination;
  const admin = createAdminClient();
  let query = admin
    .from("b2b_rfqs")
    .select(
      "id, company_id, customer_tier_snapshot, channel_snapshot, status, total_note, created_at, updated_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: sort === "oldest" })
    .order("id", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (status && !id) {
    query = query.eq("status", status);
  }

  if (id) query = query.eq("id", id).range(0, 0);
  const { data: rfqs, error: rfqError, count } = await query;
  if (rfqError) {
    return apiError("目前無法讀取企業詢價。", 503);
  }

  const rfqIds = (rfqs ?? []).map((rfq) => rfq.id);
  const companyIds = [...new Set((rfqs ?? []).map((rfq) => rfq.company_id))];
  const { data: companies, error: companyError } =
    companyIds.length > 0
      ? await admin
          .from("companies")
          .select("id, client_code, name")
          .in("id", companyIds)
      : { data: [], error: null };
  const { data: items, error: itemError } =
    rfqIds.length > 0
      ? await admin
          .from("b2b_rfq_items")
          .select(
            "id, rfq_id, product_id, specification_option_id, other_specification, other_packaging, specification_text_snapshot, packaging_text_snapshot, quantity, unit, item_note, created_at",
          )
          .in("rfq_id", rfqIds)
      : { data: [], error: null };

  if (companyError || itemError) {
    return apiError("目前無法整理企業詢價資料。", 503);
  }

  const productIds = [...new Set((items ?? []).map((item) => item.product_id))];
  const { data: products, error: productError } =
    productIds.length > 0
      ? await admin
          .from("b2b_products")
          .select("id, product_code, name")
          .in("id", productIds)
      : { data: [], error: null };

  if (productError) {
    return apiError("目前無法整理企業詢價商品。", 503);
  }

  const companyById = new Map((companies ?? []).map((company) => [company.id, company]));
  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const itemsByRfq = new Map<string, Array<Record<string, unknown>>>();
  for (const item of items ?? []) {
    const current = itemsByRfq.get(item.rfq_id) ?? [];
    current.push({
      ...item,
      product: productById.get(item.product_id) ?? null,
    });
    itemsByRfq.set(item.rfq_id, current);
  }

  return json({
    total: count, page, page_size: pageSize,
    rfqs: (rfqs ?? []).map((rfq) => ({
      ...rfq,
      company: companyById.get(rfq.company_id) ?? null,
      items: itemsByRfq.get(rfq.id) ?? [],
    })),
  });
}

export async function PATCH(request: Request) {
  const guard = await requireBusinessAdmin();
  if (guard.response) {
    return guard.response;
  }

  const body = (await readJson(request)) as {
    rfq_id?: unknown;
    status?: unknown;
    expected_updated_at?: unknown;
  } | null;
  if (!isUuid(body?.rfq_id) || !isRfqStatus(body?.status)) {
    return apiError("詢價編號或狀態不正確。", 400);
  }

  if (typeof body.expected_updated_at !== "string" || !Number.isFinite(Date.parse(body.expected_updated_at))) return apiError("請重新讀取詢價後再更新。", 428);
  const admin = createAdminClient();
  const { data: rfq, error } = await admin
    .from("b2b_rfqs")
    .update({ status: body.status })
    .eq("id", body.rfq_id)
    .eq("updated_at", body.expected_updated_at)
    .select("id, status, updated_at")
    .maybeSingle();

  if (error) {
    return apiError("目前無法更新詢價狀態。", 503);
  }
  if (!rfq) {
    return apiError("此資料已被更新或已不存在，請重新讀取後再操作。", 409);
  }

  return json({ rfq });
}

import {
  apiError,
  isNonEmptyString,
  isUuid,
  json,
  parsePositiveNumber,
  readJson,
} from "@/lib/api";
import { getB2bContext } from "@/lib/auth-context";
import { resolveCustomerSnapshot } from "@/lib/customer-rules";
import { isAllowedRfqUnit } from "@/lib/analytics-events";
import { createAdminClient } from "@/lib/supabase/admin";

type RfqItemInput = {
  product_id?: unknown;
  quantity?: unknown;
  unit?: unknown;
  item_note?: unknown;
};

type RfqBody = {
  items?: unknown;
  total_note?: unknown;
};

function getItemNote(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (!isNonEmptyString(value) || value.trim().length > 1000) {
    return undefined;
  }
  return value.trim();
}

export async function GET() {
  const context = await getB2bContext();

  if (!context.user) {
    return apiError("請先登入企業帳號。", 401);
  }
  if (context.databaseError) {
    return apiError("目前無法確認企業權限。", 503);
  }
  if (!context.company) {
    return apiError("此帳號沒有可用的企業權限。", 403);
  }

  const { data: rfqs, error: rfqError } = await context.supabase
    .from("b2b_rfqs")
    .select(
      "id, company_id, customer_tier_snapshot, channel_snapshot, status, total_note, created_at, updated_at",
    )
    .eq("company_id", context.company.id)
    .order("created_at", { ascending: false });

  if (rfqError) {
    return apiError("目前無法讀取詢價紀錄。", 503);
  }

  const rfqIds = (rfqs ?? []).map((rfq) => rfq.id);
  if (rfqIds.length === 0) {
    return json({ rfqs: [] });
  }

  const { data: items, error: itemError } = await context.supabase
    .from("b2b_rfq_items")
    .select("id, rfq_id, product_id, quantity, unit, item_note, created_at")
    .in("rfq_id", rfqIds);

  if (itemError) {
    return apiError("目前無法讀取詢價品項。", 503);
  }

  const itemsByRfq = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const current = itemsByRfq.get(item.rfq_id) ?? [];
    current.push(item);
    itemsByRfq.set(item.rfq_id, current);
  }

  return json({
    rfqs: (rfqs ?? []).map((rfq) => ({
      ...rfq,
      items: itemsByRfq.get(rfq.id) ?? [],
    })),
  });
}

export async function POST(request: Request) {
  const context = await getB2bContext();

  if (!context.user) {
    return apiError("請先登入企業帳號。", 401);
  }
  if (context.databaseError) {
    return apiError("目前無法確認企業權限。", 503);
  }
  if (!context.company) {
    return apiError("此帳號沒有可用的企業權限。", 403);
  }

  const body = (await readJson(request)) as RfqBody | null;
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return apiError("詢價至少需要一項商品。", 400);
  }
  if (body.items.length > 100) {
    return apiError("單次詢價品項不可超過 100 項。", 400);
  }

  const seenProductIds = new Set<string>();
  const items: Array<{
    product_id: string;
    quantity: number;
    unit: string;
    item_note: string | null;
  }> = [];

  for (const rawItem of body.items as RfqItemInput[]) {
    if (!isUuid(rawItem.product_id) || seenProductIds.has(rawItem.product_id)) {
      return apiError("詢價商品資料不正確或有重複商品。", 400);
    }
    if (!isAllowedRfqUnit(rawItem.unit)) {
      return apiError("詢價單位不在允許範圍內。", 400);
    }
    const quantity = parsePositiveNumber(rawItem.quantity);
    const itemNote = getItemNote(rawItem.item_note);

    if (quantity === null || itemNote === undefined) {
      return apiError("詢價品項資料不正確。", 400);
    }

    seenProductIds.add(rawItem.product_id);
    items.push({
      product_id: rawItem.product_id,
      quantity,
      unit: rawItem.unit,
      item_note: itemNote,
    });
  }

  const { data: products, error: productError } = await context.supabase
    .from("b2b_products")
    .select("id")
    .in("id", items.map((item) => item.product_id))
    .eq("is_active", true);

  if (productError) {
    return apiError("目前無法驗證詢價商品。", 503);
  }
  if ((products ?? []).length !== items.length) {
    return apiError("詢價只能包含目前啟用的 B2B 商品。", 400);
  }

  let snapshot;
  try {
    snapshot = await resolveCustomerSnapshot(context.company.client_code);
  } catch {
    return apiError("目前無法建立客戶級距快照。", 503);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: rfq, error: rfqError } = await admin
    .from("b2b_rfqs")
    .insert({
      company_id: context.company.id,
      customer_tier_snapshot: snapshot.customerTierSnapshot,
      channel_snapshot: snapshot.channelSnapshot,
      total_note:
        body.total_note === undefined || body.total_note === null
          ? null
          : isNonEmptyString(body.total_note) && body.total_note.trim().length <= 2000
            ? body.total_note.trim()
            : null,
    })
    .select("id, status")
    .single();

  if (rfqError || !rfq) {
    return apiError("目前無法建立詢價單。", 503);
  }

  const { error: itemError } = await admin
    .from("b2b_rfq_items")
    .insert(items.map((item) => ({ ...item, rfq_id: rfq.id })));

  if (itemError) {
    await admin.from("b2b_rfqs").delete().eq("id", rfq.id);
    return apiError("目前無法建立詢價品項。", 503);
  }

  return json({ rfqId: rfq.id, status: rfq.status }, 201);
}

import {
  apiError,
  isNonEmptyString,
  isUuid,
  json,
  parsePositiveInteger,
  readJson,
} from "@/lib/api";
import { getAdminContext, getB2bContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";

const ORDER_STATUSES = ["created", "processing", "completed"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

type OrderItemInput = {
  product_id?: unknown;
  quantity?: unknown;
};

type MockOrderBody = {
  recipient_name?: unknown;
  recipient_phone?: unknown;
  recipient_email?: unknown;
  delivery_address?: unknown;
  privacy_consent_at?: unknown;
  items?: unknown;
};

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getAdminOnly() {
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

  return { context };
}

export async function POST(request: Request) {
  const b2bContext = await getB2bContext();
  if (b2bContext.databaseError) {
    return apiError("目前無法確認使用者權限。", 503);
  }
  if (b2bContext.company) {
    return apiError("企業 session 不可建立 B2C 展示訂單。", 403);
  }

  const adminContext = await getAdminContext();
  if (adminContext.configurationError || adminContext.databaseError) {
    return apiError("目前無法確認使用者權限。", 503);
  }
  if (adminContext.isAdmin) {
    return apiError("管理者不可建立 B2C 展示訂單。", 403);
  }

  const body = (await readJson(request)) as MockOrderBody | null;

  if (
    !body ||
    !isNonEmptyString(body.recipient_name) ||
    !isNonEmptyString(body.recipient_phone) ||
    !isNonEmptyString(body.recipient_email) ||
    !isNonEmptyString(body.delivery_address) ||
    !isNonEmptyString(body.privacy_consent_at) ||
    !Array.isArray(body.items) ||
    body.items.length === 0
  ) {
    return apiError("請完整填寫訂單與收件資訊。", 400);
  }
  if (
    body.recipient_name.trim().length > 100 ||
    body.recipient_phone.trim().length > 30 ||
    body.recipient_email.trim().length > 254 ||
    body.delivery_address.trim().length > 500 ||
    !isEmail(body.recipient_email.trim())
  ) {
    return apiError("訂單欄位格式不正確。", 400);
  }
  if (body.items.length > 100) {
    return apiError("單次訂單品項不可超過 100 項。", 400);
  }

  const consentDate = new Date(body.privacy_consent_at);
  if (Number.isNaN(consentDate.getTime())) {
    return apiError("隱私權同意時間格式不正確。", 400);
  }

  const seenProductIds = new Set<string>();
  const itemInputs: Array<{ product_id: string; quantity: number }> = [];
  for (const item of body.items as OrderItemInput[]) {
    if (!isUuid(item.product_id) || seenProductIds.has(item.product_id)) {
      return apiError("訂單商品資料不正確或有重複商品。", 400);
    }
    const quantity = parsePositiveInteger(item.quantity);
    if (quantity === null) {
      return apiError("訂單商品數量必須是正整數。", 400);
    }
    seenProductIds.add(item.product_id);
    itemInputs.push({ product_id: item.product_id, quantity });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: products, error: productError } = await admin
    .from("b2c_products")
    .select("id, price")
    .in("id", itemInputs.map((item) => item.product_id))
    .eq("is_active", true);

  if (productError) {
    return apiError("目前無法驗證訂單商品。", 503);
  }
  if ((products ?? []).length !== itemInputs.length) {
    return apiError("訂單只能包含目前啟用的 B2C 商品。", 400);
  }

  const priceByProduct = new Map(
    (products ?? []).map((product) => [product.id, Number(product.price)]),
  );
  const total = itemInputs.reduce(
    (sum, item) => sum + (priceByProduct.get(item.product_id) ?? 0) * item.quantity,
    0,
  );

  const { data: order, error: orderError } = await admin
    .from("b2c_orders")
    .insert({
      recipient_name: body.recipient_name.trim(),
      recipient_phone: body.recipient_phone.trim(),
      recipient_email: body.recipient_email.trim(),
      delivery_address: body.delivery_address.trim(),
      privacy_consent_at: consentDate.toISOString(),
    })
    .select("id, status, created_at")
    .single();

  if (orderError || !order) {
    return apiError("目前無法建立展示訂單。", 503);
  }

  const { error: itemError } = await admin
    .from("b2c_order_items")
    .insert(
      itemInputs.map((item) => ({
        mock_order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: priceByProduct.get(item.product_id),
      })),
    );

  if (itemError) {
    await admin.from("b2c_orders").delete().eq("id", order.id);
    return apiError("目前無法建立展示訂單品項。", 503);
  }

  return json(
    {
      orderId: order.id,
      status: order.status,
      createdAt: order.created_at,
      total,
    },
    201,
  );
}

export async function GET(request: Request) {
  const result = await getAdminOnly();
  if (result.response) {
    return result.response;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  if (status && !isOrderStatus(status)) {
    return apiError("訂單狀態不正確。", 400);
  }

  const admin = createAdminClient();
  let query = admin
    .from("b2c_orders")
    .select(
      "id, status, recipient_name, recipient_phone, recipient_email, delivery_address, privacy_consent_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: orders, error } = await query;
  if (error) {
    return apiError("目前無法讀取展示訂單。", 503);
  }

  const orderIds = (orders ?? []).map((order) => order.id);
  const { data: items, error: itemError } =
    orderIds.length > 0
      ? await admin
          .from("b2c_order_items")
          .select("id, mock_order_id, product_id, quantity, unit_price, created_at")
          .in("mock_order_id", orderIds)
      : { data: [], error: null };

  if (itemError) {
    return apiError("目前無法讀取展示訂單品項。", 503);
  }

  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const current = itemsByOrder.get(item.mock_order_id) ?? [];
    current.push(item);
    itemsByOrder.set(item.mock_order_id, current);
  }

  return json({
    orders: (orders ?? []).map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) ?? [],
    })),
  });
}

export async function PATCH(request: Request) {
  const result = await getAdminOnly();
  if (result.response) {
    return result.response;
  }

  const body = (await readJson(request)) as
    | { order_id?: unknown; status?: unknown }
    | null;
  const orderId = body?.order_id;
  if (!isUuid(orderId) || !isOrderStatus(body?.status)) {
    return apiError("訂單編號或狀態不正確。", 400);
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("b2c_orders")
    .update({ status: body.status })
    .eq("id", orderId)
    .select("id, status, updated_at")
    .maybeSingle();

  if (error) {
    return apiError("目前無法更新展示訂單。", 503);
  }
  if (!order) {
    return apiError("找不到指定的展示訂單。", 404);
  }

  return json({ order });
}

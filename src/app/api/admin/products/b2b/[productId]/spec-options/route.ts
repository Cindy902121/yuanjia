import { apiError, isNonEmptyString, isUuid, json, readJson } from "@/lib/api";
import { requireBusinessAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const OPTION_FIELDS =
  "id, product_id, option_code, specification_text, packaging_text, is_active, display_order, created_at, updated_at";

function parseOptionText(value: unknown, label: string) {
  if (!isNonEmptyString(value) || value.trim().length > 500) {
    return { error: `${label}格式不正確。` };
  }
  return { value: value.trim() };
}

function parseOptionCode(value: unknown) {
  if (!isNonEmptyString(value)) {
    return null;
  }
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(code) ? code : null;
}

function parseDisplayOrder(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10000) {
    return null;
  }
  return value;
}

async function getProductId(params: Promise<{ productId: string }>) {
  const { productId } = await params;
  return isUuid(productId) ? productId : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const guard = await requireBusinessAdmin();
  if (guard.response) {
    return guard.response;
  }
  const productId = await getProductId(params);
  if (!productId) {
    return apiError("B2B 商品編號不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: options, error } = await admin
    .from("b2b_product_spec_options")
    .select(OPTION_FIELDS)
    .eq("product_id", productId)
    .order("display_order")
    .order("option_code");
  if (error) {
    return apiError("目前無法讀取商品規格選項。", 503);
  }

  return json({ product_id: productId, options: options ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const guard = await requireBusinessAdmin();
  if (guard.response) {
    return guard.response;
  }
  const productId = await getProductId(params);
  if (!productId) {
    return apiError("B2B 商品編號不正確。", 400);
  }

  const body = (await readJson(request)) as {
    option_code?: unknown;
    specification_text?: unknown;
    packaging_text?: unknown;
    is_active?: unknown;
    display_order?: unknown;
  } | null;
  const optionCode = parseOptionCode(body?.option_code);
  const specification = parseOptionText(body?.specification_text, "規格");
  const packaging = parseOptionText(body?.packaging_text, "包裝");
  const displayOrder = body?.display_order === undefined ? 0 : parseDisplayOrder(body.display_order);
  if (!optionCode || specification.error || packaging.error || displayOrder === null) {
    return apiError("商品規格選項資料格式不正確。", 400);
  }
  if (body?.is_active !== undefined && typeof body.is_active !== "boolean") {
    return apiError("規格選項啟用狀態不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: product, error: productError } = await admin
    .from("b2b_products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (productError) {
    return apiError("目前無法確認 B2B 商品。", 503);
  }
  if (!product) {
    return apiError("找不到指定 B2B 商品。", 404);
  }

  const { data: option, error } = await admin
    .from("b2b_product_spec_options")
    .insert({
      product_id: productId,
      option_code: optionCode,
      specification_text: specification.value,
      packaging_text: packaging.value,
      is_active: body?.is_active ?? true,
      display_order: displayOrder,
    })
    .select(OPTION_FIELDS)
    .single();
  if (error || !option) {
    if (error?.code === "23505") {
      return apiError("規格選項代碼已存在。", 409);
    }
    return apiError("目前無法建立商品規格選項。", 503);
  }

  return json({ option }, 201);
}

import { apiError, isNonEmptyString, isUuid, json, readJson } from "@/lib/api";
import { requireBusinessAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const OPTION_FIELDS =
  "id, product_id, option_code, specification_text, packaging_text, is_active, display_order, created_at, updated_at";

function parseText(value: unknown, label: string) {
  if (!isNonEmptyString(value) || value.trim().length > 500) {
    return { error: `${label}格式不正確。` };
  }
  return { value: value.trim() };
}

function parseDisplayOrder(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10000
    ? value
    : null;
}

async function getIds(params: Promise<{ productId: string; optionId: string }>) {
  const { productId, optionId } = await params;
  return isUuid(productId) && isUuid(optionId) ? { productId, optionId } : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string; optionId: string }> },
) {
  const guard = await requireBusinessAdmin();
  if (guard.response) {
    return guard.response;
  }
  const ids = await getIds(params);
  if (!ids) {
    return apiError("B2B 規格選項路徑不正確。", 400);
  }

  const body = (await readJson(request)) as {
    option_code?: unknown;
    specification_text?: unknown;
    packaging_text?: unknown;
    is_active?: unknown;
    display_order?: unknown;
  } | null;
  if (body?.option_code !== undefined) {
    return apiError("規格選項代碼建立後不可修改。", 400);
  }

  const updates: {
    specification_text?: string;
    packaging_text?: string;
    is_active?: boolean;
    display_order?: number;
  } = {};
  if (body?.specification_text !== undefined) {
    const result = parseText(body.specification_text, "規格");
    if (result.error) {
      return apiError(result.error, 400);
    }
    updates.specification_text = result.value;
  }
  if (body?.packaging_text !== undefined) {
    const result = parseText(body.packaging_text, "包裝");
    if (result.error) {
      return apiError(result.error, 400);
    }
    updates.packaging_text = result.value;
  }
  if (body?.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return apiError("規格選項啟用狀態不正確。", 400);
    }
    updates.is_active = body.is_active;
  }
  if (body?.display_order !== undefined) {
    const displayOrder = parseDisplayOrder(body.display_order);
    if (displayOrder === null) {
      return apiError("規格選項排序不正確。", 400);
    }
    updates.display_order = displayOrder;
  }
  if (Object.keys(updates).length === 0) {
    return apiError("沒有可更新的規格選項欄位。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: option, error } = await admin
    .from("b2b_product_spec_options")
    .update(updates)
    .eq("id", ids.optionId)
    .eq("product_id", ids.productId)
    .select(OPTION_FIELDS)
    .maybeSingle();
  if (error) {
    return apiError("目前無法更新商品規格選項。", 503);
  }
  if (!option) {
    return apiError("找不到指定商品規格選項。", 404);
  }

  return json({ option });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string; optionId: string }> },
) {
  const guard = await requireBusinessAdmin();
  if (guard.response) {
    return guard.response;
  }
  const ids = await getIds(params);
  if (!ids) {
    return apiError("B2B 規格選項路徑不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: option, error } = await admin
    .from("b2b_product_spec_options")
    .update({ is_active: false })
    .eq("id", ids.optionId)
    .eq("product_id", ids.productId)
    .select("id, product_id, is_active, updated_at")
    .maybeSingle();
  if (error) {
    return apiError("目前無法停用商品規格選項。", 503);
  }
  if (!option) {
    return apiError("找不到指定商品規格選項。", 404);
  }

  return json({ option });
}

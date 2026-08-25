import { apiError, isUuid, json, readJson } from "@/lib/api";
import { requireBusinessAdmin } from "@/lib/admin-auth";
import {
  B2B_PRODUCT_STATUSES,
  isB2bProductStatus,
  type B2bProductStatus,
} from "@/lib/admin-catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const guard = await requireBusinessAdmin();
  if (guard.response) {
    return guard.response;
  }

  const body = (await readJson(request)) as {
    product_ids?: unknown;
    status?: unknown;
  } | null;
  const productIds = Array.isArray(body?.product_ids)
    ? [...new Set(body.product_ids)]
    : null;
  if (
    !productIds ||
    productIds.length === 0 ||
    productIds.length > 100 ||
    productIds.some((productId) => !isUuid(productId))
  ) {
    return apiError("請提供 1 到 100 個有效的 B2B 商品編號。", 400);
  }
  if (!isB2bProductStatus(body?.status)) {
    return apiError(`商品狀態必須是 ${B2B_PRODUCT_STATUSES.join("、")} 其中之一。`, 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: products, error } = await admin.rpc("admin_bulk_update_b2b_product_status", {
    product_ids: productIds,
    next_status: body.status as B2bProductStatus,
  });
  if (error) {
    if (error.code === "22023") {
      return apiError("商品狀態轉換不合法。", 409);
    }
    if (error.code === "P0002") {
      return apiError("部分商品不存在。", 404);
    }
    return apiError("目前無法批次更新 B2B 商品狀態。", 503);
  }

  return json({ products: products ?? [] });
}

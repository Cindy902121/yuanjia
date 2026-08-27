import { apiError, isUuid, json, readJson } from "@/lib/api";
import { requireBusinessAdmin } from "@/lib/admin-auth";
import { isB2bProductStatus, type B2bProductStatus } from "@/lib/admin-catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const guard = await requireBusinessAdmin();
  if (guard.response) return guard.response;

  const body = (await readJson(request)) as {
    product_ids?: unknown;
    status?: unknown;
  } | null;
  const productIds = Array.isArray(body?.product_ids)
    ? [...new Set(body.product_ids)]
    : [];
  const status = body?.status;

  if (
    productIds.length === 0 ||
    productIds.length > 500 ||
    productIds.some((id) => !isUuid(id)) ||
    !isB2bProductStatus(status)
  ) {
    return apiError("批次商品狀態資料不正確。", 400);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("admin_bulk_update_b2b_product_status", {
      product_ids: productIds,
      next_status: status as B2bProductStatus,
    });
    if (error) {
      if (error.code === "22023" || error.code === "P0002") {
        return apiError("批次狀態只能使用合法的商品狀態轉換。", 409);
      }
      return apiError("目前無法批次更新商品狀態。", 503);
    }
    return json({ products: data ?? [], status });
  } catch {
    return apiError("目前無法批次更新商品狀態。", 503);
  }
}

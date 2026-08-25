import { apiError, isNonEmptyString, isUuid, json, readJson } from "@/lib/api";
import { requireAdmin, requireBusinessAdmin } from "@/lib/admin-auth";
import { isAdminChannel } from "@/lib/admin-catalog";
import { PRODUCT_IMAGE_BUCKETS, PRODUCT_IMAGE_FIELDS, PRODUCT_IMAGE_TABLES } from "@/lib/product-images";
import { createAdminClient } from "@/lib/supabase/admin";

function isProductStoragePath(value: unknown, productId: string): value is string {
  if (!isNonEmptyString(value)) return false;
  const prefix = `products/${productId}/`;
  return value.startsWith(prefix) && /^[a-f0-9-]+\.(?:jpe?g|png|webp)$/i.test(value.slice(prefix.length));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channel: string; productId: string; imageId: string }> },
) {
  const { channel, productId, imageId } = await params;
  if (!isAdminChannel(channel) || !isUuid(productId) || !isUuid(imageId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }
  const guard = await (channel === "b2b" ? requireBusinessAdmin() : requireAdmin());
  if (guard.response) return guard.response;

  const body = (await readJson(request)) as { storage_path?: unknown } | null;
  if (!isProductStoragePath(body?.storage_path, productId)) {
    return apiError("圖片清理路徑不正確。", 400);
  }

  try {
    const admin = createAdminClient();
    const { data: image, error: imageError } = await admin
      .from(PRODUCT_IMAGE_TABLES[channel])
      .select(PRODUCT_IMAGE_FIELDS)
      .eq("product_id", productId)
      .eq("id", imageId)
      .maybeSingle();
    if (imageError) return apiError("目前無法讀取商品圖片。", 503);
    if (!image) return apiError("找不到指定商品圖片。", 404);
    if (image.storage_path === body.storage_path) {
      return apiError("不可清理目前仍在使用的圖片檔案。", 400);
    }

    const { error: cleanupError } = await admin.storage
      .from(PRODUCT_IMAGE_BUCKETS[channel])
      .remove([body.storage_path]);
    if (cleanupError) return apiError("目前無法清理舊圖片檔案。", 503);

    return json({ cleaned: true, storage_path: body.storage_path });
  } catch {
    return apiError("目前無法清理舊圖片檔案。", 503);
  }
}

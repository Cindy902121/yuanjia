import { randomUUID } from "node:crypto";

import { apiError, isNonEmptyString, isUuid, json, readJson } from "@/lib/api";
import { requireAdmin, requireBusinessAdmin } from "@/lib/admin-auth";
import {
  isAdminChannel,
  PRODUCT_TABLES,
} from "@/lib/admin-catalog";
import {
  attachProductImages,
  imageExtension,
  isProductImageRole,
  PRODUCT_IMAGE_BUCKETS,
  PRODUCT_IMAGE_FIELDS,
  PRODUCT_IMAGE_MAX_DETAILS,
  PRODUCT_IMAGE_TABLES,
  type ProductImageRole,
  validateProductImageFile,
} from "@/lib/product-images";
import { createAdminClient } from "@/lib/supabase/admin";

type ImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  image_role: ProductImageRole;
  alt_text: string;
  sort_order: number;
};

function requireImageAdmin(channel: string) {
  return channel === "b2b" ? requireBusinessAdmin() : requireAdmin();
}

function isProductStoragePath(value: unknown, productId: string): value is string {
  return (
    isNonEmptyString(value) &&
    value.length <= 512 &&
    value.startsWith(`products/${productId}/`) &&
    /^products\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i.test(value)
  );
}

function parseSortOrder(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 10000 ? number : null;
}

function parseAltText(value: unknown) {
  return isNonEmptyString(value) && value.trim().length <= 200 ? value.trim() : null;
}

async function productExists(admin: ReturnType<typeof createAdminClient>, channel: "b2c" | "b2b", productId: string) {
  const { data, error } = await admin
    .from(PRODUCT_TABLES[channel])
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return Boolean(data);
}

async function readImages(
  admin: ReturnType<typeof createAdminClient>,
  channel: "b2c" | "b2b",
  productId: string,
) {
  const { data, error } = await admin
    .from(PRODUCT_IMAGE_TABLES[channel])
    .select(PRODUCT_IMAGE_FIELDS)
    .eq("product_id", productId)
    .order("sort_order")
    .order("id");
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as ImageRow[];
}

async function decoratedImage(
  admin: ReturnType<typeof createAdminClient>,
  channel: "b2c" | "b2b",
  productId: string,
  imageId: string,
) {
  const [product] = await attachProductImages(admin, channel, [{ id: productId }]);
  return product?.images.find((image) => image.id === imageId) ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channel: string; productId: string }> },
) {
  const { channel, productId } = await params;
  const guard = await requireImageAdmin(channel);
  if (guard.response) return guard.response;

  if (!isAdminChannel(channel) || !isUuid(productId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
    if (!(await productExists(admin, channel, productId))) {
      return apiError("找不到指定商品。", 404);
    }
    const [product] = await attachProductImages(admin, channel, [{ id: productId }]);
    return json({ channel, product_id: productId, images: product?.images ?? [] });
  } catch {
    return apiError("目前無法讀取商品圖片。", 503);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channel: string; productId: string }> },
) {
  const { channel, productId } = await params;
  const guard = await requireImageAdmin(channel);
  if (guard.response) return guard.response;

  if (!isAdminChannel(channel) || !isUuid(productId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }

  const form = await request.formData().catch(() => null);
  const fileValue = form?.get("file");
  const file = typeof File !== "undefined" && fileValue instanceof File ? fileValue : null;
  const fileError = validateProductImageFile(file);
  const roleValue = form?.get("image_role") ?? "detail";
  const role = isProductImageRole(roleValue) ? roleValue : null;
  const altText = parseAltText(form?.get("alt_text"));
  const sortOrderValue = form?.get("sort_order");
  const sortOrder = sortOrderValue === null ? null : parseSortOrder(sortOrderValue);
  if (fileError || !role || !altText || (sortOrderValue !== null && sortOrder === null)) {
    return apiError(fileError ?? "商品圖片資料格式不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
    if (!(await productExists(admin, channel, productId))) {
      return apiError("找不到指定商品。", 404);
    }
    const images = await readImages(admin, channel, productId);
    if (role === "cover" && images.some((image) => image.image_role === "cover")) {
      return apiError("每個商品只能有一張封面圖，請使用替換功能。", 409);
    }
    if (role === "detail" && images.filter((image) => image.image_role === "detail").length >= PRODUCT_IMAGE_MAX_DETAILS) {
      return apiError("每個商品最多只能有 5 張細節圖。", 409);
    }

    const extension = imageExtension(file!.type);
    const storagePath = `products/${productId}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage
      .from(PRODUCT_IMAGE_BUCKETS[channel])
      .upload(storagePath, await file!.arrayBuffer(), {
        cacheControl: "3600",
        contentType: file!.type,
        upsert: false,
      });
    if (uploadError) {
      return apiError("目前無法上傳商品圖片。", 503);
    }

    const nextSortOrder = sortOrder ?? Math.max(-1, ...images.map((image) => image.sort_order)) + 1;
    const { data: image, error: insertError } = await admin
      .from(PRODUCT_IMAGE_TABLES[channel])
      .insert({
        product_id: productId,
        storage_path: storagePath,
        image_role: role,
        alt_text: altText,
        sort_order: nextSortOrder,
      })
      .select(PRODUCT_IMAGE_FIELDS)
      .single();
    if (insertError || !image) {
      const { error: cleanupError } = await admin.storage
        .from(PRODUCT_IMAGE_BUCKETS[channel])
        .remove([storagePath]);
      if (channel === "b2b" && cleanupError) {
        return json({
          error: "目前無法保存商品圖片，暫時也無法清理上傳檔案。",
          storage_cleanup: "failed",
          storage_path: storagePath,
        }, 503);
      }
      if (insertError?.code === "23505") {
        return apiError("圖片排序或封面設定與既有圖片衝突。", 409);
      }
      return apiError("目前無法保存商品圖片。", 503);
    }

    if (channel === "b2c") {
      return json({
        channel,
        product_id: productId,
        image: await decoratedImage(admin, channel, productId, image.id),
      }, 201);
    }

    try {
      return json({
        channel,
        product_id: productId,
        image: await decoratedImage(admin, channel, productId, image.id),
      }, 201);
    } catch {
      const { error: deleteError } = await admin
        .from(PRODUCT_IMAGE_TABLES[channel])
        .delete()
        .eq("id", image.id);
      if (deleteError) {
        return apiError("目前無法建立商品圖片網址。", 503);
      }
      const { error: cleanupError } = await admin.storage
        .from(PRODUCT_IMAGE_BUCKETS[channel])
        .remove([storagePath]);
      if (cleanupError) {
        return json({
          error: "目前無法建立商品圖片網址，暫時也無法清理上傳檔案。",
          storage_cleanup: "failed",
          storage_path: storagePath,
        }, 503);
      }
      return apiError("目前無法建立商品圖片網址。", 503);
    }
  } catch {
    return apiError("目前無法處理商品圖片。", 503);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ channel: string; productId: string }> },
) {
  const { channel, productId } = await params;
  const guard = await requireImageAdmin(channel);
  if (guard.response) return guard.response;

  if (!isAdminChannel(channel) || !isUuid(productId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }

  const body = (await readJson(request)) as { image_ids?: unknown } | null;
  if (!body || !Array.isArray(body.image_ids) || body.image_ids.length > 6 || body.image_ids.some((id) => !isUuid(id))) {
    return apiError("image_ids 必須是商品圖片 UUID 陣列。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
    const images = await readImages(admin, channel, productId);
    const imageIds = [...new Set(body.image_ids as string[])];
    if (images.length !== imageIds.length || images.some((image) => !imageIds.includes(image.id))) {
      return apiError("圖片排序清單必須包含該商品的全部圖片。", 400);
    }
    for (const [sortOrder, imageId] of imageIds.entries()) {
      const { error } = await admin
        .from(PRODUCT_IMAGE_TABLES[channel])
        .update({ sort_order: 1000000000 + sortOrder })
        .eq("id", imageId);
      if (error) throw new Error(error.message);
    }
    for (const [sortOrder, imageId] of imageIds.entries()) {
      const { error } = await admin
        .from(PRODUCT_IMAGE_TABLES[channel])
        .update({ sort_order: sortOrder })
        .eq("id", imageId);
      if (error) throw new Error(error.message);
    }
    const [product] = await attachProductImages(admin, channel, [{ id: productId }]);
    return json({ channel, product_id: productId, images: product?.images ?? [] });
  } catch {
    return apiError("目前無法更新商品圖片排序。", 503);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ channel: string; productId: string }> },
) {
  const { channel, productId } = await params;
  const guard = await requireImageAdmin(channel);
  if (guard.response) return guard.response;

  if (!isAdminChannel(channel) || !isUuid(productId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }

  const body = (await readJson(request)) as { storage_path?: unknown } | null;
  if (!body || !isProductStoragePath(body.storage_path, productId)) {
    return apiError("商品圖片清理路徑不正確。", 400);
  }
  if (channel !== "b2b") {
    return apiError("B2C 圖片不支援此清理操作。", 404);
  }

  try {
    const admin = createAdminClient();
    const { data: referencedImage, error: referenceError } = await admin
      .from(PRODUCT_IMAGE_TABLES[channel])
      .select("id")
      .eq("storage_path", body.storage_path)
      .maybeSingle();
    if (referenceError) throw new Error(referenceError.message);
    if (referencedImage) {
      return apiError("圖片檔案仍被商品圖片資料引用，無法清理。", 409);
    }
    const { error } = await admin.storage
      .from(PRODUCT_IMAGE_BUCKETS[channel])
      .remove([body.storage_path]);
    if (error) {
      return json({ error: "商品圖片檔案清理失敗。", storage_cleanup: "failed" }, 503);
    }
    return json({ storage_cleanup: "ok" });
  } catch {
    return json({ error: "商品圖片檔案清理失敗。", storage_cleanup: "failed" }, 503);
  }
}

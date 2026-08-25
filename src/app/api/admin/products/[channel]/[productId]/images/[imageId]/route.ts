import { randomUUID } from "node:crypto";

import { apiError, isNonEmptyString, isUuid, json, readJson } from "@/lib/api";
import { requireAdmin, requireBusinessAdmin } from "@/lib/admin-auth";
import { isAdminChannel } from "@/lib/admin-catalog";
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

function parseSortOrder(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 10000 ? number : null;
}

function parseAltText(value: unknown) {
  return isNonEmptyString(value) && value.trim().length <= 200 ? value.trim() : null;
}

async function readImage(
  admin: ReturnType<typeof createAdminClient>,
  channel: "b2c" | "b2b",
  productId: string,
  imageId: string,
) {
  const { data, error } = await admin
    .from(PRODUCT_IMAGE_TABLES[channel])
    .select(PRODUCT_IMAGE_FIELDS)
    .eq("product_id", productId)
    .eq("id", imageId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ImageRow | null) ?? null;
}

async function imageResponse(
  admin: ReturnType<typeof createAdminClient>,
  channel: "b2c" | "b2b",
  productId: string,
  imageId: string,
) {
  const [product] = await attachProductImages(admin, channel, [{ id: productId }]);
  return product?.images.find((image) => image.id === imageId) ?? null;
}

async function validateRoleLimit(
  admin: ReturnType<typeof createAdminClient>,
  channel: "b2c" | "b2b",
  image: ImageRow,
  nextRole: ProductImageRole,
) {
  const { data, error } = await admin
    .from(PRODUCT_IMAGE_TABLES[channel])
    .select("id, image_role")
    .eq("product_id", image.product_id);
  if (error) throw new Error(error.message);
  const images = (data ?? []) as Array<{ id: string; image_role: ProductImageRole }>;
  if (
    nextRole === "detail" &&
    image.image_role !== "detail" &&
    images.filter((item) => item.image_role === "detail").length >= PRODUCT_IMAGE_MAX_DETAILS
  ) {
    return "每個商品最多只能有 5 張細節圖。";
  }
  return null;
}

async function demoteExistingCover(
  admin: ReturnType<typeof createAdminClient>,
  channel: "b2c" | "b2b",
  productId: string,
  exceptImageId: string,
) {
  const { data: cover, error: readError } = await admin
    .from(PRODUCT_IMAGE_TABLES[channel])
    .select("id")
    .eq("product_id", productId)
    .eq("image_role", "cover")
    .neq("id", exceptImageId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!cover) return null;

  const { error } = await admin
    .from(PRODUCT_IMAGE_TABLES[channel])
    .update({ image_role: "detail" })
    .eq("id", cover.id);
  if (error) throw new Error(error.message);
  return cover.id;
}

async function restoreCover(
  admin: ReturnType<typeof createAdminClient>,
  channel: "b2c" | "b2b",
  coverId: string,
) {
  const { error } = await admin
    .from(PRODUCT_IMAGE_TABLES[channel])
    .update({ image_role: "cover" })
    .eq("id", coverId);
  if (error) throw new Error(error.message);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ channel: string; productId: string; imageId: string }> },
) {
  const { channel, productId, imageId } = await params;
  const guard = await requireImageAdmin(channel);
  if (guard.response) return guard.response;

  if (!isAdminChannel(channel) || !isUuid(productId) || !isUuid(imageId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }

  const body = (await readJson(request)) as {
    image_role?: unknown;
    alt_text?: unknown;
    sort_order?: unknown;
  } | null;
  if (!body || (body.image_role === undefined && body.alt_text === undefined && body.sort_order === undefined)) {
    return apiError("沒有可更新的商品圖片欄位。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
    const image = await readImage(admin, channel, productId, imageId);
    if (!image) return apiError("找不到指定商品圖片。", 404);

    const nextRole = body.image_role === undefined ? image.image_role : body.image_role;
    if (!isProductImageRole(nextRole)) {
      return apiError("圖片角色只能是 cover 或 detail。", 400);
    }
    const altText = body.alt_text === undefined ? image.alt_text : parseAltText(body.alt_text);
    if (!altText) return apiError("圖片替代文字必須是 200 字以內的非空白文字。", 400);
    const sortOrder = body.sort_order === undefined ? undefined : parseSortOrder(body.sort_order);
    if (body.sort_order !== undefined && sortOrder === null) {
      return apiError("圖片排序必須是 0 到 10000 的整數。", 400);
    }
    const roleError = await validateRoleLimit(admin, channel, image, nextRole);
    if (roleError) return apiError(roleError, 409);

    const demotedCoverId = nextRole === "cover" && image.image_role !== "cover"
      ? await demoteExistingCover(admin, channel, productId, imageId)
      : null;
    const updates: Record<string, unknown> = { image_role: nextRole, alt_text: altText };
    if (sortOrder !== undefined) updates.sort_order = sortOrder;
    const { data: updated, error } = await admin
      .from(PRODUCT_IMAGE_TABLES[channel])
      .update(updates)
      .eq("id", imageId)
      .select(PRODUCT_IMAGE_FIELDS)
      .maybeSingle();
    if (error) {
      if (demotedCoverId) await restoreCover(admin, channel, demotedCoverId);
      if (error.code === "23505") return apiError("圖片排序或封面設定與既有圖片衝突。", 409);
      return apiError("目前無法更新商品圖片。", 503);
    }
    if (!updated) {
      if (demotedCoverId) await restoreCover(admin, channel, demotedCoverId);
      return apiError("找不到指定商品圖片。", 404);
    }

    return json({
      channel,
      product_id: productId,
      image: await imageResponse(admin, channel, productId, imageId),
    });
  } catch {
    return apiError("目前無法更新商品圖片。", 503);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ channel: string; productId: string; imageId: string }> },
) {
  const { channel, productId, imageId } = await params;
  const guard = await requireImageAdmin(channel);
  if (guard.response) return guard.response;

  if (!isAdminChannel(channel) || !isUuid(productId) || !isUuid(imageId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }

  const form = await request.formData().catch(() => null);
  const fileValue = form?.get("file");
  const file = typeof File !== "undefined" && fileValue instanceof File ? fileValue : null;
  const fileError = validateProductImageFile(file);
  if (fileError) return apiError(fileError, 400);

  let admin;
  try {
    admin = createAdminClient();
    const image = await readImage(admin, channel, productId, imageId);
    if (!image) return apiError("找不到指定商品圖片。", 404);

    const roleValue = form?.get("image_role");
    const nextRole = roleValue === null ? image.image_role : roleValue;
    if (!isProductImageRole(nextRole)) return apiError("圖片角色只能是 cover 或 detail。", 400);
    const altValue = form?.get("alt_text");
    const altText = altValue === null ? image.alt_text : parseAltText(altValue);
    if (!altText) return apiError("圖片替代文字必須是 200 字以內的非空白文字。", 400);
    const sortValue = form?.get("sort_order");
    const sortOrder = sortValue === null ? image.sort_order : parseSortOrder(sortValue);
    if (sortOrder === null) return apiError("圖片排序必須是 0 到 10000 的整數。", 400);
    const roleError = await validateRoleLimit(admin, channel, image, nextRole);
    if (roleError) return apiError(roleError, 409);

    const extension = imageExtension(file!.type);
    if (!extension) return apiError("圖片格式不正確。", 400);
    const storagePath = `products/${productId}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage
      .from(PRODUCT_IMAGE_BUCKETS[channel])
      .upload(storagePath, await file!.arrayBuffer(), {
        cacheControl: "3600",
        contentType: file!.type,
        upsert: false,
      });
    if (uploadError) return apiError("目前無法上傳商品圖片。", 503);

    const demotedCoverId = nextRole === "cover" && image.image_role !== "cover"
      ? await demoteExistingCover(admin, channel, productId, imageId)
      : null;

    const { data: updated, error: updateError } = await admin
      .from(PRODUCT_IMAGE_TABLES[channel])
      .update({
        storage_path: storagePath,
        image_role: nextRole,
        alt_text: altText,
        sort_order: sortOrder,
      })
      .eq("id", imageId)
      .select(PRODUCT_IMAGE_FIELDS)
      .maybeSingle();
    if (updateError || !updated) {
      const { error: cleanupError } = await admin.storage
        .from(PRODUCT_IMAGE_BUCKETS[channel])
        .remove([storagePath]);
      if (demotedCoverId) await restoreCover(admin, channel, demotedCoverId);
      if (cleanupError) {
        return json({
          error: "目前無法保存商品圖片，暫時也無法清理上傳檔案。",
          storage_cleanup: "failed",
          storage_path: storagePath,
        }, 503);
      }
      return apiError("目前無法保存商品圖片。", 503);
    }

    const { error: cleanupError } = await admin.storage
      .from(PRODUCT_IMAGE_BUCKETS[channel])
      .remove([image.storage_path]);
    return json({
      channel,
      product_id: productId,
      image: await imageResponse(admin, channel, productId, imageId),
      storage_cleanup: cleanupError ? "failed" : "ok",
      ...(cleanupError ? { storage_path: image.storage_path } : {}),
    });
  } catch {
    return apiError("目前無法替換商品圖片。", 503);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ channel: string; productId: string; imageId: string }> },
) {
  const { channel, productId, imageId } = await params;
  const guard = await requireImageAdmin(channel);
  if (guard.response) return guard.response;

  if (!isAdminChannel(channel) || !isUuid(productId) || !isUuid(imageId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
    const image = await readImage(admin, channel, productId, imageId);
    if (!image) return apiError("找不到指定商品圖片。", 404);

    const { error: deleteError } = await admin
      .from(PRODUCT_IMAGE_TABLES[channel])
      .delete()
      .eq("id", imageId);
    if (deleteError) return apiError("目前無法刪除商品圖片資料。", 503);

    const { error: storageError } = await admin.storage
      .from(PRODUCT_IMAGE_BUCKETS[channel])
      .remove([image.storage_path]);
    if (storageError) {
      return json({
        error: "圖片資料已刪除，但檔案清理失敗。",
        deleted: true,
        storage_cleanup: "failed",
        storage_path: image.storage_path,
      }, 503);
    }

    return json({ channel, product_id: productId, image_id: imageId, deleted: true });
  } catch {
    return apiError("目前無法刪除商品圖片。", 503);
  }
}

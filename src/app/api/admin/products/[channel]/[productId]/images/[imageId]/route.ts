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
  if (nextRole === "cover" && images.some((item) => item.id !== image.id && item.image_role === "cover")) {
    return "每個商品只能有一張封面圖。";
  }
  if (
    nextRole === "detail" &&
    image.image_role !== "detail" &&
    images.filter((item) => item.image_role === "detail").length >= PRODUCT_IMAGE_MAX_DETAILS
  ) {
    return "每個商品最多只能有 5 張細節圖。";
  }
  return null;
}

async function reorderImage(
  admin: ReturnType<typeof createAdminClient>,
  channel: "b2c" | "b2b",
  productId: string,
  imageId: string,
  requestedOrder: number,
) {
  const { data, error } = await admin
    .from(PRODUCT_IMAGE_TABLES[channel])
    .select("id, sort_order")
    .eq("product_id", productId)
    .order("sort_order")
    .order("id");
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{ id: string; sort_order: number }>;
  const target = rows.find((row) => row.id === imageId);
  if (!target) throw new Error("商品圖片不存在。");
  const rest = rows.filter((row) => row.id !== imageId);
  const targetIndex = Math.min(requestedOrder, rest.length);
  const ordered = [
    ...rest.slice(0, targetIndex),
    target,
    ...rest.slice(targetIndex),
  ];

  // ponytail: two-phase updates avoid unique sort_order collisions; use a transaction RPC if concurrent reordering matters.
  for (const [index, row] of ordered.entries()) {
    const { error: temporaryError } = await admin
      .from(PRODUCT_IMAGE_TABLES[channel])
      .update({ sort_order: 1000000000 + index })
      .eq("id", row.id);
    if (temporaryError) throw new Error(temporaryError.message);
  }
  for (const [index, row] of ordered.entries()) {
    const { error: finalError } = await admin
      .from(PRODUCT_IMAGE_TABLES[channel])
      .update({ sort_order: index })
      .eq("id", row.id);
    if (finalError) throw new Error(finalError.message);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ channel: string; productId: string; imageId: string }> },
) {
  const { channel, productId, imageId } = await params;
  if (!isAdminChannel(channel) || !isUuid(productId) || !isUuid(imageId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }
  const guard = await (channel === "b2b" ? requireBusinessAdmin() : requireAdmin());
  if (guard.response) return guard.response;

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
    const requestedSortOrder = sortOrder === null ? undefined : sortOrder;
    const roleError = await validateRoleLimit(admin, channel, image, nextRole);
    if (roleError) return apiError(roleError, 409);

    const updates: Record<string, unknown> = { image_role: nextRole, alt_text: altText };
    const { data: updated, error } = await admin
      .from(PRODUCT_IMAGE_TABLES[channel])
      .update(updates)
      .eq("id", imageId)
      .select(PRODUCT_IMAGE_FIELDS)
      .maybeSingle();
    if (error) {
      if (error.code === "23505") return apiError("圖片排序或封面設定與既有圖片衝突。", 409);
      return apiError("目前無法更新商品圖片。", 503);
    }
    if (!updated) return apiError("找不到指定商品圖片。", 404);
    if (typeof requestedSortOrder === "number") {
      await reorderImage(admin, channel, productId, imageId, requestedSortOrder);
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
  if (!isAdminChannel(channel) || !isUuid(productId) || !isUuid(imageId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }
  const guard = await (channel === "b2b" ? requireBusinessAdmin() : requireAdmin());
  if (guard.response) return guard.response;

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
      await admin.storage.from(PRODUCT_IMAGE_BUCKETS[channel]).remove([storagePath]);
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
      storage_cleanup_path: cleanupError ? image.storage_path : null,
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
  if (!isAdminChannel(channel) || !isUuid(productId) || !isUuid(imageId)) {
    return apiError("商品圖片路徑不正確。", 400);
  }
  const guard = await (channel === "b2b" ? requireBusinessAdmin() : requireAdmin());
  if (guard.response) return guard.response;

  let admin;
  try {
    admin = createAdminClient();
    const image = await readImage(admin, channel, productId, imageId);
    if (!image) return apiError("找不到指定商品圖片。", 404);

    const { error: storageError } = await admin.storage
      .from(PRODUCT_IMAGE_BUCKETS[channel])
      .remove([image.storage_path]);
    if (storageError) return apiError("目前無法刪除商品圖片檔案。", 503);

    const { error: deleteError } = await admin
      .from(PRODUCT_IMAGE_TABLES[channel])
      .delete()
      .eq("id", imageId);
    if (deleteError) return apiError("目前無法刪除商品圖片資料。", 503);

    return json({ channel, product_id: productId, image_id: imageId, deleted: true });
  } catch {
    return apiError("目前無法刪除商品圖片。", 503);
  }
}

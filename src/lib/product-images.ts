import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export type ProductImageChannel = "b2c" | "b2b";
export type ProductImageRole = "cover" | "detail";

export const PRODUCT_IMAGE_TABLES: Record<
  ProductImageChannel,
  "b2c_product_images" | "b2b_product_images"
> = {
  b2c: "b2c_product_images",
  b2b: "b2b_product_images",
};

export const PRODUCT_IMAGE_BUCKETS: Record<ProductImageChannel, "b2c-media" | "b2b-media"> = {
  b2c: "b2c-media",
  b2b: "b2b-media",
};

export const PRODUCT_IMAGE_FIELDS =
  "id, product_id, storage_path, image_role, alt_text, sort_order, created_at, updated_at";

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MAX_DETAILS = 5;
export const PRODUCT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function isProductImageRole(value: unknown): value is ProductImageRole {
  return value === "cover" || value === "detail";
}

export function isProductImageChannel(value: string): value is ProductImageChannel {
  return value === "b2c" || value === "b2b";
}

export function imageExtension(contentType: string) {
  return {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[contentType] ?? null;
}

export function validateProductImageFile(file: File | null) {
  if (!file) {
    return "請選擇圖片檔案。";
  }
  if (!(PRODUCT_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "圖片格式只允許 JPEG、PNG 或 WebP。";
  }
  if (file.size <= 0 || file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return "單張圖片大小必須在 5 MB 以內。";
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  }[file.type];
  if (!extension || !allowedExtensions?.includes(extension)) {
    return "圖片副檔名與檔案格式不一致。";
  }
  return null;
}

export function imageUrl(
  client: SupabaseClient,
  channel: ProductImageChannel,
  storagePath: string,
) {
  if (channel === "b2c") {
    return client.storage.from(PRODUCT_IMAGE_BUCKETS[channel]).getPublicUrl(storagePath).data.publicUrl;
  }
  return null;
}

async function resolveImageUrl(
  client: SupabaseClient,
  channel: ProductImageChannel,
  storagePath: string,
) {
  const publicUrl = imageUrl(client, channel, storagePath);
  if (publicUrl) {
    return publicUrl;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(PRODUCT_IMAGE_BUCKETS[channel])
    .createSignedUrl(storagePath, 600);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "目前無法建立商品圖片網址。");
  }
  return data.signedUrl;
}

export async function attachProductImages<T extends { id: string }>(
  client: SupabaseClient,
  channel: ProductImageChannel,
  products: T[],
) {
  if (products.length === 0) {
    return [];
  }

  const { data: images, error } = await client
    .from(PRODUCT_IMAGE_TABLES[channel])
    .select(PRODUCT_IMAGE_FIELDS)
    .in("product_id", products.map((product) => product.id))
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const imagesByProduct = new Map<string, Array<Record<string, unknown>>>();
  for (const image of images ?? []) {
    const current = imagesByProduct.get(image.product_id) ?? [];
    current.push({
      id: image.id,
      image_role: image.image_role,
      alt_text: image.alt_text,
      sort_order: image.sort_order,
      url: await resolveImageUrl(client, channel, image.storage_path),
    });
    imagesByProduct.set(image.product_id, current);
  }

  return products.map((product) => ({
    ...product,
    images: imagesByProduct.get(product.id) ?? [],
  }));
}

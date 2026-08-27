import { apiError, json, readJson } from "@/lib/api";
import { requireAdmin, requireBusinessAdmin } from "@/lib/admin-auth";
import {
  ADMIN_PRODUCT_FIELDS,
  isB2bProductStatus,
  isAdminChannel,
  parseProductInput,
  PRODUCT_TABLES,
} from "@/lib/admin-catalog";
import { resolveProductImageUrl } from "@/lib/product-images";
import { createAdminClient } from "@/lib/supabase/admin";

function requireProductAdmin(channel: string) {
  return channel === "b2b" ? requireBusinessAdmin() : requireAdmin();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channel: string }> },
) {
  const { channel } = await params;
  const guard = await requireProductAdmin(channel);
  if (guard.response) {
    return guard.response;
  }

  if (!isAdminChannel(channel)) {
    return apiError("商品通路不正確。", 400);
  }

  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("include_inactive") === "true";
  const search = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status")?.trim();
  if (status && (channel !== "b2b" || !isB2bProductStatus(status))) {
    return apiError("B2B 商品狀態不正確。", 400);
  }
  const admin = createAdminClient();
  let query = admin
    .from(PRODUCT_TABLES[channel])
    .select(ADMIN_PRODUCT_FIELDS[channel])
    .order("updated_at", { ascending: false })
    .limit(500);

  if (!includeInactive) {
    query = query.eq(channel === "b2b" ? "status" : "is_active", channel === "b2b" ? "published" : true);
  }
  if (channel === "b2b" && status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(
      channel === "b2c"
      ? `name.ilike.%${search}%,brand.ilike.%${search}%,category.ilike.%${search}%`
      : `name.ilike.%${search}%,product_code.ilike.%${search}%,brand.ilike.%${search}%,category.ilike.%${search}%`,
    );
  }

  const { data: products, error } = await query;
  if (error) {
    return apiError("目前無法讀取管理商品。", 503);
  }

  let result = (products ?? []) as unknown as Array<Record<string, unknown> & { id: string }>;
  if (channel === "b2b") {
    const productIds = result.map((product) => product.id);
    const { data: images, error: imageError } =
      productIds.length > 0
        ? await admin
            .from("b2b_product_images")
            .select("id, product_id, storage_path, image_role, sort_order")
            .in("product_id", productIds)
            .order("sort_order", { ascending: true })
            .order("id", { ascending: true })
            .limit(5000)
        : { data: [], error: null };
    if (imageError) {
      return apiError("目前無法整理 B2B 商品圖片數量。", 503);
    }
    const imageCounts = new Map<string, number>();
    const thumbnailRows = new Map<string, { storage_path: string; image_role: string }>();
    for (const image of (images ?? []) as Array<{
      product_id: string;
      storage_path: string;
      image_role: string;
    }>) {
      imageCounts.set(image.product_id, (imageCounts.get(image.product_id) ?? 0) + 1);
      const current = thumbnailRows.get(image.product_id);
      if (!current || image.image_role === "cover") {
        thumbnailRows.set(image.product_id, image);
      }
    }
    const thumbnailUrls = new Map<string, string>();
    for (const [productId, image] of thumbnailRows) {
      try {
        thumbnailUrls.set(productId, await resolveProductImageUrl(admin, "b2b", image.storage_path));
      } catch {
        // A missing storage object should not hide the rest of the catalog list.
      }
    }
    result = result.map((product) => ({
      ...product,
      image_count: imageCounts.get(product.id) ?? 0,
      thumbnail_url: thumbnailUrls.get(product.id) ?? null,
    }));
  }

  return json({ channel, products: result });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channel: string }> },
) {
  const { channel } = await params;
  const guard = await requireProductAdmin(channel);
  if (guard.response) {
    return guard.response;
  }

  if (!isAdminChannel(channel)) {
    return apiError("商品通路不正確。", 400);
  }

  const body = await readJson(request);
  const parsed = parseProductInput(body, channel, "create");
  if (!("payload" in parsed)) {
    return apiError(parsed.error, 400);
  }
  const payload = parsed.payload;
  if (!payload) {
    return apiError("商品資料格式不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  if (channel === "b2c" && payload.is_active === true) {
    return apiError("B2C 商品請先以下架狀態建立，再設定封面圖後上架。", 409);
  }

  const { data: product, error } = await admin
    .from(PRODUCT_TABLES[channel])
    .insert(payload)
    .select(ADMIN_PRODUCT_FIELDS[channel])
    .single();

  if (error || !product) {
    if (error?.code === "23505") {
      return apiError("商品識別碼已存在。", 409);
    }
    return apiError("目前無法建立商品。", 503);
  }

  return json({ channel, product }, 201);
}

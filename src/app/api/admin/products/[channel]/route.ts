import { apiError, json, readJson } from "@/lib/api";
import { requireAdmin, requireBusinessAdmin } from "@/lib/admin-auth";
import {
  ADMIN_PRODUCT_FIELDS,
  isB2bProductStatus,
  isAdminChannel,
  parseProductInput,
  PRODUCT_TABLES,
} from "@/lib/admin-catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channel: string }> },
) {
  const { channel } = await params;
  if (!isAdminChannel(channel)) {
    return apiError("商品通路不正確。", 400);
  }
  const guard = await (channel === "b2b" ? requireBusinessAdmin() : requireAdmin());
  if (guard.response) return guard.response;

  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("include_inactive") === "true";
  const search = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status")?.trim();
  if (channel === "b2b" && status && !isB2bProductStatus(status)) {
    return apiError("B2B 商品狀態不正確。", 400);
  }
  const admin = createAdminClient();
  let query = admin
    .from(PRODUCT_TABLES[channel])
    .select(ADMIN_PRODUCT_FIELDS[channel])
    .order("updated_at", { ascending: false })
    .limit(500);

  if (channel === "b2b") {
    if (status) {
      query = query.eq("status", status);
    } else if (!includeInactive) {
      query = query.eq("status", "published");
    }
  } else if (!includeInactive) {
    query = query.eq("is_active", true);
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

  const productRows = (products ?? []) as unknown as Array<Record<string, unknown> & { id: string }>;
  if (channel === "b2b" && productRows.length > 0) {
    const { data: images, error: imageError } = await admin
      .from("b2b_product_images")
      .select("product_id")
      .in("product_id", productRows.map((product) => product.id));
    if (imageError) {
      return apiError("目前無法整理商品圖片數量。", 503);
    }
    const imageCounts = new Map<string, number>();
    for (const image of images ?? []) {
      imageCounts.set(image.product_id, (imageCounts.get(image.product_id) ?? 0) + 1);
    }
    return json({
      channel,
      products: productRows.map((product) => ({
        ...product,
        image_count: imageCounts.get(product.id) ?? 0,
      })),
    });
  }

  return json({ channel, products: productRows });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channel: string }> },
) {
  const { channel } = await params;
  if (!isAdminChannel(channel)) {
    return apiError("商品通路不正確。", 400);
  }
  const guard = await (channel === "b2b" ? requireBusinessAdmin() : requireAdmin());
  if (guard.response) return guard.response;

  const body = await readJson(request);
  const parsed = parseProductInput(body, channel, "create");
  if (!parsed.payload) {
    return apiError(parsed.error ?? "商品資料格式不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: product, error } = await admin
    .from(PRODUCT_TABLES[channel])
    .insert(parsed.payload)
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

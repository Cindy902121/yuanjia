import { apiError, isUuid, json, readJson } from "@/lib/api";
import { attachB2bProductSpecOptions, attachProductTags } from "@/lib/catalog";
import { requireAdmin, requireBusinessAdmin } from "@/lib/admin-auth";
import {
  ADMIN_PRODUCT_FIELDS,
  isAdminChannel,
  parseProductInput,
  PRODUCT_TABLES,
} from "@/lib/admin-catalog";
import { attachProductImages } from "@/lib/product-images";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ channel: string; productId: string }> },
) {
  const { channel, productId } = await params;
  if (!isAdminChannel(channel) || !isUuid(productId)) {
    return apiError("商品路徑不正確。", 400);
  }
  const guard = await (channel === "b2b" ? requireBusinessAdmin() : requireAdmin());
  if (guard.response) return guard.response;

  const body = await readJson(request);
  const parsed = parseProductInput(body, channel, "update");
  if (!parsed.payload) {
    return apiError(parsed.error ?? "商品資料格式不正確。", 400);
  }
  if (Object.keys(parsed.payload).length === 0) {
    return apiError("沒有可更新的商品欄位。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: product, error } = await admin
    .from(PRODUCT_TABLES[channel])
    .update(parsed.payload)
    .eq("id", productId)
    .select(ADMIN_PRODUCT_FIELDS[channel])
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return apiError("商品識別碼已存在。", 409);
    }
    return apiError("目前無法更新商品上架狀態。", 503);
  }
  if (!product) {
    return apiError("找不到指定商品。", 404);
  }

  return json({ channel, product });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channel: string; productId: string }> },
) {
  const { channel, productId } = await params;
  if (!isAdminChannel(channel) || !isUuid(productId)) {
    return apiError("商品路徑不正確。", 400);
  }
  const guard = await (channel === "b2b" ? requireBusinessAdmin() : requireAdmin());
  if (guard.response) return guard.response;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: product, error } = await admin
    .from(PRODUCT_TABLES[channel])
    .select(ADMIN_PRODUCT_FIELDS[channel])
    .eq("id", productId)
    .maybeSingle();
  if (error) {
    return apiError("目前無法讀取商品。", 503);
  }
  if (!product) {
    return apiError("找不到指定商品。", 404);
  }

  try {
    const withTags = await attachProductTags(
      admin,
      {
        tagTable: channel === "b2c" ? "b2c_tags" : "b2b_tags",
        relationTable: channel === "b2c" ? "b2c_product_tags" : "b2b_product_tags",
      },
      [product as unknown as { id: string }],
    );
    const withOptions =
      channel === "b2b"
        ? await attachB2bProductSpecOptions(admin, withTags)
        : withTags;
    const withImages = await attachProductImages(admin, channel, withOptions);
    return json({ channel, product: withImages[0] });
  } catch {
    return apiError("目前無法整理商品管理資料。", 503);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ channel: string; productId: string }> },
) {
  const { channel, productId } = await params;
  if (!isAdminChannel(channel) || !isUuid(productId)) {
    return apiError("商品路徑不正確。", 400);
  }
  const guard = await (channel === "b2b" ? requireBusinessAdmin() : requireAdmin());
  if (guard.response) return guard.response;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: product, error } = await admin
    .from(PRODUCT_TABLES[channel])
    .update(channel === "b2b" ? { status: "offline" } : { is_active: false })
    .eq("id", productId)
    .select(channel === "b2b" ? "id, status, is_active, updated_at" : "id, is_active, updated_at")
    .maybeSingle();

  if (error) {
    return apiError("目前無法停用商品。", 503);
  }
  if (!product) {
    return apiError("找不到指定商品。", 404);
  }

  return json({ channel, product });
}

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

function requireProductAdmin(channel: string) {
  return channel === "b2b" ? requireBusinessAdmin() : requireAdmin();
}

async function b2cActivationError(
  admin: ReturnType<typeof createAdminClient>,
  productId: string,
) {
  const { data: cover, error } = await admin
    .from("b2c_product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("image_role", "cover")
    .maybeSingle();
  if (error) {
    return apiError("目前無法確認商品封面圖。", 503);
  }
  return cover ? null : apiError("B2C 商品上架前必須先設定封面圖。", 409);
}

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ channel: string; productId: string }> },
) {
  const { channel, productId } = await params;
  const guard = await requireProductAdmin(channel);
  if (guard.response) {
    return guard.response;
  }

  if (!isAdminChannel(channel) || !isUuid(productId)) {
    return apiError("商品路徑不正確。", 400);
  }

  const body = await readJson(request);
  const parsed = parseProductInput(body, channel, "update");
  if (!("payload" in parsed)) {
    return apiError(parsed.error, 400);
  }
  const payload = parsed.payload;
  if (!payload) {
    return apiError("商品資料格式不正確。", 400);
  }
  if (Object.keys(payload).length === 0) {
    return apiError("沒有可更新的商品欄位。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  if (channel === "b2c" && payload.is_active === true) {
    const activationError = await b2cActivationError(admin, productId);
    if (activationError) {
      return activationError;
    }
  }

  const { data: product, error } = await admin
    .from(PRODUCT_TABLES[channel])
    .update(payload)
    .eq("id", productId)
    .select(ADMIN_PRODUCT_FIELDS[channel])
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return apiError("商品識別碼已存在。", 409);
    }
    return apiError("目前無法更新商品。", 503);
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
  const guard = await requireProductAdmin(channel);
  if (guard.response) {
    return guard.response;
  }

  if (!isAdminChannel(channel) || !isUuid(productId)) {
    return apiError("商品路徑不正確。", 400);
  }

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
  const guard = await requireProductAdmin(channel);
  if (guard.response) {
    return guard.response;
  }

  if (!isAdminChannel(channel) || !isUuid(productId)) {
    return apiError("商品路徑不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  if (channel === "b2b") {
    const { data: products, error } = await admin.rpc("admin_bulk_update_b2b_product_status", {
      product_ids: [productId],
      next_status: "offline",
    });
    if (error) {
      if (error.code === "22023") {
        return apiError("商品目前不可直接下架，請先完成合法狀態轉換。", 409);
      }
      if (error.code === "P0002") {
        return apiError("找不到指定商品。", 404);
      }
      return apiError("目前無法停用商品。", 503);
    }
    const product = (products?.[0] ?? null) as {
      id: string;
      status: string;
      updated_at: string;
    } | null;
    if (!product) {
      return apiError("找不到指定商品。", 404);
    }
    return json({ channel, product });
  }

  const { data: product, error } = await admin
    .from(PRODUCT_TABLES[channel])
    .update({ is_active: false })
    .eq("id", productId)
    .select(ADMIN_PRODUCT_FIELDS[channel])
    .maybeSingle();

  if (error) {
    return apiError("目前無法停用商品。", 503);
  }
  if (!product) {
    return apiError("找不到指定商品。", 404);
  }

  return json({ channel, product });
}

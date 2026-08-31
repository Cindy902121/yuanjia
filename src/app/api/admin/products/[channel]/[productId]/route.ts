import { apiError, isUuid, json, readJson } from "@/lib/api";
import { attachB2bProductSpecOptions, attachProductTags } from "@/lib/catalog";
import { requireAdmin, requireBusinessAdmin } from "@/lib/admin-auth";
import {
  ADMIN_PRODUCT_FIELDS,
  isB2bProductStatus,
  isAdminChannel,
  isValidB2bProductStatusTransition,
  parseProductInput,
  PRODUCT_TABLES,
  type B2bProductStatus,
} from "@/lib/admin-catalog";
import { attachProductImages } from "@/lib/product-images";
import { createAdminClient } from "@/lib/supabase/admin";

async function statusTransitionError(
  admin: ReturnType<typeof createAdminClient>,
  productId: string,
  nextStatus: B2bProductStatus,
) {
  const { data: current, error } = await admin
    .from("b2b_products")
    .select("status")
    .eq("id", productId)
    .maybeSingle();
  if (error) return { message: "目前無法確認商品狀態。", status: 503 } as const;
  if (!current) return { message: "找不到指定商品。", status: 404 } as const;
  if (!isB2bProductStatus(current.status)) {
    return { message: "目前商品狀態資料不正確。", status: 503 } as const;
  }
  if (!isValidB2bProductStatusTransition(current.status, nextStatus)) {
    return { message: "商品狀態只能使用合法的狀態轉換。", status: 409 } as const;
  }
  return null;
}

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

  if (channel === "b2b" && isB2bProductStatus(parsed.payload.status)) {
    const transitionError = await statusTransitionError(admin, productId, parsed.payload.status);
    if (transitionError) return apiError(transitionError.message, transitionError.status);
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

  if (channel === "b2b") {
    const transitionError = await statusTransitionError(admin, productId, "offline");
    if (transitionError) return apiError(transitionError.message, transitionError.status);
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

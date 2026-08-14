import { apiError, isUuid, json, readJson } from "@/lib/api";
import { getAdminContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";

type Channel = "b2c" | "b2b";

function isChannel(value: string): value is Channel {
  return value === "b2c" || value === "b2b";
}

async function requireAdmin() {
  const context = await getAdminContext();
  if (!context.user) {
    return { response: apiError("請先登入管理者帳號。", 401) };
  }
  if (context.configurationError || context.databaseError) {
    return { response: apiError("目前無法確認管理者權限。", 503) };
  }
  if (!context.isAdmin) {
    return { response: apiError("你沒有管理者權限。", 403) };
  }
  return {};
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ channel: string; productId: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  const { channel, productId } = await params;
  if (!isChannel(channel) || !isUuid(productId)) {
    return apiError("產品路徑不正確。", 400);
  }

  const body = (await readJson(request)) as { tag_ids?: unknown } | null;
  if (!body || !Array.isArray(body.tag_ids)) {
    return apiError("請提供既有標籤的 tag_ids 陣列。", 400);
  }

  const tagIds = [...new Set(body.tag_ids)];
  if (
    tagIds.some((tagId) => !isUuid(tagId)) ||
    tagIds.length > 100
  ) {
    return apiError("標籤資料不正確。", 400);
  }

  const admin = createAdminClient();
  const productTable = channel === "b2c" ? "b2c_products" : "b2b_products";
  const tagTable = channel === "b2c" ? "b2c_tags" : "b2b_tags";
  const relationTable =
    channel === "b2c" ? "b2c_product_tags" : "b2b_product_tags";

  const { data: product, error: productError } = await admin
    .from(productTable)
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (productError) {
    return apiError("目前無法確認產品。", 503);
  }
  if (!product) {
    return apiError("找不到指定產品。", 404);
  }

  const { data: tags, error: tagError } =
    tagIds.length > 0
      ? await admin
          .from(tagTable)
          .select("id")
          .in("id", tagIds)
          .eq("is_active", true)
      : { data: [], error: null };

  if (tagError) {
    return apiError("目前無法確認產品標籤。", 503);
  }
  if ((tags ?? []).length !== tagIds.length) {
    return apiError("只能套用同一產品線中已啟用的既有標籤。", 400);
  }

  const { error: deleteError } = await admin
    .from(relationTable)
    .delete()
    .eq("product_id", productId);
  if (deleteError) {
    return apiError("目前無法更新產品標籤。", 503);
  }

  if (tagIds.length > 0) {
    const { error: insertError } = await admin
      .from(relationTable)
      .insert(tagIds.map((tagId) => ({ product_id: productId, tag_id: tagId })));
    if (insertError) {
      return apiError("目前無法套用產品標籤。", 503);
    }
  }

  return json({ channel, product_id: productId, tag_ids: tagIds });
}

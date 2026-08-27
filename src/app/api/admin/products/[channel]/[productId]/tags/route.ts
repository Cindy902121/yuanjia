import { apiError, isUuid, json, readJson } from "@/lib/api";
import { requireAdmin, requireBusinessAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Channel = "b2c" | "b2b";

function isChannel(value: string): value is Channel {
  return value === "b2c" || value === "b2b";
}

function requireTagAdmin(channel: string) {
  return channel === "b2b" ? requireBusinessAdmin() : requireAdmin();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channel: string; productId: string }> },
) {
  const { channel, productId } = await params;
  const guard = await requireTagAdmin(channel);
  if (guard.response) {
    return guard.response;
  }
  if (!isChannel(channel) || !isUuid(productId)) {
    return apiError("產品路徑不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const productTable = channel === "b2c" ? "b2c_products" : "b2b_products";
  const tagTable = channel === "b2c" ? "b2c_tags" : "b2b_tags";
  const relationTable = channel === "b2c" ? "b2c_product_tags" : "b2b_product_tags";
  const [{ data: product, error: productError }, { data: tags, error: tagError }, { data: relations, error: relationError }] =
    await Promise.all([
      admin.from(productTable).select("id").eq("id", productId).maybeSingle(),
      admin
        .from(tagTable)
        .select("id, group_name, slug, name")
        .eq("is_active", true)
        .order("group_name")
        .order("name"),
      admin.from(relationTable).select("tag_id").eq("product_id", productId),
    ]);
  if (productError || tagError || relationError) {
    return apiError("目前無法讀取產品標籤。", 503);
  }
  if (!product) {
    return apiError("找不到指定產品。", 404);
  }

  return json({
    channel,
    product_id: productId,
    tags: tags ?? [],
    tag_ids: (relations ?? []).map((relation) => relation.tag_id),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ channel: string; productId: string }> },
) {
  const { channel, productId } = await params;
  const guard = await requireTagAdmin(channel);
  if (guard.response) {
    return guard.response;
  }
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

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }
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

  const { data: currentRelations, error: relationError } = await admin
    .from(relationTable)
    .select("tag_id")
    .eq("product_id", productId);
  if (relationError) {
    return apiError("目前無法確認產品標籤。", 503);
  }

  const existingTagIds = new Set((currentRelations ?? []).map((relation) => relation.tag_id));
  const { data: tags, error: tagError } =
    tagIds.length > 0
      ? await admin
          .from(tagTable)
          .select("id, is_active")
          .in("id", tagIds)
      : { data: [], error: null };

  if (tagError) {
    return apiError("目前無法確認產品標籤。", 503);
  }
  if (
    (tags ?? []).length !== tagIds.length ||
    (tags ?? []).some((tag) => !tag.is_active && !existingTagIds.has(tag.id))
  ) {
    return apiError("只能套用同一產品線中已啟用的既有標籤。", 400);
  }

  if (channel === "b2b") {
    const { error } = await admin.rpc("admin_replace_b2b_product_tags", {
      p_product_id: productId,
      p_tag_ids: tagIds,
    });
    if (error) {
      return apiError("目前無法套用產品標籤。", 503);
    }
    return json({ channel, product_id: productId, tag_ids: tagIds });
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

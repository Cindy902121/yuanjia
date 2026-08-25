import { apiError, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import {
  ADMIN_PRODUCT_FIELDS,
  isAdminChannel,
  parseProductInput,
  PRODUCT_TABLES,
} from "@/lib/admin-catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channel: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  const { channel } = await params;
  if (!isAdminChannel(channel)) {
    return apiError("商品通路不正確。", 400);
  }

  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("include_inactive") === "true";
  const search = url.searchParams.get("q")?.trim();
  const admin = createAdminClient();
  let query = admin
    .from(PRODUCT_TABLES[channel])
    .select(ADMIN_PRODUCT_FIELDS[channel])
    .order("updated_at", { ascending: false })
    .limit(500);

  if (!includeInactive) {
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

  return json({ channel, products: products ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channel: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  const { channel } = await params;
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

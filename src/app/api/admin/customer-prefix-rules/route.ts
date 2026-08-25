import { apiError, isNonEmptyString, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function parseLabel(value: unknown, label: string) {
  if (!isNonEmptyString(value) || value.trim().length > 160) {
    return { error: `${label}格式不正確。` };
  }
  return { value: value.trim() };
}

function parsePrefix(value: unknown) {
  if (!isNonEmptyString(value)) {
    return null;
  }
  const prefix = value.trim().toUpperCase();
  return /^[A-Z][A-Z0-9_-]{0,15}$/.test(prefix) ? prefix : null;
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: rules, error } = await admin
    .from("customer_prefix_rules")
    .select("id, prefix, tier_label, channel_label, is_active, created_at, updated_at")
    .order("prefix");
  if (error) {
    return apiError("目前無法讀取前綴規則。", 503);
  }

  return json({ rules: rules ?? [] });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  const body = (await readJson(request)) as {
    prefix?: unknown;
    tier_label?: unknown;
    channel_label?: unknown;
    is_active?: unknown;
  } | null;
  const prefix = parsePrefix(body?.prefix);
  const tier = parseLabel(body?.tier_label, "級距");
  const channel = parseLabel(body?.channel_label, "通路");
  if (!prefix || tier.error || channel.error) {
    return apiError("前綴規則資料格式不正確。", 400);
  }
  if (body?.is_active !== undefined && typeof body.is_active !== "boolean") {
    return apiError("前綴規則啟用狀態不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: rule, error } = await admin
    .from("customer_prefix_rules")
    .insert({
      prefix,
      tier_label: tier.value,
      channel_label: channel.value,
      is_active: body?.is_active ?? true,
    })
    .select("id, prefix, tier_label, channel_label, is_active, created_at, updated_at")
    .single();
  if (error || !rule) {
    if (error?.code === "23505") {
      return apiError("前綴規則已存在。", 409);
    }
    return apiError("目前無法建立前綴規則。", 503);
  }

  return json({ rule }, 201);
}

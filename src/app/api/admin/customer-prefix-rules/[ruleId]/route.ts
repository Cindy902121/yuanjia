import { apiError, isNonEmptyString, isUuid, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function parseLabel(value: unknown, label: string) {
  if (!isNonEmptyString(value) || value.trim().length > 160) {
    return { error: `${label}格式不正確。` };
  }
  return { value: value.trim() };
}

async function getRuleId(params: Promise<{ ruleId: string }>) {
  const { ruleId } = await params;
  return isUuid(ruleId) ? ruleId : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ruleId: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  const ruleId = await getRuleId(params);
  if (!ruleId) {
    return apiError("前綴規則編號不正確。", 400);
  }

  const body = (await readJson(request)) as {
    prefix?: unknown;
    tier_label?: unknown;
    channel_label?: unknown;
    is_active?: unknown;
  } | null;
  if (body?.prefix !== undefined) {
    return apiError("前綴建立後不可修改。", 400);
  }

  const updates: { tier_label?: string; channel_label?: string; is_active?: boolean } = {};
  if (body?.tier_label !== undefined) {
    const result = parseLabel(body.tier_label, "級距");
    if (result.error) {
      return apiError(result.error, 400);
    }
    updates.tier_label = result.value;
  }
  if (body?.channel_label !== undefined) {
    const result = parseLabel(body.channel_label, "通路");
    if (result.error) {
      return apiError(result.error, 400);
    }
    updates.channel_label = result.value;
  }
  if (body?.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return apiError("前綴規則啟用狀態不正確。", 400);
    }
    updates.is_active = body.is_active;
  }
  if (Object.keys(updates).length === 0) {
    return apiError("沒有可更新的前綴規則欄位。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: rule, error } = await admin
    .from("customer_prefix_rules")
    .update(updates)
    .eq("id", ruleId)
    .select("id, prefix, tier_label, channel_label, is_active, created_at, updated_at")
    .maybeSingle();
  if (error) {
    return apiError("目前無法更新前綴規則。", 503);
  }
  if (!rule) {
    return apiError("找不到指定前綴規則。", 404);
  }

  return json({ rule });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ruleId: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  const ruleId = await getRuleId(params);
  if (!ruleId) {
    return apiError("前綴規則編號不正確。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: rule, error } = await admin
    .from("customer_prefix_rules")
    .update({ is_active: false })
    .eq("id", ruleId)
    .select("id, prefix, tier_label, channel_label, is_active, updated_at")
    .maybeSingle();
  if (error) {
    return apiError("目前無法停用前綴規則。", 503);
  }
  if (!rule) {
    return apiError("找不到指定前綴規則。", 404);
  }

  return json({ rule });
}

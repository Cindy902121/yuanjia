import { apiError, isUuid, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const status = new URL(request.url).searchParams.get("status");
  if (status && !["unread", "acknowledged", "recovered"].includes(status)) return apiError("告警狀態不正確。", 400);

  try {
    let query = createAdminClient()
      .from("admin_analytics_alerts")
      .select("id, rule_key, scope_key, status, title, message, metadata, first_seen_at, last_seen_at, acknowledged_at, recovered_at")
      .neq("rule_key", "analytics_api_health_state")
      .order("last_seen_at", { ascending: false })
      .limit(100);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return apiError("目前無法讀取告警。", 503);
    return json({ alerts: data ?? [] });
  } catch {
    return apiError("目前無法讀取告警。", 503);
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const body = (await readJson(request)) as { id?: unknown; status?: unknown } | null;
  if (!isUuid(body?.id) || body?.status !== "acknowledged") return apiError("告警更新資料不正確。", 400);
  const adminUserId = guard.context.user?.id;
  if (!adminUserId) return apiError("目前無法確認管理者帳號。", 503);

  try {
    const { data, error } = await createAdminClient()
      .from("admin_analytics_alerts")
      .update({ status: "acknowledged", acknowledged_by: adminUserId, acknowledged_at: new Date().toISOString() })
      .eq("id", body.id)
      .neq("status", "recovered")
      .select("id, status, acknowledged_at")
      .maybeSingle();
    if (error) return apiError("目前無法更新告警。", 503);
    if (!data) return apiError("找不到可更新的告警。", 404);
    return json({ alert: data });
  } catch {
    return apiError("目前無法更新告警。", 503);
  }
}

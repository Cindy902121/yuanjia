import { apiError, isUuid, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const FREQUENCIES = ["daily", "weekly", "monthly"] as const;
type ParsedPatch = { error: string } | { value: Record<string, unknown> };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePatch(body: Record<string, unknown> | null): ParsedPatch {
  const updates: Record<string, unknown> = {};
  if (body?.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 80) return { error: "排程名稱需為 1-80 字。" };
    updates.name = body.name.trim();
  }
  if (body?.frequency !== undefined) {
    if (!FREQUENCIES.includes(body.frequency as (typeof FREQUENCIES)[number])) return { error: "排程頻率不正確。" };
    updates.frequency = body.frequency;
  }
  if (body?.time_local !== undefined) {
    if (typeof body.time_local !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time_local)) return { error: "排程時間格式需為 HH:mm。" };
    updates.time_local = body.time_local;
  }
  if (body?.weekday !== undefined) {
    const weekday = body.weekday === null ? null : Number(body.weekday);
    if (weekday !== null && (!Number.isInteger(weekday) || weekday < 0 || weekday > 6)) return { error: "星期值需為 0-6。" };
    updates.weekday = weekday;
  }
  if (body?.month_day !== undefined) {
    const monthDay = body.month_day === null ? null : Number(body.month_day);
    if (monthDay !== null && (!Number.isInteger(monthDay) || monthDay < 1 || monthDay > 31)) return { error: "日期值需為 1-31。" };
    updates.month_day = monthDay;
  }
  if (body?.query_scope !== undefined) {
    if (!isObject(body.query_scope) || JSON.stringify(body.query_scope).length > 20000) return { error: "排程條件格式不正確。" };
    updates.query_scope = body.query_scope;
  }
  if (body?.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") return { error: "排程啟用狀態不正確。" };
    updates.is_active = body.is_active;
  }
  return { value: updates };
}

async function idFrom(params: Promise<{ id: string }>) {
  const { id } = await params;
  return isUuid(id) ? id : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const id = await idFrom(params);
  if (!id) return apiError("排程編號不正確。", 400);
  const body = (await readJson(request)) as Record<string, unknown> | null;
  const parsed = validatePatch(body);
  if ("error" in parsed) return apiError(parsed.error, 400);
  if (Object.keys(parsed.value).length === 0) return apiError("沒有可更新的排程欄位。", 400);
  const adminUserId = guard.context.user?.id;
  if (!adminUserId) return apiError("目前無法確認管理者帳號。", 503);

  try {
    const { data, error } = await createAdminClient()
      .from("admin_analytics_schedules")
      .update({ ...parsed.value, updated_by: adminUserId })
      .eq("id", id)
      .select("id, name, frequency, time_local, weekday, month_day, timezone, query_scope, is_active, next_run_at, last_run_at, created_at, updated_at")
      .maybeSingle();
    if (error) return apiError("目前無法更新匯出排程。", 503);
    if (!data) return apiError("找不到指定匯出排程。", 404);
    return json({ schedule: data });
  } catch {
    return apiError("目前無法更新匯出排程。", 503);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const id = await idFrom(params);
  if (!id) return apiError("排程編號不正確。", 400);

  try {
    const { data, error } = await createAdminClient()
      .from("admin_analytics_schedules")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return apiError("目前無法刪除匯出排程。", 503);
    if (!data) return apiError("找不到指定匯出排程。", 404);
    return json({ deleted: true, id });
  } catch {
    return apiError("目前無法刪除匯出排程。", 503);
  }
}

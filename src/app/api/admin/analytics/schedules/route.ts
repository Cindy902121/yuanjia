import { apiError, isNonEmptyString, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const FREQUENCIES = ["daily", "weekly", "monthly"] as const;
type Frequency = (typeof FREQUENCIES)[number];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ParsedSchedule = { error: string } | { value: { name: string; frequency: Frequency; time_local: string; weekday: number | null; month_day: number | null; query_scope: Record<string, unknown> } };

function parseSchedule(body: Record<string, unknown> | null): ParsedSchedule {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const frequency = body?.frequency as Frequency;
  const time = typeof body?.time_local === "string" ? body.time_local : "";
  const weekday = body?.weekday === null || body?.weekday === undefined ? null : Number(body.weekday);
  const monthDay = body?.month_day === null || body?.month_day === undefined ? null : Number(body.month_day);
  const scope = body?.query_scope;
  if (!isNonEmptyString(name) || name.length > 80) return { error: "排程名稱需為 1-80 字。" };
  if (!FREQUENCIES.includes(frequency as Frequency)) return { error: "排程頻率不正確。" };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: "排程時間格式需為 HH:mm。" };
  if (!isObject(scope) || JSON.stringify(scope).length > 20000) return { error: "排程條件格式不正確。" };
  if (frequency === "daily" && (weekday !== null || monthDay !== null)) return { error: "每日排程不需要星期或日期。" };
  if (frequency === "weekly" && (weekday === null || !Number.isInteger(weekday) || weekday < 0 || weekday > 6 || monthDay !== null)) return { error: "每週排程需要 0-6 的星期值。" };
  if (frequency === "monthly" && (monthDay === null || !Number.isInteger(monthDay) || monthDay < 1 || monthDay > 31 || weekday !== null)) return { error: "每月排程需要 1-31 的日期值。" };
  return { value: { name, frequency, time_local: time, weekday, month_day: monthDay, query_scope: scope } };
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  try {
    const { data, error } = await createAdminClient()
      .from("admin_analytics_schedules")
      .select("id, name, frequency, time_local, weekday, month_day, timezone, query_scope, is_active, next_run_at, last_run_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return apiError("目前無法讀取匯出排程。", 503);
    return json({ schedules: data ?? [] });
  } catch {
    return apiError("目前無法讀取匯出排程。", 503);
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const body = (await readJson(request)) as Record<string, unknown> | null;
  const parsed = parseSchedule(body);
  if ("error" in parsed) return apiError(parsed.error, 400);
  const adminUserId = guard.context.user?.id;
  if (!adminUserId) return apiError("目前無法確認管理者帳號。", 503);

  try {
    const { data, error } = await createAdminClient()
      .from("admin_analytics_schedules")
      .insert({ ...parsed.value, created_by: adminUserId, updated_by: adminUserId })
      .select("id, name, frequency, time_local, weekday, month_day, timezone, query_scope, is_active, next_run_at, last_run_at, created_at, updated_at")
      .single();
    if (error) return apiError("目前無法建立匯出排程。", 503);
    return json({ schedule: data }, 201);
  } catch {
    return apiError("目前無法建立匯出排程。", 503);
  }
}

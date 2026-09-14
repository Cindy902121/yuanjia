import { isScheduleDue, nextRetryAt, taipeiParts, type ScheduleDefinition } from "@/lib/admin-analytics-extensions";
import { getB2bAnalyticsReport, parseAnalyticsFilters, reportToCsv } from "@/lib/analytics/report";
import { createAdminClient } from "@/lib/supabase/admin";

const EXPORT_BUCKET = "admin-analytics-exports";
const EXPORT_TTL_DAYS = 30;

type JsonObject = Record<string, unknown>;

type ScheduleRow = ScheduleDefinition & {
  id: string;
  name: string;
  query_scope: JsonObject;
  created_by: string;
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function queryFromScope(scope: unknown) {
  if (!isObject(scope)) return null;
  const dateFrom = typeof scope.date_from === "string" ? scope.date_from : "";
  const dateTo = typeof scope.date_to === "string" ? scope.date_to : "";
  if (!dateFrom || !dateTo) return null;
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  const filters = isObject(scope.filters) ? scope.filters : {};
  const fields = [
    "customer_tier_snapshot",
    "channel_snapshot",
    "product_reference",
    "product_category",
    "product_brand",
    "event_name",
    "filter_type",
    "finder_question",
  ];
  for (const field of fields) {
    if (Array.isArray(filters[field]) && filters[field].every((value) => typeof value === "string")) {
      params.set(field, (filters[field] as string[]).join(","));
    }
  }
  const parsed = parseAnalyticsFilters(params);
  return "error" in parsed ? null : parsed.query;
}

function dateOffset(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

async function saveAlert(
  admin: ReturnType<typeof createAdminClient>,
  ruleKey: string,
  scopeKey: string,
  title: string,
  message: string,
  metadata: JsonObject = {},
) {
  const { data: existing, error: findError } = await admin
    .from("admin_analytics_alerts")
    .select("id, status")
    .eq("rule_key", ruleKey)
    .eq("scope_key", scopeKey)
    .neq("status", "recovered")
    .maybeSingle();
  if (findError) throw findError;
  if (existing) {
    const { error } = await admin
      .from("admin_analytics_alerts")
      .update({ message, metadata, last_seen_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await admin.from("admin_analytics_alerts").insert({
    rule_key: ruleKey,
    scope_key: scopeKey,
    title,
    message,
    metadata,
  });
  if (error) throw error;
}

async function recoverAlert(
  admin: ReturnType<typeof createAdminClient>,
  ruleKey: string,
  scopeKey: string,
) {
  const { error } = await admin
    .from("admin_analytics_alerts")
    .update({ status: "recovered", recovered_at: new Date().toISOString() })
    .eq("rule_key", ruleKey)
    .eq("scope_key", scopeKey)
    .neq("status", "recovered");
  if (error) throw error;
}

async function enqueueDueSchedules(admin: ReturnType<typeof createAdminClient>, now: Date) {
  const { data, error } = await admin
    .from("admin_analytics_schedules")
    .select("id, name, frequency, time_local, weekday, month_day, query_scope, created_by")
    .eq("is_active", true);
  if (error) throw error;
  const current = taipeiParts(now);
  const scheduledFor = new Date(`${current.date}T${current.hour.toString().padStart(2, "0")}:${current.minute.toString().padStart(2, "0")}:00+08:00`).toISOString();
  let queued = 0;
  for (const schedule of (data ?? []) as ScheduleRow[]) {
    if (!isScheduleDue(schedule, now)) continue;
    const { error: insertError } = await admin.from("admin_analytics_export_runs").insert({
      schedule_id: schedule.id,
      triggered_by: schedule.created_by,
      status: "queued",
      scheduled_for: scheduledFor,
      query_scope: schedule.query_scope,
      max_attempts: 3,
    });
    if (!insertError) queued += 1;
    else if (insertError.code !== "23505") throw insertError;
  }
  return queued;
}

async function executeRun(admin: ReturnType<typeof createAdminClient>, run: JsonObject & { id: string; attempt: number; max_attempts: number; query_scope: JsonObject; schedule_id: string | null; triggered_by: string | null }) {
  const now = new Date();
  const attempt = Number(run.attempt ?? 0) + 1;
  await admin.from("admin_analytics_export_runs").update({ status: "running", attempt, started_at: now.toISOString(), error_message: null }).eq("id", run.id);
  try {
    const query = queryFromScope(run.query_scope);
    if (!query) throw new Error("排程條件已失效，請重新建立排程。");
    const report = await getB2bAnalyticsReport(admin, query);
    const csv = reportToCsv(report);
    const fileName = `b2b-analytics-${query.dateToValue}-${run.id.slice(0, 8)}.csv`;
    const filePath = `scheduled/${run.schedule_id ?? "manual"}/${run.id}.csv`;
    const { error: uploadError } = await admin.storage.from(EXPORT_BUCKET).upload(filePath, Buffer.from(`\uFEFF${csv}`, "utf8"), {
      contentType: "text/csv",
      upsert: true,
    });
    if (uploadError) throw uploadError;
    const rowCount = Math.max(0, csv.split("\r\n").length - 1);
    const expiresAt = new Date(now.getTime() + EXPORT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error: auditError } = await admin.from("analytics_export_audits").insert({
      admin_user_id: run.triggered_by,
      purpose: "operations_analysis",
      note: "排程匯出",
      query_scope: run.query_scope,
      file_format: "csv",
      row_count: rowCount,
    });
    if (auditError) throw auditError;
    await admin.from("admin_analytics_export_runs").update({
      status: "succeeded",
      file_path: filePath,
      file_name: fileName,
      row_count: rowCount,
      completed_at: new Date().toISOString(),
      expires_at: expiresAt,
      next_retry_at: null,
    }).eq("id", run.id);
    return { succeeded: true };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "排程匯出失敗。";
    const exhausted = attempt >= Number(run.max_attempts ?? 3);
    await admin.from("admin_analytics_export_runs").update({
      status: "failed",
      attempt,
      error_message: message,
      completed_at: exhausted ? new Date().toISOString() : null,
      next_retry_at: exhausted ? null : nextRetryAt(now),
    }).eq("id", run.id);
    if (exhausted && run.schedule_id) {
      await saveAlert(admin, "scheduled_export_failure", run.schedule_id, "排程匯出失敗", `排程匯出連續失敗：${message}`, { run_id: run.id });
    }
    return { succeeded: false };
  }
}

async function executeQueuedRuns(admin: ReturnType<typeof createAdminClient>, now: Date) {
  const { data, error } = await admin
    .from("admin_analytics_export_runs")
    .select("id, attempt, max_attempts, query_scope, schedule_id, triggered_by")
    .or(`status.eq.queued,and(status.eq.failed,next_retry_at.lte.${now.toISOString()})`)
    .order("created_at", { ascending: true })
    .limit(5);
  if (error) throw error;
  let succeeded = 0;
  for (const run of (data ?? []) as Array<JsonObject & { id: string; attempt: number; max_attempts: number; query_scope: JsonObject; schedule_id: string | null; triggered_by: string | null }>) {
    if ((await executeRun(admin, run)).succeeded) succeeded += 1;
  }
  return succeeded;
}

async function cleanupExpiredFiles(admin: ReturnType<typeof createAdminClient>, now: Date) {
  const { data, error } = await admin
    .from("admin_analytics_export_runs")
    .select("id, file_path")
    .lt("expires_at", now.toISOString())
    .not("file_path", "is", null)
    .limit(50);
  if (error) throw error;
  for (const run of data ?? []) {
    if (run.file_path) await admin.storage.from(EXPORT_BUCKET).remove([run.file_path]);
    await admin.from("admin_analytics_export_runs").update({ file_path: null }).eq("id", run.id);
  }
  return (data ?? []).length;
}

async function checkBusinessAlerts(admin: ReturnType<typeof createAdminClient>, now: Date) {
  const current = taipeiParts(now);
  if (current.hour !== 8 || current.minute !== 0) return;
  const today = taipeiParts(now).date;
  const yesterday = dateOffset(today, -1);
  const previous = dateOffset(today, -2);
  const [currentResult, previousResult] = await Promise.all([
    admin.rpc("admin_b2b_analytics_summary", { p_date_from: `${yesterday}T00:00:00+08:00`, p_date_to: `${today}T00:00:00+08:00`, p_grain: "day", p_filters: {} }),
    admin.rpc("admin_b2b_analytics_summary", { p_date_from: `${previous}T00:00:00+08:00`, p_date_to: `${yesterday}T00:00:00+08:00`, p_grain: "day", p_filters: {} }),
  ]);
  if (currentResult.error || previousResult.error) throw currentResult.error ?? previousResult.error;
  const currentEvents = Number(currentResult.data?.totals?.events ?? 0);
  const previousEvents = Number(previousResult.data?.totals?.events ?? 0);
  if (currentEvents === 0 || (previousEvents >= 10 && currentEvents <= previousEvents * 0.5)) {
    await saveAlert(admin, "b2b_events_drop", "global", "B2B 事件量異常下降", `昨日事件 ${currentEvents.toLocaleString("zh-TW")}，前日 ${previousEvents.toLocaleString("zh-TW")}。`, { current_events: currentEvents, previous_events: previousEvents });
  } else {
    await recoverAlert(admin, "b2b_events_drop", "global");
  }
}

async function checkApiHealth(admin: ReturnType<typeof createAdminClient>) {
  const { error } = await admin.from("analytics_events").select("id", { head: true, count: "exact" }).limit(1);
  // ponytail: reuse one recovered server-only alert row as the durable two-check counter; split a health-state table if rules expand.
  const stateRule = "analytics_api_health_state";
  const { data: state, error: stateReadError } = await admin
    .from("admin_analytics_alerts")
    .select("id, metadata")
    .eq("rule_key", stateRule)
    .eq("scope_key", "global")
    .maybeSingle();
  if (stateReadError) throw stateReadError;
  const previousFailures = Number(isObject(state?.metadata) ? state.metadata.failure_count ?? 0 : 0);
  const failureCount = error ? previousFailures + 1 : 0;
  const statePayload = {
    status: "recovered",
    title: "Analytics API 健康狀態",
    message: "內部連續失敗計數，不顯示在告警中心。",
    metadata: { failure_count: failureCount, checked_at: new Date().toISOString() },
    recovered_at: new Date().toISOString(),
  };
  if (state) {
    const { error: stateUpdateError } = await admin.from("admin_analytics_alerts").update(statePayload).eq("id", state.id);
    if (stateUpdateError) throw stateUpdateError;
  } else {
    const { error: stateInsertError } = await admin.from("admin_analytics_alerts").insert({ rule_key: stateRule, scope_key: "global", ...statePayload });
    if (stateInsertError) throw stateInsertError;
  }
  if (error && failureCount >= 2) {
    await saveAlert(admin, "analytics_api_error", "global", "Analytics API 異常", "Supabase 連續兩次健康檢查失敗。", { failure_count: failureCount, message: error.message });
  } else if (!error) {
    await recoverAlert(admin, "analytics_api_error", "global");
  }
}

export async function runAdminAnalyticsJobs(now = new Date()) {
  const admin = createAdminClient();
  const [queued, succeeded, cleaned] = [
    await enqueueDueSchedules(admin, now),
    await executeQueuedRuns(admin, now),
    await cleanupExpiredFiles(admin, now),
  ];
  try {
    await checkBusinessAlerts(admin, now);
    await checkApiHealth(admin);
  } catch (error) {
    console.error("Admin Analytics alert check failed", error);
    await saveAlert(admin, "analytics_api_error", "global", "Analytics API 異常", "告警檢查無法完成，請檢查 Supabase 連線。", {});
  }
  return { queued, succeeded, cleaned };
}

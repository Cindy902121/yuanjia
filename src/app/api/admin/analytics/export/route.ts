import { apiError } from "@/lib/api";
import { getAdminContext } from "@/lib/auth-context";
import {
  getB2bAnalyticsReport,
  parseAnalyticsFilters,
  reportToCsv,
} from "@/lib/analytics/report";
import { createAdminClient } from "@/lib/supabase/admin";

const EXPORT_PURPOSES = [
  "operations_analysis",
  "customer_service",
  "audit",
  "other",
] as const;

async function requireAdmin() {
  const context = await getAdminContext();
  if (!context.user) return { response: apiError("請先登入管理者帳號。", 401) };
  if (context.configurationError || context.databaseError) {
    return { response: apiError("目前無法確認管理者權限。", 503) };
  }
  if (context.role !== "admin") return { response: apiError("你沒有管理者權限。", 403) };
  return { context };
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const url = new URL(request.url);
  const purpose = url.searchParams.get("purpose");
  const purposeValue = purpose as (typeof EXPORT_PURPOSES)[number][0];
  if (!EXPORT_PURPOSES.some(([value]) => value === purposeValue)) {
    return apiError("請選擇報表下載用途。", 400);
  }
  const note = url.searchParams.get("note")?.trim() ?? "";
  if (note.length > 500) return apiError("下載備註不可超過 500 字。", 400);

  const parsed = parseAnalyticsFilters(url.searchParams);
  if ("error" in parsed) return apiError(parsed.error, 400);

  const adminUserId = guard.context.user?.id;
  if (!adminUserId) return apiError("目前無法確認管理者帳號。", 503);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  try {
    const report = await getB2bAnalyticsReport(admin, parsed.query);
    const csv = reportToCsv(report);
    const rowCount = Math.max(0, csv.split("\r\n").length - 1);
    const { error: auditError } = await admin.from("analytics_export_audits").insert({
      admin_user_id: adminUserId,
      purpose: purposeValue,
      note: note || null,
      query_scope: {
        date_from: parsed.query.dateFromValue,
        date_to: parsed.query.dateToValue,
        grain: parsed.query.grain,
        filters: parsed.query.filters,
      },
      file_format: "csv",
      row_count: rowCount,
    });
    if (auditError) {
      console.error("B2B analytics export audit failed", auditError);
      return apiError("目前無法保存報表下載紀錄。", 503);
    }

    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="b2b-analytics-${parsed.query.dateToValue}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("B2B analytics export failed", error);
    return apiError("目前無法產生 B2B 分析報表。", 503);
  }
}

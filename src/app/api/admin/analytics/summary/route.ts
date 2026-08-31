import { apiError, json } from "@/lib/api";
import { getAdminContext } from "@/lib/auth-context";
import { getB2bAnalyticsReport, parseAnalyticsFilters } from "@/lib/analytics/report";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const context = await getAdminContext();
  if (!context.user) {
    return { response: apiError("請先登入管理者帳號。", 401) };
  }
  if (context.configurationError || context.databaseError) {
    return { response: apiError("目前無法確認管理者權限。", 503) };
  }
  if (context.role !== "admin") {
    return { response: apiError("你沒有管理者權限。", 403) };
  }
  return { context };
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const parsed = parseAnalyticsFilters(new URL(request.url).searchParams);
  if ("error" in parsed) return apiError(parsed.error, 400);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  try {
    // surface=b2b；admin_b2b_analytics_summary 在資料庫內完成聚合，不載入原始事件。
    const report = await getB2bAnalyticsReport(admin, parsed.query);
    return json(report);
  } catch (error) {
    console.error("B2B analytics summary failed", error);
    return apiError("目前無法讀取 B2B 分析報表。", 503);
  }
}

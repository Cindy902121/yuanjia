import { apiError, json } from "@/lib/api";
import { getAdminContext } from "@/lib/auth-context";
import { getB2bAnalyticsReport, parseAnalyticsFilters } from "@/lib/analytics/report";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const context = await getAdminContext();
  if (context.configurationError || context.databaseError) {
    return { response: apiError("目前無法確認管理者權限。", 503) };
  }
  if (!context.user) {
    return { response: apiError("請先登入管理者帳號。", 401) };
  }
  if (context.role !== "admin") {
    return { response: apiError("你沒有管理者權限。", 403) };
  }
  return { context };
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const url = new URL(request.url);
  const parsed = parseAnalyticsFilters(url.searchParams);
  if ("error" in parsed) return apiError(parsed.error, 400);

  const includeInactiveValue = url.searchParams.get("include_inactive_products");
  if (includeInactiveValue !== null && !["true", "false"].includes(includeInactiveValue)) {
    return apiError("商品啟用篩選不正確。", 400);
  }
  const includeInactiveProducts = includeInactiveValue === "true";

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  try {
    // surface=b2b；admin_b2b_analytics_summary 在資料庫內完成聚合，不載入原始事件。
    const report = await getB2bAnalyticsReport(admin, parsed.query);
    let productStateQuery = admin
      .from("b2b_products")
      .select("id, status, is_active");
    if (!includeInactiveProducts) {
      productStateQuery = productStateQuery.eq("status", "published").eq("is_active", true);
    }
    const { data: productStates, error: productStatesError } = await productStateQuery;
    if (productStatesError) throw productStatesError;
    const productStateById = new Map((productStates ?? []).map((product) => [product.id, product]));
    report.options.products = report.options.products
      .map((product) => ({
        ...product,
        status: productStateById.get(product.id)?.status ?? "offline",
        is_active: productStateById.get(product.id)?.is_active ?? false,
      }))
      .filter((product) => includeInactiveProducts || (product.status === "published" && product.is_active));
    return json(report);
  } catch (error) {
    console.error("B2B analytics summary failed", error);
    return apiError("目前無法讀取 B2B 分析報表。", 503);
  }
}

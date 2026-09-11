import { apiError, json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { parseAnalyticsFilters } from "@/lib/analytics/report";
import { createAdminClient } from "@/lib/supabase/admin";

function positiveInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const url = new URL(request.url);
  const parsed = parseAnalyticsFilters(url.searchParams);
  if ("error" in parsed) return apiError(parsed.error, 400);
  const page = positiveInteger(url.searchParams.get("page"), 1, 100000);
  const pageSize = positiveInteger(url.searchParams.get("page_size"), 50, 50);
  const search = url.searchParams.get("search")?.trim() || null;
  if (search && search.length > 120) return apiError("客戶搜尋字串不可超過 120 字。", 400);

  try {
    const { data, error } = await createAdminClient().rpc("admin_b2b_analytics_company_detail", {
      p_date_from: parsed.query.dateFrom,
      p_date_to: parsed.query.dateTo,
      p_filters: parsed.query.rpcFilters,
      p_search: search,
      p_page: page,
      p_page_size: pageSize,
    });
    if (error) {
      console.error("B2B analytics company detail failed", error);
      return apiError("目前無法讀取客戶明細。", 503);
    }
    if (data?.masked) return apiError("目前企業數少於 5 家，依隱私規則不可下鑽。", 403);
    return json(data);
  } catch {
    return apiError("目前無法讀取客戶明細。", 503);
  }
}

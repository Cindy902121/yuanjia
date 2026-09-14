import { apiError, isUuid, json } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const EXPORT_BUCKET = "admin-analytics-exports";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id && !isUuid(id)) return apiError("匯出紀錄編號不正確。", 400);

  try {
    const admin = createAdminClient();
    if (id) {
      const { data, error } = await admin
        .from("admin_analytics_export_runs")
        .select("id, status, file_name, file_path, row_count, error_message, scheduled_for, completed_at, expires_at, created_at")
        .eq("id", id)
        .maybeSingle();
      if (error) return apiError("目前無法讀取匯出紀錄。", 503);
      if (!data) return apiError("找不到指定匯出紀錄。", 404);
      if (data.status !== "succeeded" || !data.file_path) return json({ export: data, download_url: null });
      const { data: signed, error: signedError } = await admin.storage.from(EXPORT_BUCKET).createSignedUrl(data.file_path, 300);
      if (signedError) return apiError("目前無法建立匯出下載連結。", 503);
      return json({ export: data, download_url: signed?.signedUrl ?? null });
    }

    const { data, error } = await admin
      .from("admin_analytics_export_runs")
      .select("id, status, file_name, row_count, error_message, scheduled_for, completed_at, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return apiError("目前無法讀取匯出歷史。", 503);
    return json({ exports: data ?? [] });
  } catch {
    return apiError("目前無法讀取匯出歷史。", 503);
  }
}

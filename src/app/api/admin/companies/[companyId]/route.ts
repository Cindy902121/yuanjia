import { apiError, isNonEmptyString, isUuid, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  const { companyId } = await params;
  if (!isUuid(companyId)) {
    return apiError("企業會員編號不正確。", 400);
  }

  const body = (await readJson(request)) as {
    expected_updated_at?: unknown;
    name?: unknown;
    is_active?: unknown;
  } | null;
  const updates: { name?: string; is_active?: boolean } = {};

  if (body?.name !== undefined) {
    if (!isNonEmptyString(body.name) || body.name.trim().length > 160) {
      return apiError("企業名稱格式不正確。", 400);
    }
    updates.name = body.name.trim();
  }
  if (body?.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return apiError("企業啟用狀態不正確。", 400);
    }
    updates.is_active = body.is_active;
  }
  if (Object.keys(updates).length === 0) {
    return apiError("沒有可更新的企業資料。", 400);
  }

  if (typeof body?.expected_updated_at !== "string" || !Number.isFinite(Date.parse(body.expected_updated_at))) return apiError("請重新讀取企業會員後再更新。", 428);
  const admin = createAdminClient();
  const { data: company, error } = await admin
    .from("companies")
    .update(updates)
    .eq("id", companyId)
    .eq("updated_at", body.expected_updated_at)
    .select("id, client_code, name, is_active, updated_at")
    .maybeSingle();

  if (error) {
    return apiError("目前無法更新企業會員。", 503);
  }
  if (!company) {
    return apiError("此資料已被更新或已不存在，請重新讀取後再操作。", 409);
  }

  return json({ company });
}

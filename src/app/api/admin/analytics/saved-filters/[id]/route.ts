import { apiError, isUuid, json, readJson } from "@/lib/api";
import { validateSavedFilterName } from "@/lib/admin-analytics-extensions";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateScope(value: unknown) {
  if (!isObject(value)) return "常用篩選內容格式不正確。";
  if (JSON.stringify(value).length > 20000) return "常用篩選內容不可超過 20 KB。";
  return null;
}

async function readId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return isUuid(id) ? id : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const id = await readId(params);
  if (!id) return apiError("常用篩選編號不正確。", 400);

  try {
    const { data, error } = await createAdminClient()
      .from("admin_analytics_saved_filters")
      .select("id, name, scope, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();
    if (error) return apiError("目前無法讀取常用篩選。", 503);
    if (!data) return apiError("找不到指定常用篩選。", 404);
    return json({ filter: data });
  } catch {
    return apiError("目前無法讀取常用篩選。", 503);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const id = await readId(params);
  if (!id) return apiError("常用篩選編號不正確。", 400);
  const adminUserId = guard.context.user?.id;
  if (!adminUserId) return apiError("目前無法確認管理者帳號。", 503);

  const body = (await readJson(request)) as { name?: unknown; scope?: unknown } | null;
  const updates: Record<string, unknown> = { updated_by: adminUserId };
  if (body?.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : body.name;
    const error = validateSavedFilterName(name);
    if (error) return apiError(error, 400);
    updates.name = name;
  }
  if (body?.scope !== undefined) {
    const error = validateScope(body.scope);
    if (error) return apiError(error, 400);
    updates.scope = body.scope;
  }
  if (Object.keys(updates).length === 1) return apiError("沒有可更新的常用篩選欄位。", 400);

  try {
    const { data, error } = await createAdminClient()
      .from("admin_analytics_saved_filters")
      .update(updates)
      .eq("id", id)
      .select("id, name, scope, created_at, updated_at")
      .maybeSingle();
    if (error?.code === "23505") return apiError("常用篩選名稱已存在。", 409);
    if (error) return apiError("目前無法更新常用篩選。", 503);
    if (!data) return apiError("找不到指定常用篩選。", 404);
    return json({ filter: data });
  } catch {
    return apiError("目前無法更新常用篩選。", 503);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const id = await readId(params);
  if (!id) return apiError("常用篩選編號不正確。", 400);

  try {
    const { data, error } = await createAdminClient()
      .from("admin_analytics_saved_filters")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return apiError("目前無法刪除常用篩選。", 503);
    if (!data) return apiError("找不到指定常用篩選。", 404);
    return json({ deleted: true, id });
  } catch {
    return apiError("目前無法刪除常用篩選。", 503);
  }
}

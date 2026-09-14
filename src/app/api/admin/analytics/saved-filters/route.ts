import { apiError, json, readJson } from "@/lib/api";
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

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  try {
    const { data, error } = await createAdminClient()
      .from("admin_analytics_saved_filters")
      .select("id, name, scope, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) return apiError("目前無法讀取常用篩選。", 503);
    return json({ filters: data ?? [] });
  } catch {
    return apiError("目前無法讀取常用篩選。", 503);
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = (await readJson(request)) as { name?: unknown; scope?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : body?.name;
  const nameError = validateSavedFilterName(name);
  const scopeError = validateScope(body?.scope);
  if (nameError || scopeError) return apiError(nameError ?? scopeError ?? "常用篩選資料不正確。", 400);
  const adminUserId = guard.context.user?.id;
  if (!adminUserId) return apiError("目前無法確認管理者帳號。", 503);

  try {
    const { data, error } = await createAdminClient()
      .from("admin_analytics_saved_filters")
      .insert({
        name,
        scope: body?.scope,
        created_by: adminUserId,
        updated_by: adminUserId,
      })
      .select("id, name, scope, created_at, updated_at")
      .single();
    if (error?.code === "23505") return apiError("常用篩選名稱已存在。", 409);
    if (error || !data) return apiError("目前無法保存常用篩選。", 503);
    return json({ filter: data }, 201);
  } catch {
    return apiError("目前無法保存常用篩選。", 503);
  }
}

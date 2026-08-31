import { apiError, isUuid, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function isAdminRole(value: unknown): value is "admin" | "business_staff" {
  return value === "admin" || value === "business_staff";
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  try {
    const admin = createAdminClient();
    const [{ data: staff, error: staffError }, { data: users, error: usersError }] =
      await Promise.all([
        admin
          .from("app_admins")
          .select("user_id, role, is_active, created_at, updated_at")
          .order("created_at", { ascending: false }),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);

    if (staffError || usersError) {
      return apiError("目前無法讀取 business staff 帳號。", 503);
    }

    const userById = new Map((users?.users ?? []).map((user) => [user.id, user]));
    return json({
      staff: (staff ?? []).map((member) => ({
        ...member,
        email: userById.get(member.user_id)?.email ?? null,
      })),
    });
  } catch {
    return apiError("目前無法讀取 business staff 帳號。", 503);
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = (await readJson(request)) as { user_id?: unknown; role?: unknown } | null;
  if (!body || !isUuid(body.user_id) || (body.role !== undefined && !isAdminRole(body.role))) {
    return apiError("管理帳號資料不正確。", 400);
  }
  const role = body.role ?? "business_staff";

  try {
    const admin = createAdminClient();
    const { data: user, error: userError } = await admin.auth.admin.getUserById(body.user_id);
    if (userError || !user.user) {
      return apiError("找不到指定的登入帳號。", 404);
    }

    const { data: member, error } = await admin
      .from("app_admins")
      .insert({ user_id: body.user_id, role, is_active: true })
      .select("user_id, role, is_active, created_at, updated_at")
      .single();
    if (error) {
      if (error.code === "23505") return apiError("該帳號已經是管理成員。", 409);
      return apiError("目前無法加入管理成員。", 503);
    }
    return json({ staff: { ...member, email: user.user.email ?? null } }, 201);
  } catch {
    return apiError("目前無法加入 business staff。", 503);
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = (await readJson(request)) as {
    user_id?: unknown;
    role?: unknown;
    is_active?: unknown;
  } | null;
  if (!body || !isUuid(body.user_id) || (body.role !== undefined && !isAdminRole(body.role))) {
    return apiError("管理帳號資料不正確。", 400);
  }
  if (body.is_active !== undefined && typeof body.is_active !== "boolean") {
    return apiError("帳號啟用狀態格式不正確。", 400);
  }
  if (body.user_id === guard.context.user?.id) {
    return apiError("不可停用或修改自己的管理權限。", 400);
  }
  if (body.role === undefined && body.is_active === undefined) {
    return apiError("沒有可更新的 business staff 欄位。", 400);
  }

  const updates: { role?: "admin" | "business_staff"; is_active?: boolean } = {};
  if (body.role !== undefined) updates.role = body.role;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  try {
    const admin = createAdminClient();
    const { data: member, error } = await admin
      .from("app_admins")
      .update(updates)
      .eq("user_id", body.user_id)
      .select("user_id, role, is_active, created_at, updated_at")
      .maybeSingle();
    if (error) return apiError("目前無法更新 business staff。", 503);
    if (!member) return apiError("找不到指定的管理成員。", 404);

    const { data: user } = await admin.auth.admin.getUserById(body.user_id);
    return json({ staff: { ...member, email: user.user?.email ?? null } });
  } catch {
    return apiError("目前無法更新 business staff。", 503);
  }
}

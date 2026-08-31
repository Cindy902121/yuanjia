import { apiError, json, readJson } from "@/lib/api";
import { buildAuthCallbackUrl } from "@/lib/auth-redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await readJson(request)) as { email?: unknown; next?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(email)) {
    return apiError("請輸入有效的 Email。", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("密碼重設服務尚未完成設定，請聯絡管理人員。", 503);
  }

  // ponytail: first page only; replace with a dedicated Auth email lookup before Auth exceeds 1,000 users.
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    return apiError("目前無法確認 Email，請稍後再試。", 503);
  }

  const user = listed.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (!user) {
    return apiError("Email 不存在。", 404);
  }

  const [{ data: admins, error: adminError }, { data: companies, error: companyError }] = await Promise.all([
    admin.from("app_admins").select("user_id").eq("user_id", user.id).limit(1),
    admin.from("companies").select("id").eq("auth_user_id", user.id).limit(1),
  ]);
  if (adminError || companyError) {
    return apiError("目前無法確認帳號類型，請稍後再試。", 503);
  }
  if ((admins?.length ?? 0) > 0 || (companies?.length ?? 0) > 0) {
    return apiError("此帳號不提供 B2C 密碼重設。", 403);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildAuthCallbackUrl(request, "recovery", body?.next),
  });
  if (error) {
    return apiError("目前無法寄出密碼重設信，請稍後再試。", 503);
  }

  return json({ message: "重設密碼信已寄出，請檢查 Email。" });
}

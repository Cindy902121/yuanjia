import { apiError, json, readJson } from "@/lib/api";
import { buildAuthCallbackUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH;
}

export async function POST(request: Request) {
  const body = (await readJson(request)) as {
    email?: unknown;
    password?: unknown;
    passwordConfirmation?: unknown;
    next?: unknown;
  } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(email)) {
    return apiError("請輸入有效的 Email。", 400);
  }
  if (!isPassword(body?.password)) {
    return apiError(`密碼需為 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 個字元。`, 400);
  }
  if (body.password !== body.passwordConfirmation) {
    return apiError("兩次輸入的密碼不一致。", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: body.password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(request, "confirm", body.next),
    },
  });

  if (error || !data.user) {
    return apiError("註冊失敗，請確認 Email 是否可用。", 400);
  }

  return json(
    {
      authenticated: Boolean(data.session),
      message: data.session ? "註冊成功。" : "註冊成功，請至 Email 完成驗證。",
      redirectTo: data.session ? "/" : undefined,
    },
    201,
  );
}

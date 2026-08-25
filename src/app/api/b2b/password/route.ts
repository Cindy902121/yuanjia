import { randomUUID } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { apiError, json, readJson } from "@/lib/api";
import { getB2bContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

function isPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH;
}

export async function POST(request: Request) {
  const context = await getB2bContext();
  if (!context.user) {
    return apiError("請先登入企業帳號。", 401);
  }
  if (context.databaseError) {
    return apiError("目前無法確認企業權限。", 503);
  }
  if (!context.company) {
    return apiError("此帳號沒有可用的企業權限。", 403);
  }

  const body = (await readJson(request)) as {
    current_password?: unknown;
    new_password?: unknown;
    new_password_confirmation?: unknown;
  } | null;
  if (typeof body?.current_password !== "string" || !isPassword(body?.new_password)) {
    return apiError(`請輸入目前密碼與 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 字元的新密碼。`, 400);
  }
  if (body.new_password !== body.new_password_confirmation) {
    return apiError("兩次輸入的新密碼不一致。", 400);
  }
  if (!context.user.email) {
    return apiError("目前無法確認企業登入帳號。", 503);
  }

  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
  );
  const { error: currentPasswordError } = await verifier.auth.signInWithPassword({
    email: context.user.email,
    password: body.current_password,
  });
  if (currentPasswordError) {
    return apiError("目前密碼不正確。", 400);
  }

  const admin = createAdminClient();
  const previousMetadata = context.user.app_metadata;
  const { error: metadataError } = await admin.auth.admin.updateUserById(context.user.id, {
    app_metadata: { ...previousMetadata, b2b_password_version: randomUUID() },
  });
  if (metadataError) {
    return apiError("目前無法更新密碼，請稍後再試。", 503);
  }

  const { error: passwordError } = await context.supabase.auth.updateUser({ password: body.new_password });
  if (passwordError) {
    await admin.auth.admin.updateUserById(context.user.id, { app_metadata: previousMetadata });
    return apiError("暫時無法更新密碼，請稍後再試。", 503);
  }

  await context.supabase.auth.signOut({ scope: "global" });
  return json({ message: "密碼已更新，請使用新密碼重新登入。" });
}

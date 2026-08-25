import { NextResponse } from "next/server";

import { isClientCode } from "@/lib/client-code";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type LoginRole = "admin" | "b2b" | "b2c";

type LoginSuccess = {
  redirectTo: string;
  role: LoginRole;
};

type LoginFailure = {
  message: string;
};

function isEmailIdentifier(identifier: string) {
  return identifier.includes("@");
}

function success(role: LoginRole) {
  const redirects: Record<LoginRole, string> = {
    admin: "/admin",
    b2b: "/business/catalog",
    b2c: "/",
  };

  return NextResponse.json<LoginSuccess>({ redirectTo: redirects[role], role });
}

function failure(message: string, status = 401) {
  return NextResponse.json<LoginFailure>({ message }, { status });
}

export async function POST(request: Request) {
  let body: { identifier?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return failure("登入資料格式不正確。", 400);
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifier || !password) {
    return failure("請輸入登入資料與密碼。", 400);
  }

  let adminClient;

  try {
    adminClient = createAdminClient();
  } catch {
    return failure("登入服務尚未完成設定，請聯絡管理人員。", 503);
  }

  const supabase = await createClient();

  if (isEmailIdentifier(identifier)) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier.toLowerCase(),
      password,
    });

    if (error || !data.user) {
      return failure("Email 或密碼不正確。");
    }

    const { data: admin, error: adminError } = await adminClient
      .from("app_admins")
      .select("is_active")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (adminError) {
      return failure("目前無法確認登入權限，請稍後再試。", 500);
    }

    if (admin && !admin.is_active) {
      await supabase.auth.signOut();
      return failure("管理者帳號目前未啟用。", 403);
    }

    return success(admin ? "admin" : "b2c");
  }

  const clientCode = identifier.toUpperCase();
  if (!isClientCode(clientCode)) {
    return failure("企業客戶代碼格式不正確，請輸入 1 碼前綴加 6 碼數字。", 400);
  }

  const { data: company, error: companyError } = await adminClient
    .from("companies")
    .select("auth_user_id, is_active")
    .eq("client_code", clientCode)
    .maybeSingle();

  if (companyError) {
    return failure("目前無法確認公司帳號，請稍後再試。", 500);
  }

  if (!company) {
    return failure("客戶代碼或密碼不正確。");
  }

  if (!company.is_active) {
    return failure("公司帳號已停用，請聯絡管理人員。", 403);
  }

  if (!company.auth_user_id) {
    return failure("公司登入帳號尚未完成設定，請聯絡管理人員。", 503);
  }

  const { data: authUserResult, error: authUserError } = await adminClient.auth.admin.getUserById(
    company.auth_user_id,
  );
  const companyEmail = authUserResult.user?.email;

  if (authUserError || !companyEmail) {
    return failure("公司登入帳號尚未完成設定，請聯絡管理人員。", 503);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: companyEmail,
    password,
  });

  if (error) {
    return failure("客戶代碼或密碼不正確。");
  }

  return success("b2b");
}

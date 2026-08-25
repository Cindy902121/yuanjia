import { apiError, isNonEmptyString, json, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-auth";
import {
  generateClientCode,
  internalB2bAuthEmail,
  isClientCodePrefix,
  type ClientCodePrefix,
} from "@/lib/client-code";
import { createAdminClient } from "@/lib/supabase/admin";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

function isPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= PASSWORD_MIN_LENGTH &&
    value.length <= PASSWORD_MAX_LENGTH
  );
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  const admin = createAdminClient();
  const [{ data: companies, error: companyError }, { data: rules, error: ruleError }] =
    await Promise.all([
      admin
        .from("companies")
        .select("id, client_code, name, is_active, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(500),
      admin
        .from("customer_prefix_rules")
        .select("prefix, tier_label, channel_label")
        .eq("is_active", true),
    ]);

  if (companyError || ruleError) {
    return apiError("目前無法讀取企業會員。", 503);
  }

  const ruleByPrefix = new Map(
    (rules ?? []).map((rule) => [rule.prefix, rule]),
  );

  return json({
    companies: (companies ?? []).map((company) => {
      const prefix = company.client_code.slice(0, 1);
      const rule = ruleByPrefix.get(prefix);
      return {
        ...company,
        prefix,
        tier_label: rule?.tier_label ?? "unclassified",
        channel_label: rule?.channel_label ?? "unclassified",
      };
    }),
  });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) {
    return guard.response;
  }

  const body = (await readJson(request)) as {
    name?: unknown;
    prefix?: unknown;
    password?: unknown;
  } | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const prefix = typeof body?.prefix === "string" ? body.prefix.toUpperCase() : "";
  if (!isNonEmptyString(name) || name.length > 160) {
    return apiError("請輸入 160 字以內的企業名稱。", 400);
  }
  if (!isClientCodePrefix(prefix)) {
    return apiError("客戶代碼前綴只能是 Z、E 或 W。", 400);
  }
  if (!isPassword(body?.password)) {
    return apiError(
      `初始密碼需為 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 個字元。`,
      400,
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return apiError("Supabase 伺服器連線尚未設定完成。", 503);
  }

  const { data: prefixRule, error: prefixRuleError } = await admin
    .from("customer_prefix_rules")
    .select("tier_label, channel_label")
    .eq("prefix", prefix)
    .eq("is_active", true)
    .maybeSingle();
  if (prefixRuleError) {
    return apiError("目前無法確認客戶代碼規則。", 503);
  }

  const clientCode = generateClientCode(prefix as ClientCodePrefix);
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: internalB2bAuthEmail(clientCode),
    password: body.password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    return apiError("目前無法建立企業登入帳號，請稍後再試。", 503);
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      auth_user_id: authUser.user.id,
      client_code: clientCode,
      name,
      is_active: true,
    })
    .select("id, client_code, name, is_active, created_at")
    .single();

  if (companyError || !company) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    if (companyError?.code === "23505") {
      return apiError("客戶代碼產生衝突，請重新送出。", 409);
    }
    return apiError("目前無法保存企業會員資料。", 503);
  }

  return json(
    {
      company: {
        ...company,
        prefix,
        tier_label: prefixRule?.tier_label ?? "unclassified",
        channel_label: prefixRule?.channel_label ?? "unclassified",
      },
      credential: {
        client_code: clientCode,
        note: "登入密碼為建立時輸入的初始密碼；系統不會保存或再次顯示明文密碼。",
      },
    },
    201,
  );
}

import { createAdminClient } from "./supabase/admin";
import { createClient as createServerClient } from "./supabase/server";

export type CompanyContext = {
  id: string;
  auth_user_id: string;
  client_code: string;
  name: string;
  is_active: boolean;
};

export const ADMIN_ROLES = ["admin", "business_staff"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

function b2bPasswordVersion(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const version = (value as Record<string, unknown>).b2b_password_version;
  return typeof version === "string" && version.length > 0 ? version : null;
}

export function hasCurrentB2bPasswordVersion(userMetadata: unknown, tokenMetadata: unknown) {
  const currentVersion = b2bPasswordVersion(userMetadata);
  return !currentVersion || currentVersion === b2bPasswordVersion(tokenMetadata);
}

export async function getSessionContext() {
  const supabase = await createServerClient();
  const [
    {
      data: { user },
      error,
    },
    { data: claims },
  ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getClaims()]);

  return { supabase, user, authError: error, tokenAppMetadata: claims?.claims?.app_metadata };
}

export async function getB2bContext() {
  const session = await getSessionContext();

  if (!session.user) {
    return { ...session, company: null, databaseError: null };
  }
  if (!hasCurrentB2bPasswordVersion(session.user.app_metadata, session.tokenAppMetadata)) {
    return { ...session, company: null, databaseError: null };
  }

  const { data: company, error } = await session.supabase
    .from("companies")
    .select("id, auth_user_id, client_code, name, is_active")
    .eq("auth_user_id", session.user.id)
    .eq("is_active", true)
    .maybeSingle();

  return {
    ...session,
    company: (company as CompanyContext | null) ?? null,
    databaseError: error,
  };
}

export async function getAdminContext() {
  const session = await getSessionContext();

  if (!session.user) {
    return {
      ...session,
      isAdmin: false,
      role: null,
      configurationError: null,
      databaseError: null,
    };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("app_admins")
      .select("user_id, is_active, role")
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .maybeSingle();

    const role: AdminRole | null =
      data?.role === "business_staff" ? "business_staff" : data ? "admin" : null;

    return {
      ...session,
      isAdmin: Boolean(data),
      role,
      configurationError: null,
      databaseError: error,
    };
  } catch (error) {
    return {
      ...session,
      isAdmin: false,
      role: null,
      configurationError:
        error instanceof Error ? error.message : "Supabase server key is missing.",
      databaseError: null,
    };
  }
}

import { createAdminClient } from "./supabase/admin";
import { createClient as createServerClient } from "./supabase/server";

export type CompanyContext = {
  id: string;
  auth_user_id: string;
  client_code: string;
  name: string;
  is_active: boolean;
};

export type AdminRole = "admin" | "business_staff";

export async function getSessionContext() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user, authError: error };
}

export async function getB2bContext() {
  const session = await getSessionContext();

  if (!session.user) {
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
      adminRole: null,
      isAdmin: false,
      isBusinessStaff: false,
      configurationError: null,
      databaseError: null,
    };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("app_admins")
      .select("user_id, role, is_active")
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .maybeSingle();

    const role: AdminRole | null =
      data?.role === "business_staff" ? "business_staff" : data ? "admin" : null;

    return {
      ...session,
      adminRole: role,
      isAdmin: role === "admin",
      isBusinessStaff: role === "business_staff",
      configurationError: null,
      databaseError: error,
    };
  } catch (error) {
    return {
      ...session,
      adminRole: null,
      isAdmin: false,
      isBusinessStaff: false,
      configurationError:
        error instanceof Error ? error.message : "Supabase server key is missing.",
      databaseError: null,
    };
  }
}

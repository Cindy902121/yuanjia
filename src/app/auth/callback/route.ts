import { NextResponse } from "next/server";

import { getSafeReturnPath } from "@/lib/auth-redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CallbackMode = "confirm" | "recovery" | "google";

function redirectWithState(request: Request, next: string, name: string, value: string) {
  const target = new URL(next, request.url);
  target.searchParams.set(name, value);
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const mode = url.searchParams.get("mode") as CallbackMode | null;
  const next = getSafeReturnPath(request, url.searchParams.get("next"));

  if (!code || !mode || !["confirm", "recovery", "google"].includes(mode)) {
    return redirectWithState(request, next, "auth_error", "auth-callback");
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return redirectWithState(request, next, "auth_error", "auth-callback");
  }

  if (mode === "google") {
    const { data: userResult, error: userError } = await supabase.auth.getUser();
    const hasGoogleIdentity = Boolean(
      userResult.user?.identities?.some((identity) => identity.provider === "google"),
    );

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      await supabase.auth.signOut();
      return redirectWithState(request, next, "auth_error", "auth-callback");
    }

    const userId = userResult.user?.id;
    if (userError || !userId || !hasGoogleIdentity) {
      await supabase.auth.signOut();
      return redirectWithState(request, next, "auth_error", "auth-callback");
    }

    const [{ data: admins, error: adminError }, { data: companies, error: companyError }] = await Promise.all([
      adminClient.from("app_admins").select("user_id").eq("user_id", userId).limit(1),
      adminClient.from("companies").select("id").eq("auth_user_id", userId).limit(1),
    ]);
    if (adminError || companyError) {
      await supabase.auth.signOut();
      return redirectWithState(request, next, "auth_error", "auth-callback");
    }

    if ((admins?.length ?? 0) > 0 || (companies?.length ?? 0) > 0) {
      await supabase.auth.signOut();
      return redirectWithState(request, next, "auth_error", "google-b2c-only");
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  return redirectWithState(request, next, "auth", mode === "confirm" ? "confirmed" : mode);
}

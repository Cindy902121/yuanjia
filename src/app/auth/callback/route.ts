import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function loginRedirect(requestUrl: URL) {
  return NextResponse.redirect(new URL("/login?error=oauth", requestUrl));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code || requestUrl.searchParams.has("error")) {
    return loginRedirect(requestUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return loginRedirect(requestUrl);
  }

  return NextResponse.redirect(new URL("/", requestUrl));
}

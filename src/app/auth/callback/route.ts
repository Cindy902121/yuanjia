import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const RECOVERY_COOKIE = "yuanjia-password-recovery";

function loginRedirect(requestUrl: URL) {
  return NextResponse.redirect(new URL("/login?error=oauth", requestUrl));
}

function getSafeNext(requestUrl: URL) {
  return requestUrl.searchParams.get("next") === "/reset-password" ? "/reset-password" : "/";
}

function setRecoveryCookie(response: NextResponse, requestUrl: URL, maxAge: number, value = "1") {
  response.cookies.set({
    httpOnly: true,
    maxAge,
    name: RECOVERY_COOKIE,
    path: "/reset-password",
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    value,
  });
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  if (requestUrl.searchParams.get("clear") === "password-recovery") {
    return setRecoveryCookie(
      NextResponse.redirect(new URL("/login?message=password-reset", requestUrl)),
      requestUrl,
      0,
      "",
    );
  }

  const code = requestUrl.searchParams.get("code");

  if (!code || requestUrl.searchParams.has("error")) {
    return loginRedirect(requestUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return loginRedirect(requestUrl);
  }

  const response = NextResponse.redirect(new URL(getSafeNext(requestUrl), requestUrl));
  return getSafeNext(requestUrl) === "/reset-password"
    ? setRecoveryCookie(response, requestUrl, 600)
    : response;
}

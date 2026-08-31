export function getSafeReturnPath(request: Request, value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  try {
    const target = new URL(value, request.url);
    return target.origin === new URL(request.url).origin
      ? `${target.pathname}${target.search}${target.hash}`
      : "/";
  } catch {
    return "/";
  }
}

export function buildAuthCallbackUrl(request: Request, mode: "confirm" | "recovery", next: unknown) {
  const callback = new URL("/auth/callback", request.url);
  callback.searchParams.set("mode", mode);
  callback.searchParams.set("next", getSafeReturnPath(request, next));
  return callback.toString();
}

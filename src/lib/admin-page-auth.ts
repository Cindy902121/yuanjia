import { redirect } from "next/navigation";

import { getAdminContext, getB2bContext } from "./auth-context";

export async function requireAdminPage(pathname: string) {
  const context = await getAdminContext();
  const loginPath = `/login?next=${encodeURIComponent(pathname)}`;

  if (!context.user || context.configurationError || context.databaseError) {
    redirect(loginPath);
  }
  if (context.role === "admin") {
    return;
  }
  if (
    context.role === "business_staff" &&
    (pathname === "/admin/business" || pathname.startsWith("/admin/business/"))
  ) {
    return;
  }

  const b2bContext = await getB2bContext();
  redirect(!b2bContext.databaseError && b2bContext.company ? "/business" : "/");
}

import { redirect } from "next/navigation";

import { getAdminContext, getB2bContext } from "./auth-context";

export async function requireAdminPage(pathname: string) {
  const context = await getAdminContext();
  const loginPath = `/login?next=${encodeURIComponent(pathname)}`;

  if (context.configurationError || context.databaseError) {
    return { unavailable: true };
  }
  if (!context.user) {
    redirect(loginPath);
  }
  if (context.role === "admin") {
    return { unavailable: false };
  }
  if (
    context.role === "business_staff" &&
    (pathname === "/admin/business" || pathname.startsWith("/admin/business/"))
  ) {
    return { unavailable: false };
  }
  if (context.role === "business_staff") {
    redirect("/admin/business?tab=b2b-products");
  }

  const b2bContext = await getB2bContext();
  redirect(!b2bContext.databaseError && b2bContext.company ? "/business" : "/");
}

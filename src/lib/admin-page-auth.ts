import { redirect } from "next/navigation";

import { getAdminContext, getB2bContext } from "./auth-context";

function isBusinessStaffPage(pathname: string) {
  return /^\/admin\/business(?:\/products(?:\/[^/]+)?)?$/.test(pathname);
}

export async function requireAdminPage(pathname: string) {
  const context = await getAdminContext();
  const loginPath = `/login?next=${encodeURIComponent(pathname)}`;

  if (!context.user || context.configurationError || context.databaseError) {
    redirect(loginPath);
  }
  if (context.isBusinessStaff) {
    if (!isBusinessStaffPage(pathname)) {
      redirect("/admin/business");
    }
    return;
  }
  if (context.isAdmin) {
    return;
  }

  const b2bContext = await getB2bContext();
  redirect(!b2bContext.databaseError && b2bContext.company ? "/business" : "/");
}

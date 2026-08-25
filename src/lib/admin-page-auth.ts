import { redirect } from "next/navigation";

import { getAdminContext, getB2bContext } from "./auth-context";

export async function requireAdminPage(pathname: string) {
  const context = await getAdminContext();
  const loginPath = `/login?next=${encodeURIComponent(pathname)}`;

  if (!context.user || context.configurationError || context.databaseError) {
    redirect(loginPath);
  }
  if (context.isBusinessStaff) {
    if (pathname !== "/admin/business") {
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

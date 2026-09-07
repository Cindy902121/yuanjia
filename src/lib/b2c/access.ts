import { redirect } from "next/navigation";

import { getB2bContext } from "@/lib/auth-context";

export async function requireB2cAccess() {
  const context = await getB2bContext();

  if (context.databaseError || context.company) {
    redirect("/business");
  }
}

import type { ReactNode } from "react";

import { requireB2cAccess } from "@/lib/b2c/access";

export default async function ProductCategoryLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireB2cAccess();
  return children;
}

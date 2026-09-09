import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getB2BAccess } from "@/lib/b2b/catalog";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "品牌故事 | 元家企業採購服務",
};

export default async function BusinessAboutPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "business_staff") redirect("/admin/business");
  if (access.role === "b2c") redirect("/");

  redirect("/business/about/company");
}

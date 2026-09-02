import type { Metadata } from "next";
import { redirect } from "next/navigation";

import BusinessHeader from "./catalog/business-header";
import { Hero, Media, Products, Safety, Sustainability } from "./homepage-preview/homepage-preview-client";
import { getB2BAccess } from "@/lib/b2b/catalog";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "企業採購服務 | 元家",
};

export default async function BusinessPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "b2c") redirect("/");

  return (
    <div className="min-h-screen bg-[#F7F6F2] font-sans text-[#17242A]">
      <BusinessHeader companyName={access.companyName} transparent />
      <main>
        <Hero includeHeader={false} />
        <Products />
        <Media />
        <Safety />
        <Sustainability />
      </main>
    </div>
  );
}

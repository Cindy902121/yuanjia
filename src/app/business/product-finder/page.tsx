import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessHeader from "../catalog/business-header";
import ProductFinderClient from "./product-finder-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "需求篩選器 | 元家企業採購服務",
};

export default async function ProductFinderPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "business_staff") redirect("/admin/business");
  if (access.role === "b2c") redirect("/");

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#17242A]">
      <BusinessHeader companyName={access.companyName} />
      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <Link className="text-sm font-semibold text-[#005DAA] hover:underline" href="/business/catalog">← 返回企業型錄</Link>
        <div className="mt-6"><p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">CHANNEL FINDER</p><h1 className="mt-2 text-3xl font-bold">需求篩選器</h1><p className="mt-2 text-sm leading-6 text-[#536168]">先選擇主要銷售通路，再瀏覽適合的企業商品；規格、包裝與報價由業務確認。</p></div>
        <ProductFinderClient />
      </main>
    </div>
  );
}

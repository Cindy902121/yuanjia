import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessHeader from "../catalog/business-header";
import BusinessBreadcrumb from "../catalog/business-breadcrumb";
import ProductFinderClient from "./product-finder-client";

/**
 * 2026-09（P1-3，C 提出「SEO noindex 與 sitemap 尚未完全對齊」；B 同時也在
 * codex/b-b2b-portal-experience 加了同一個 metadata，合併 main 時兩邊撞在
 * 一起——這頁登入前就會被導回 /login，內容也是 B2B 私有型錄的一部分，跟
 * /business/catalog 同一個道理不該被索引，兩邊想法一致，保留 B 的 title
 * 文案（跟其他 B2B 頁面的「...元家企業採購服務」格式一致）。
 */
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
        <BusinessBreadcrumb current="需求篩選器" />
        <div className="mt-6"><p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">CHANNEL FINDER</p><h1 className="mt-2 text-3xl font-bold">需求篩選器</h1><p className="mt-2 text-sm leading-6 text-[#536168]">先選擇主要銷售通路，再瀏覽適合的企業商品；規格、包裝與報價由業務確認。</p></div>
        <ProductFinderClient />
      </main>
    </div>
  );
}

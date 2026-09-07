import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessHeader from "../catalog/business-header";
import ProductFinderClient from "./product-finder-client";

/**
 * 2026-09（P1-3，C 提出「SEO noindex 與 sitemap 尚未完全對齊」）：這頁登入
 * 前就會被導回 /login（見下面 redirect 判斷），內容本身也是 B2B 私有型錄的
 * 一部分，跟 /business/catalog 同一個道理不該被索引——但一直沒有 export
 * `metadata`，等於沒有明確的 `robots` 設定。照 /business/catalog/page.tsx
 * 已經在用的做法補上，不需要另外設計新的模式。
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "需求篩選器 | 元家",
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
        <div className="mt-6"><p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">PRODUCT FINDER</p><h1 className="mt-2 text-3xl font-bold">需求篩選器</h1><p className="mt-2 text-sm leading-6 text-[#536168]">先選擇用途、加工方式或保存條件，再交由業務確認規格與報價。</p></div>
        <ProductFinderClient />
      </main>
    </div>
  );
}

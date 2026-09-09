import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessBreadcrumb from "../catalog/business-breadcrumb";
import BusinessHeader from "../catalog/business-header";
import RfqHistoryClient from "./rfq-history-client";

/**
 * 2026-09（P1-3，C 提出「SEO noindex 與 sitemap 尚未完全對齊」；B 同時也在
 * codex/b-b2b-portal-experience 加了同一個 metadata，合併 main 時兩邊撞在
 * 一起）：這頁比 /business/product-finder 更該擋——內容是公司自己的詢價
 * 品項、數量、狀態，屬於商業機密等級的資料，兩邊想法一致，保留 B 的 title
 * 文案（跟其他 B2B 頁面的「...元家企業採購服務」格式一致）。
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "詢價紀錄 | 元家企業採購服務",
};

export default async function RfqPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "business_staff") redirect("/admin/business");
  if (access.role === "b2c") redirect("/");
  return <div className="min-h-screen bg-[#F7F6F2] text-[#17242A]"><BusinessHeader companyName={access.companyName} /><main className="mx-auto max-w-6xl px-5 py-8 lg:px-8"><BusinessBreadcrumb current="詢價紀錄" /><div className="mt-6"><p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">INQUIRY HISTORY</p><h1 className="mt-2 text-3xl font-bold">過往詢價紀錄</h1><p className="mt-2 text-sm text-[#536168]">查看已送出的詢價明細與目前處理狀態。</p></div><RfqHistoryClient /></main></div>;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessHeader from "../catalog/business-header";
import RfqHistoryClient from "./rfq-history-client";

/**
 * 2026-09（P1-3，C 提出「SEO noindex 與 sitemap 尚未完全對齊」）：這頁比
 * /business/product-finder 更該擋——內容是公司自己的詢價品項、數量、狀態，
 * 屬於商業機密等級的資料，一直沒有 export `metadata`、沒有明確的
 * `robots` 設定，照 /business/catalog/page.tsx 已經在用的做法補上。
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "過往詢價紀錄 | 元家",
};

export default async function RfqPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "business_staff") redirect("/admin/business");
  if (access.role === "b2c") redirect("/");
  return <div className="min-h-screen bg-[#F7F6F2] text-[#17242A]"><BusinessHeader companyName={access.companyName} /><main className="mx-auto max-w-6xl px-5 py-8 lg:px-8"><p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">INQUIRY HISTORY</p><h1 className="mt-2 text-3xl font-bold">過往詢價紀錄</h1><p className="mt-2 text-sm text-[#536168]">查看已送出的詢價明細與目前處理狀態。</p><RfqHistoryClient /></main></div>;
}

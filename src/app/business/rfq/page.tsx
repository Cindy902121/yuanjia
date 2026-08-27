import { redirect } from "next/navigation";
import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessHeader from "../catalog/business-header";
import RfqHistoryClient from "./rfq-history-client";

export default async function RfqPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "business_staff") redirect("/admin/business");
  if (access.role === "b2c") redirect("/");
  return <div className="min-h-screen bg-[#F7F6F2] text-[#17242A]"><BusinessHeader companyName={access.companyName} /><main className="mx-auto max-w-5xl px-5 py-8 lg:px-8"><p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">INQUIRY HISTORY</p><h1 className="mt-2 text-3xl font-bold">過往詢價紀錄</h1><p className="mt-2 text-sm text-[#536168]">查看已送出的詢價明細與目前處理狀態。</p><RfqHistoryClient /></main></div>;
}

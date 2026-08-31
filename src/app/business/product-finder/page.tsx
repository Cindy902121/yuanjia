import Link from "next/link";
import { redirect } from "next/navigation";
import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessHeader from "../catalog/business-header";
import ProductFinderClient from "./product-finder-client";

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

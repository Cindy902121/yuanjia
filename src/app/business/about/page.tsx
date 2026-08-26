import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import BusinessHeader from "../catalog/business-header";
import { getB2BAccess } from "@/lib/b2b/catalog";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "品牌故事 | 元家企業採購服務",
};

export default async function BusinessAboutPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "b2c") redirect("/");

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#17242A]">
      <BusinessHeader companyName={access.companyName} />
      <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-16">
        <div className="max-w-3xl border-l-4 border-[#005DAA] pl-5 sm:pl-7"><p className="text-xs font-bold tracking-[0.18em] text-[#005DAA]">BRAND STORY</p><h1 className="mt-3 font-serif text-4xl font-bold leading-tight sm:text-5xl">以專業供應，支援每一種企業採購需求。</h1><p className="mt-5 text-base leading-8 text-[#536168]">這裡整理企業客戶最需要理解的服務方向；實際供應條件、規格與交期，仍由專屬業務依詢價內容確認。</p></div>
        <section className="mt-12 grid gap-5 lg:grid-cols-3">
          {[{ title: "選品與供應", text: "依企業採購情境瀏覽品項、規格、包裝、產地與保存方式，讓溝通從清楚的需求開始。" }, { title: "品質與保存", text: "將食品安全、品質與冷凍保存資訊保留在型錄與產品細項，方便採購前先行確認。" }, { title: "彈性詢價", text: "同一商品可選擇不同規格與包裝，亦可留下其他需求，交由業務確認供應與報價。" }].map((item, index) => <article className="rounded-2xl border border-[#D9E1E5] bg-white p-6 shadow-[0_10px_24px_rgba(23,36,42,0.04)]" key={item.title}><p className="text-xs font-bold tracking-[0.16em] text-[#005DAA]">0{index + 1}</p><h2 className="mt-8 text-xl font-bold">{item.title}</h2><p className="mt-3 text-sm leading-7 text-[#536168]">{item.text}</p></article>)}
        </section>
        <section className="mt-8 rounded-2xl border border-[#CFE3F0] bg-[#EAF5FB] p-7 sm:flex sm:items-center sm:justify-between sm:gap-8"><div><p className="text-xs font-bold tracking-[0.16em] text-[#005DAA]">START HERE</p><h2 className="mt-2 text-xl font-bold">已經有採購條件了嗎？</h2><p className="mt-2 text-sm leading-6 text-[#536168]">先從企業型錄瀏覽，或使用需求篩選器快速縮小品項。</p></div><div className="mt-5 flex shrink-0 gap-3 sm:mt-0"><Link className="inline-flex min-h-11 items-center rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white hover:bg-[#00457F]" href="/business/catalog">企業型錄</Link><Link className="inline-flex min-h-11 items-center rounded-lg border border-[#9FC6D9] px-4 text-sm font-bold text-[#005DAA] hover:bg-white" href="/business/product-finder">需求篩選</Link></div></section>
      </main>
    </div>
  );
}

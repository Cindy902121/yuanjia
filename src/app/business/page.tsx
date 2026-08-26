import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import BusinessHeader from "./catalog/business-header";
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
    <div className="min-h-screen bg-[#F7F6F2] text-[#17242A]">
      <BusinessHeader companyName={access.companyName} />
      <main>
        <section className="border-b border-[#163D4B] bg-[#102C37] px-5 py-14 text-white sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold tracking-[0.2em] text-[#A9D8F3]">YUANJIA BUSINESS</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">讓採購需求，回到清楚而可靠的供應節奏。</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#DCEAF0]">從瀏覽企業型錄、依需求篩選，到送出多規格詢價；供應、交期與報價皆由專屬業務確認。</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="inline-flex min-h-12 items-center rounded-lg bg-white px-5 text-sm font-bold text-[#00457F] transition hover:-translate-y-0.5 hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href="/business/catalog">瀏覽企業型錄</Link>
              <Link className="inline-flex min-h-12 items-center rounded-lg border border-[#83B8CE] px-5 text-sm font-bold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href="/business/product-finder">從需求開始篩選</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D9E1E5] pb-5">
            <div><p className="text-xs font-bold tracking-[0.18em] text-[#005DAA]">PROCUREMENT FLOW</p><h2 className="mt-2 text-2xl font-bold">企業採購的四個入口</h2></div>
            <Link className="text-sm font-bold text-[#005DAA] hover:underline" href="/business/about">認識元家企業服務 →</Link>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-[#D9E1E5] bg-[#D9E1E5] sm:grid-cols-2 lg:grid-cols-4">
            {[{ number: "01", title: "品牌故事", text: "了解元家如何支援企業採購。", href: "/business/about" }, { number: "02", title: "企業型錄", text: "查看品項、規格、包裝與保存資訊。", href: "/business/catalog" }, { number: "03", title: "需求篩選", text: "以用途與加工需求縮小品項範圍。", href: "/business/product-finder" }, { number: "04", title: "詢價紀錄", text: "追蹤已送出詢價的處理狀態。", href: "/business/rfq" }].map((item) => (
              <Link className="group bg-white p-6 transition hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#005DAA]" href={item.href} key={item.number}>
                <p className="text-xs font-bold tracking-[0.16em] text-[#005DAA]">{item.number}</p><h3 className="mt-8 text-lg font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#536168]">{item.text}</p><span className="mt-6 block text-sm font-bold text-[#005DAA] transition group-hover:translate-x-1">前往查看 →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

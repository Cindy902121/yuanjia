import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import BusinessHeader from "../../catalog/business-header";
import { getB2BAccess } from "@/lib/b2b/catalog";
import { getNewsArticles } from "../news-data";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "大宗專案 | 元家企業採購服務" };

export default async function BusinessOfferNewsPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "b2c") redirect("/");

  const offers = getNewsArticles("offers");
  const [featuredOffer, ...otherOffers] = offers;
  if (!featuredOffer?.offer) return null;

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#17242A]">
      <BusinessHeader companyName={access.companyName} />
      <main className="mx-auto max-w-[1100px] px-5 py-9 lg:px-8 lg:py-12">
        <nav aria-label="麵包屑導覽" className="flex items-center gap-2 text-sm text-[#718087]">
          <Link className="transition hover:text-[#005DAA]" href="/business">首頁</Link>
          <span aria-hidden="true" className="text-[#B7C3C9]">/</span>
          <span aria-current="page" className="font-medium text-[#536168]">大宗專案</span>
        </nav>
        <div className="mt-8 border-t-2 border-[#17242A] pt-6">
          <p className="text-sm font-bold text-[#005DAA]">BUSINESS OFFERS</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-[34px]">大宗專案</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#536168]">依採購情境整理的專案方案。實際品項、供應、交期與合作條件，皆由業務依詢價內容確認。</p>
        </div>
        <section aria-labelledby="featured-offer" className="mt-9 border border-[#C7D7E0] bg-white">
          <div className="grid lg:grid-cols-[1.05fr_1fr]">
            <div className="relative min-h-64 overflow-hidden bg-[#DCEBF2] lg:min-h-[320px]"><Image alt={featuredOffer.title} className="object-cover" fill priority sizes="(min-width: 1024px) 535px, 100vw" src={featuredOffer.offer.imagePath} /></div>
            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold tracking-[0.12em] text-[#005DAA]">FOCUS OFFER</p><span className="border border-[#A8C8DA] px-2 py-1 text-xs font-medium text-[#356277]">展示用方案</span></div>
              <h2 className="mt-5 text-2xl font-bold leading-8" id="featured-offer">{featuredOffer.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#536168]">{featuredOffer.summary}</p>
              <dl className="mt-6 grid gap-x-6 gap-y-4 border-y border-[#D9E1E5] py-4 text-sm sm:grid-cols-2"><div><dt className="text-xs font-bold text-[#718087]">適用品類</dt><dd className="mt-1 leading-6">{featuredOffer.offer.productCategories}</dd></div><div><dt className="text-xs font-bold text-[#718087]">活動期間</dt><dd className="mt-1 leading-6">{featuredOffer.offer.period}</dd></div><div><dt className="text-xs font-bold text-[#718087]">最低採購量 MOQ</dt><dd className="mt-1 leading-6">{featuredOffer.offer.moq}</dd></div><div><dt className="text-xs font-bold text-[#718087]">價格方式</dt><dd className="mt-1 font-bold leading-6 text-[#005DAA]">{featuredOffer.offer.pricing}</dd></div></dl>
              <div className="mt-6 flex flex-wrap gap-3"><Link className="border border-[#005DAA] bg-[#005DAA] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#00457F]" href={`/business/news/article/${featuredOffer.slug}`}>查看方案內容</Link><Link className="border border-[#8FB8CD] px-4 py-2.5 text-sm font-bold text-[#005DAA] transition hover:bg-[#EAF5FB]" href={`/business/catalog?project=${featuredOffer.slug}`}>查看適用品項</Link></div>
            </div>
          </div>
        </section>
        <section aria-labelledby="more-offers" className="mt-11">
          <div className="border-b border-[#17242A] pb-3"><h2 className="text-xl font-bold" id="more-offers">依採購情境選擇方案</h2></div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {otherOffers.map((offer) => offer.offer ? (
              <article className="overflow-hidden border border-[#D1DCE1] bg-white" key={offer.slug}>
                <div className="grid sm:grid-cols-[11rem_1fr]"><div className="relative min-h-44 bg-[#DCEBF2] sm:min-h-full"><Image alt={offer.title} className="object-cover" fill sizes="(min-width: 768px) 176px, 100vw" src={offer.offer.imagePath} /></div><div className="p-5"><p className="text-xs font-bold tracking-[0.1em] text-[#005DAA]">展示用方案</p><h3 className="mt-2 text-lg font-bold leading-7">{offer.title}</h3><p className="mt-2 text-sm leading-6 text-[#536168]">{offer.summary}</p><dl className="mt-4 space-y-2 border-t border-[#E1E7EA] pt-3 text-xs leading-5 text-[#536168]"><div><dt className="inline font-bold text-[#718087]">適用品類：</dt><dd className="inline">{offer.offer.productCategories}</dd></div><div><dt className="inline font-bold text-[#718087]">MOQ：</dt><dd className="inline">{offer.offer.moq}</dd></div><div><dt className="inline font-bold text-[#718087]">價格：</dt><dd className="inline font-bold text-[#005DAA]">{offer.offer.pricing}</dd></div></dl><Link className="mt-4 inline-flex border-b border-[#005DAA] pb-1 text-sm font-bold text-[#005DAA] transition hover:text-[#00457F]" href={`/business/news/article/${offer.slug}`}>查看方案內容</Link></div></div>
              </article>
            ) : null)}
          </div>
        </section>
      </main>
    </div>
  );
}

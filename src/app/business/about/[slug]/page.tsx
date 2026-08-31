import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessHeader from "../../catalog/business-header";
import { getAboutPage } from "../about-data";
import SupplyMap from "../supply-map";

export async function generateMetadata(props: PageProps<"/business/about/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = getAboutPage(slug);
  return page
    ? { title: `${page.label} | 元家企業採購服務`, description: page.summary, robots: { index: false, follow: false } }
    : { title: "找不到頁面 | 元家企業採購服務", robots: { index: false, follow: false } };
}

export default async function BusinessAboutDetailPage(props: PageProps<"/business/about/[slug]">) {
  const { slug } = await props.params;
  const page = getAboutPage(slug);
  if (!page) notFound();

  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "b2c") redirect("/");

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-[family-name:var(--ep-font-sans)] text-[#2B2B2B]">
      <BusinessHeader companyName={access.companyName} />
      <EditorialStyles />
      <main>
        <section className="overflow-hidden border-b border-[#e5e2da] bg-[#1F2723]">
          <Image alt="元家品牌故事" className="h-auto w-full" height={350} priority sizes="100vw" src="/brand/story-banner.jpg" width={1920} />
        </section>

        <article className="mx-auto max-w-[960px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <nav aria-label="麵包屑導覽" className="flex items-center gap-2 text-sm text-[#718087]"><Link className="transition hover:text-[#005DAA]" href="/business">首頁</Link><span aria-hidden="true" className="text-[#B7C3C9]">/</span><Link className="transition hover:text-[#005DAA]" href="/business/about/company">品牌故事</Link><span aria-hidden="true" className="text-[#B7C3C9]">/</span><span aria-current="page" className="font-medium text-[#536168]">{page.label}</span></nav>
          <FadeInSection className="mt-10 border-t-2 border-[#2B2B2B] pt-6">
            <p className="text-sm font-medium text-[#005DAA]">品牌故事</p>
            <h2 className="mt-4 font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.4] tracking-[0.04em] sm:text-[34px]">{page.label}</h2>
            {page.slug !== "milestones" ? <p className="mt-5 max-w-2xl text-base font-light leading-8 text-[#536168]">{page.summary}</p> : null}
          </FadeInSection>
          {page.imagePath ? <FadeInSection className="mt-9"><figure><div className="relative aspect-[16/8] overflow-hidden bg-[#E7E6E0]"><Image alt={page.imageAlt} className="object-cover" fill priority sizes="(min-width: 1024px) 960px, 100vw" src={page.imagePath} /></div><figcaption className="mt-3 text-xs leading-5 text-[#7C8585]">{page.imageCaption}</figcaption></figure></FadeInSection> : null}
          {page.slug !== "milestones" ? <FadeInSection className="mt-10 max-w-none space-y-5 border-y border-[#D9E1E5] py-8 text-[15px] font-light leading-8 text-[#33434A]">{page.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</FadeInSection> : null}
          {page.stats?.length ? <section className="mt-10 grid grid-cols-2 border-y border-[#D9E1E5] sm:grid-cols-4">{page.stats.map((stat) => <div className="border-b border-r border-[#D9E1E5] p-5 last:border-r-0 sm:border-b-0" key={stat.label}><p className="font-[family-name:var(--ep-font-en)] text-2xl font-light text-[#3E5C6B]">{stat.value}</p><p className="mt-2 text-xs leading-5 text-[#536168]">{stat.label}</p></div>)}</section> : null}
          {page.points?.length ? page.slug === "milestones" ? <section className="mt-12"><div className="border-b border-[#D9E1E5] pb-4"><p className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.18em] text-[#7C8585]">1968 — TODAY</p><h3 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">每一年，都是元家前進的一步</h3></div><div className="relative mt-8 border-l-2 border-[#5AA9D6] pl-8 sm:pl-12">{page.points.map((point, index) => <article className="relative pb-10 last:pb-2" key={point.title}><span aria-hidden="true" className="absolute -left-[2.35rem] top-1 grid size-5 place-items-center rounded-full border-4 border-[#FAF9F6] bg-[#5AA9D6] sm:-left-[3.35rem]" /><p className="font-[family-name:var(--ep-font-en)] text-3xl font-light text-[#4B9DD0] sm:text-4xl">{point.title}</p><p className="mt-2 max-w-xl text-[15px] leading-8 text-[#33434A]">{point.description}</p><span className="mt-3 block text-xs tracking-[0.14em] text-[#9AA6A8]">MILESTONE {String(index + 1).padStart(2, "0")}</span></article>)}</div></section> : <section className="mt-10"><h3 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light">重點內容</h3><div className="mt-5 divide-y border-y border-[#D9E1E5]">{page.points.map((point, index) => <div className="grid gap-2 py-5 sm:grid-cols-[4rem_10rem_minmax(0,1fr)] sm:gap-5" key={point.title}><span className="font-[family-name:var(--ep-font-en)] text-xl font-light text-[#3E5C6B]">{String(index + 1).padStart(2, "0")}</span><h4 className="font-medium text-[#2B2B2B]">{point.title}</h4><p className="text-sm font-light leading-7 text-[#536168]">{point.description}</p></div>)}</div></section> : null}
          {page.gallery?.length ? <section className="mt-12"><div className="flex items-end justify-between gap-4 border-b border-[#D9E1E5] pb-4"><div><p className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.18em] text-[#7C8585]">SERVICE FOOTPRINT</p><h3 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">服務版圖</h3></div><p className="max-w-xs text-right text-xs leading-5 text-[#7C8585]">從台灣市場到國際貿易，支持多元食品合作情境。</p></div><div className="mt-6 grid gap-5 sm:grid-cols-3">{page.gallery.map((image) => <figure key={image.path}><div className="relative aspect-[4/3] overflow-hidden bg-[#E7E6E0]"><Image alt={image.alt} className="object-cover transition duration-500 hover:scale-[1.03]" fill sizes="(min-width: 1024px) 300px, 100vw" src={image.path} /></div><figcaption className="mt-3 text-sm text-[#536168]">{image.caption}</figcaption></figure>)}</div></section> : null}
          {page.resources?.length ? <section className="mt-12"><div className="border-b border-[#D9E1E5] pb-4"><p className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.18em] text-[#7C8585]">SUSTAINABILITY LIBRARY</p><h3 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">永續資料與公益行動</h3><p className="mt-3 text-sm leading-7 text-[#536168]">官方報告與公益資訊集中於此，方便合作夥伴快速查閱。</p></div><div className="mt-6 grid gap-6 md:grid-cols-3">{page.resources.map((resource) => <a className="group flex flex-col border border-[#D9E1E5] bg-white transition hover:-translate-y-0.5 hover:border-[#8FB8CD] hover:shadow-sm" href={resource.href} key={resource.title} rel="noreferrer" target="_blank">{resource.imagePath ? <div className="relative aspect-[1.42/1] overflow-hidden bg-[#E7E6E0]"><Image alt={resource.imageAlt ?? resource.title} className={`${resource.imageFit === "contain" ? "object-contain p-10" : "object-cover"} transition duration-500 group-hover:scale-[1.02]`} fill sizes="(min-width: 768px) 280px, 100vw" src={resource.imagePath} /></div> : <div className="grid aspect-[1.42/1] place-items-center bg-[#EAF5FB] px-8 text-center"><span className="font-[family-name:var(--ep-font-serif)] text-xl font-light text-[#1E557A]">元家博愛公益慈善基金會</span></div>}<div className="flex min-h-44 flex-col p-5"><span className="text-xs tracking-[0.16em] text-[#7C8585]">OFFICIAL RESOURCE</span><h4 className="mt-4 font-[family-name:var(--ep-font-serif)] text-xl font-light text-[#17262D]">{resource.title}</h4><p className="mt-3 flex-1 text-sm leading-7 text-[#536168]">{resource.description}</p><span className="mt-4 text-sm font-medium text-[#005DAA] group-hover:underline">{resource.label} ↗</span></div></a>)}</div></section> : null}
          {page.slug === "supply-service" ? <SupplyMap /> : null}
          <div className="mt-10 flex flex-wrap gap-3">{page.slug === "supply-service" || page.slug === "strengths" ? <Link className="border border-[#005DAA] bg-[#005DAA] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#00457F]" href="/business/catalog">前往企業型錄</Link> : null}{page.externalHref && page.externalLabel ? <a className="border border-[#005DAA] bg-[#005DAA] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#00457F]" href={page.externalHref} rel="noreferrer" target="_blank">{page.externalLabel}</a> : null}</div>
        </article>
      </main>
    </div>
  );
}

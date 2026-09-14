import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { FadeInSection } from "@/components/editorial/FadeInSection";
import { CountUpValue } from "@/components/editorial/CountUpValue";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessHeader from "../../catalog/business-header";
import { getAboutPage, type AboutPage } from "../about-data";
import GlobalNetwork from "../global-network";
import MilestoneTimeline from "../milestone-timeline";
import SupplyMap from "../supply-map";

export async function generateMetadata(props: PageProps<"/business/about/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = getAboutPage(slug);
  return page
    ? { title: `${page.label} | 元家企業採購服務`, description: page.summary, robots: { index: false, follow: false } }
    : { title: "找不到頁面 | 元家企業採購服務", robots: { index: false, follow: false } };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold tracking-[0.2em] text-[#0F5B78]">{children}</p>;
}

function PageIntro({ page }: { page: AboutPage }) {
  return <FadeInSection className="border-t-2 border-[#233C46] pt-6"><SectionLabel>{page.kicker}</SectionLabel><h1 className="mt-4 max-w-3xl font-[family-name:var(--ep-font-serif)] text-[32px] font-light leading-[1.35] tracking-[0.035em] text-[#17262D] sm:text-[42px]">{page.title}</h1><p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#536168]">{page.summary}</p></FadeInSection>;
}

function AboutBanner({ page }: { page: AboutPage }) {
  return <section className="relative min-h-[280px] overflow-hidden bg-[#1F2723] text-white sm:min-h-[350px]"><Image alt={`${page.label}－元家企業採購服務`} className="object-cover" fill preload sizes="100vw" src="/brand/story-banner-clean.png" /><div className="relative mx-auto flex min-h-[280px] max-w-[1120px] items-end px-5 pb-14 pt-20 sm:min-h-[350px] sm:px-8 sm:pb-20 lg:px-10"><div className="[text-shadow:0_2px_14px_rgba(0,0,0,.4)]"><p className="motion-safe:animate-[sustain-rise_.65s_.08s_both] text-[11px] font-semibold tracking-[0.24em] text-[#B7DEE5]">{page.kicker}</p><h1 className="motion-safe:animate-[sustain-rise_.75s_.18s_both] mt-3 font-[family-name:var(--ep-font-sans)] text-[34px] font-bold leading-[1.15] tracking-[0.02em] sm:text-[48px]">{page.label}</h1></div></div></section>;
}

function LeadImage({ page, className = "aspect-[16/8]" }: { page: AboutPage; className?: string }) {
  if (!page.imagePath) return null;
  return <FadeInSection className="mt-10"><figure><div className={`relative overflow-hidden bg-[#E7E6E0] ${className}`}><Image alt={page.imageAlt} className="object-cover" fill preload quality={90} sizes="(min-width: 1024px) 960px, 100vw" src={page.imagePath} /></div><figcaption className="mt-3 text-xs leading-5 text-[#7C8585]">{page.imageCaption}</figcaption></figure></FadeInSection>;
}

function Narrative({ page }: { page: AboutPage }) {
  return <FadeInSection className="mt-10 max-w-none border-y border-[#D9E1E5] py-7 text-[15px] leading-8 text-[#33434A]">{page.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</FadeInSection>;
}

function CapabilityStrip({ title, items }: { title: string; items: NonNullable<AboutPage["points"]> }) {
  return <section className="mt-14"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D9E1E5] pb-4"><div><SectionLabel>CAPABILITY OVERVIEW</SectionLabel><h2 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">{title}</h2></div><p className="max-w-xs text-sm leading-6 text-[#718087]">以公開資料整理合作夥伴可快速理解的能力重點。</p></div><div className="grid divide-y border-b border-[#D9E1E5] md:grid-cols-2 md:divide-x md:divide-y-0">{items.map((item, index) => <article className="py-6 md:px-7 md:first:pl-0 md:last:pr-0" key={item.title}><p className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.16em] text-[#0F5B78]">0{index + 1}</p><h3 className="mt-3 text-lg font-medium text-[#17262D]">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[#536168]">{item.description}</p></article>)}</div></section>;
}

function PhotoGrid({ images, label, title, description }: { images: NonNullable<AboutPage["gallery"]>; label: string; title: string; description?: string }) {
  if (!images.length) return null;
  const cardMeta = [["01", "FOOD SERVICE"], ["02", "RETAIL & CHANNELS"], ["03", "GLOBAL PARTNERSHIPS"]];

  return (
    <section className="relative left-1/2 mt-20 w-screen -translate-x-1/2 bg-[#F3F7F8] py-14 sm:mt-24 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-10">
        <FadeInSection>
          <div className="flex items-end gap-6 border-b border-[#C9D7DB] pb-5">
            <div>
              <SectionLabel>{label}</SectionLabel>
              <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-3xl font-light text-[#17262D] sm:text-4xl">{title}</h2>
              {description ? <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#536168]">{description}</p> : null}
            </div>
            <span className="mb-2 hidden h-px flex-1 bg-[#C9D7DB] md:block" />
          </div>
        </FadeInSection>
        <div className="mx-auto mt-10 max-w-[1120px] space-y-7 sm:space-y-9">
          {images.map((image, index) => {
            const [number, category] = cardMeta[index] ?? [String(index + 1).padStart(2, "0"), "YUANJIA SERVICE"];
            const isReversed = index % 2 === 1;
            return (
              <FadeInSection delayMs={index * 90} key={image.path}>
              <article className="group grid overflow-hidden rounded-[1.4rem] bg-white shadow-[0_18px_38px_rgba(25,67,91,.1)] md:grid-cols-[.8fr_1.2fr]">
                  <div className={`relative min-h-[260px] overflow-hidden bg-[#DDE7EA] sm:min-h-[340px] ${isReversed ? "md:order-2" : ""}`}>
                    <Image alt={image.alt} className="object-cover transition duration-700 ease-out group-hover:scale-[1.045]" fill quality={90} sizes="(min-width: 768px) 560px, 100vw" src={image.path} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#102C34]/38 via-transparent to-transparent" />
                    <p className="absolute bottom-6 left-6 text-[10px] font-semibold tracking-[0.18em] text-white sm:bottom-8 sm:left-8">YUANJIA BUSINESS</p>
                  </div>
                  <div className="flex min-h-[260px] flex-col justify-center p-7 sm:min-h-[340px] sm:p-10">
                    <div className="flex items-center gap-3"><span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.12em] text-[#005DAA]">{number}</span><span className="h-px w-10 bg-[#8FB8CD]" /><p className="text-[10px] font-semibold tracking-[0.18em] text-[#0F5B78]">{category}</p></div>
                    <h3 className="mt-7 font-[family-name:var(--ep-font-serif)] text-[28px] font-light leading-[1.35] text-[#17262D] sm:text-[32px]">{image.caption}</h3>
                    <p className="mt-5 max-w-sm text-[15px] leading-8 text-[#536168]">以清楚的產品組合與服務方式，回應不同通路的採購、供應與合作需求。</p>
                    <span aria-hidden="true" className="mt-7 h-0.5 w-14 bg-[#005DAA] transition-all duration-500 group-hover:w-24" />
                  </div>
                </article>
              </FadeInSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PartnershipPrinciples({ items }: { items: NonNullable<AboutPage["points"]> }) {
  return <section className="mt-20"><div className="flex items-end gap-6 border-b border-[#C9D7DB] pb-5"><div><SectionLabel>CORE VALUES</SectionLabel><h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-3xl font-light text-[#17262D] sm:text-4xl">核心價值</h2><p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#536168]">以五項核心價值，作為元家面對市場、同仁與夥伴關係時的共同準則。</p></div><span aria-hidden="true" className="mb-2 hidden h-px flex-1 bg-[#C9D7DB] md:block" /></div><ol className="mt-8 grid gap-px bg-[#D7E1E4] sm:grid-cols-2 lg:grid-cols-5">{items.map((item, index) => <li className="min-h-52 bg-white p-6 sm:p-7" key={item.title}><span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.12em] text-[#005DAA]">0{index + 1}</span><h3 className="mt-8 text-xl font-medium text-[#17262D]">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[#536168]">{item.description}</p></li>)}</ol></section>;
}

function CompanyStats({ stats }: { stats: NonNullable<AboutPage["stats"]> }) {
  const countUpValues = [{ value: 60, suffix: "+" }, { value: 4000, suffix: "+" }, { value: 5, suffix: " 大洲" }, { value: 21, suffix: " 國" }];
  const statIcons = [<svg aria-hidden="true" className="size-11" fill="none" key="team" viewBox="0 0 48 48"><path d="M16 22a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm16 1a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM5 38c0-6 5-11 11-11s11 5 11 11M28 38c0-5 4-9 9-9s8 4 8 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>, <svg aria-hidden="true" className="size-11" fill="none" key="service" viewBox="0 0 48 48"><path d="M9 7h23l7 7v27H9V7Zm23 0v8h7M16 24h16M16 31h16M16 17h7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>, <svg aria-hidden="true" className="size-11" fill="none" key="trade" viewBox="0 0 48 48"><path d="M24 42c9.94 0 18-8.06 18-18S33.94 6 24 6 6 14.06 6 24s8.06 18 18 18Z" stroke="currentColor" strokeWidth="1.7" /><path d="M6.8 19h34.4M6.8 29h34.4M24 6c4.5 5 6.75 11 6.75 18S28.5 37 24 42c-4.5-5-6.75-11-6.75-18S19.5 11 24 6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>, <svg aria-hidden="true" className="size-11" fill="none" key="network" viewBox="0 0 48 48"><circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" /><circle cx="36" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" /><circle cx="24" cy="35" r="3.5" stroke="currentColor" strokeWidth="1.7" /><path d="m15 15.5 6.5 16M33 15.5l-6.5 16M16 13h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>];
  return <section className="relative left-1/2 mt-16 w-screen -translate-x-1/2 overflow-hidden bg-[#0D2B4E] text-white sm:mt-20"><div aria-hidden="true" className="absolute inset-0 bg-[url('/brand/global-map-texture.png')] bg-cover bg-center opacity-[0.16]" /><div className="relative mx-auto max-w-[1200px] px-5 py-14 sm:px-8 sm:py-20 lg:px-10"><FadeInSection><p className="text-[11px] font-semibold tracking-[0.24em] text-[#B9DCE8]">YUANJIA AT A GLANCE</p><h2 className="mt-4 font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.35] sm:text-4xl">把規模，放進每一段供應。</h2></FadeInSection><div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4">{stats.map((stat, index) => { const animation = countUpValues[index]; return <FadeInSection className="border-b border-white/20 py-8 last:border-b-0 sm:px-8 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 sm:first:pl-0 sm:[&:nth-child(2)]:pr-0 lg:border-b-0 lg:px-9 lg:odd:border-r lg:[&:nth-child(2)]:border-r lg:[&:nth-child(3)]:border-r lg:first:pl-0 lg:last:pr-0" delayMs={index * 110} key={stat.label}><article><div className="text-[#A8D7E6]">{statIcons[index]}</div><p className="mt-7 font-[family-name:var(--ep-font-en)] text-[54px] font-light leading-none tracking-[-0.05em] text-white sm:text-[64px]"><CountUpValue label={stat.value} suffix={animation?.suffix} value={animation?.value ?? 0} /></p><p className="mt-5 text-[15px] font-medium leading-6 text-white/90 sm:text-base">{stat.label}</p></article></FadeInSection>; })}</div></div></section>;
}

function CompanyPage({ page }: { page: AboutPage }) {
  const missionVision = page.missionVision;
  return <><section className="mt-10"><FadeInSection><figure className="relative aspect-[16/9] overflow-hidden rounded-[1rem] bg-[#DDE7EA] shadow-[0_18px_38px_rgba(25,67,91,.12)] sm:aspect-[1280/350]"><Image alt={page.imageAlt} className="object-cover" fill preload quality={90} sizes="(min-width: 1024px) 960px, 100vw" src={page.imagePath} /><figcaption className="absolute bottom-0 left-0 bg-[#102C34]/72 px-4 py-2 text-[10px] font-medium tracking-[0.14em] text-white sm:px-5">PENGHU · WHERE YUANJIA BEGAN</figcaption></figure></FadeInSection><FadeInSection className="mt-9 grid gap-8 border-t border-[#C9D7DB] pt-8 lg:grid-cols-[.78fr_1.22fr] lg:gap-14"><div><SectionLabel>ORIGIN</SectionLabel><h2 className="mt-4 font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.35] text-[#17262D] sm:text-4xl"><span className="block whitespace-nowrap">從水產運銷起步，</span><span className="block whitespace-nowrap">走向多元食品服務。</span></h2></div><div className="space-y-4 text-[15px] leading-8 text-[#536168]">{page.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></FadeInSection></section><CompanyStats stats={page.stats ?? []} /><PartnershipPrinciples items={page.points ?? []} />{missionVision ? <section className="relative left-1/2 mt-20 w-screen -translate-x-1/2 overflow-hidden bg-[#103B55] text-white"><div className="absolute inset-0 bg-[url('/brand/global-map-texture.png')] bg-cover bg-center opacity-20" /><FadeInSection className="relative mx-auto grid max-w-[1200px] gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.85fr_1.15fr] lg:px-10"><div><p className="text-[11px] font-semibold tracking-[0.22em] text-[#B8DEE8]">MISSION & VISION</p><h2 className="mt-4 font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.35] sm:text-4xl">使命與願景</h2></div><div className="border-l border-white/25 pl-7 sm:pl-10"><p className="text-[16px] leading-8 text-white/85">{missionVision.mission}</p><p className="mt-7 font-[family-name:var(--ep-font-serif)] text-2xl font-light leading-[1.5] text-white sm:text-3xl">{missionVision.vision}</p></div></FadeInSection></section> : null}<PhotoGrid description="元家服務傳統零售、量販超市、餐飲、食品加工、電子商務與國際貿易；以清楚的產品組合與服務方式，回應不同通路的採購需求。" images={page.gallery ?? []} label="CHANNELS" title="通路" /></>;
}

function StrengthsPage() {
  const qualityCheckpoints = [
    "全台超過 20 位專職品保人員，確保產品品質。",
    "每批進貨自主性品質檢測與嚴格溫度管制。",
    "主要產品皆依食品安全計畫通過第三方檢驗證明。",
    "專業儲位與產品效期管理系統，100% 無過期產品。",
    "大型專業冷凍倉庫 24hr 監控，全年溫度低於 -20℃。",
    "擁有自有專業品質檢驗實驗室，與通過證照之檢測人員。",
    "導入 Oracle E-Business Suite，有效整合相關資訊、完整記載產銷履歷，並配合政府食安政策建立食品追溯追蹤系統與開立電子發票。",
    "落實食品製造業者訂定並執行食品安全管制系統，讓食品安全有保障。",
  ];

  const certifications = [
    ["ISO 22000", "食品安全管理系統驗證", "/brand/certifications/certig_02.png"],
    ["HACCP", "危害分析與重要管制點驗證", "/brand/certifications/certig_01.png"],
    ["HALAL", "清真食品驗證", "/brand/certifications/certig_03.png"],
    ["EU", "歐盟水產品驗證", "/brand/certifications/certig_04.png"],
  ];

  const overviewCards = [
    ["食品安全", "FOOD SAFETY", "從逐批檢測、品保人員到追溯系統，讓每一項產品的品質都可被管理。", "/brand/quality-team.jpg"],
    ["研發生產", "R&D & PRODUCTION", "以兩座食品廠與研發中心，回應從原物料加工到即食產品開發的需求。", "/brand/production-facility.jpg"],
    ["國際採購", "GLOBAL SOURCING", "掌握全球水產源頭，依品項、規格與可追溯資料，支援穩定的食品供應。", "/brand/channel-service.jpg"],
    ["冷鏈物流", "COLD-CHAIN LOGISTICS", "以低溫倉儲、LMS 管理與批號效期控管，支持穩定且精確的交付。", "/brand/channel-dining.jpg"],
  ];

  return (
    <>
      <section className="relative left-1/2 mt-10 w-screen -translate-x-1/2 px-5 sm:mt-14 sm:px-8 lg:px-10">
        <FadeInSection>
          <div className="mx-auto max-w-[1400px]">
            <GlobalNetwork />
          </div>
        </FadeInSection>
      </section>

      <section className="relative left-1/2 mt-20 w-screen -translate-x-1/2 overflow-hidden bg-[#102A59] py-14 text-white sm:mt-24 sm:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-top bg-no-repeat opacity-75 sm:h-48" style={{ backgroundImage: "url('/brand/global-map-texture.png')", backgroundSize: "100% auto" }} />
        <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
          <FadeInSection>
            <div className="flex items-end gap-6 border-b border-white/25 pb-5">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#A9D8DF]">CORE CAPABILITIES</p>
                <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.35] sm:text-4xl">核心優勢</h2>
              </div>
              <span className="mb-2 hidden h-px flex-1 bg-white/30 md:block" />
            </div>
          </FadeInSection>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {overviewCards.map(([title, english, description, imagePath], index) => (
              <FadeInSection className="group" delayMs={index * 95} key={title}>
                <article className="min-h-[500px] overflow-hidden rounded-[1.4rem] bg-white text-[#17262D] shadow-[0_18px_36px_rgba(0,0,0,.16)] sm:min-h-[540px]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#E7E6E0]">
                    <Image alt={`${title}相關作業現場`} className="object-cover transition duration-700 group-hover:scale-[1.045]" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" src={imagePath} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#102C34]/35 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                  </div>
                  <div className="flex min-h-[260px] flex-col p-7 sm:p-8">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-[#005DAA]">{english}</p>
                    <h3 className="mt-4 font-[family-name:var(--ep-font-serif)] text-[28px] font-light text-[#17262D]">{title}</h3>
                    <p className="mt-5 text-[15px] leading-7 text-[#536168]">{description}</p>
                  </div>
                </article>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="relative left-1/2 mt-20 w-screen -translate-x-1/2 overflow-hidden bg-white sm:mt-24" id="food-safety">
        <FadeInSection>
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
            <div className="relative min-h-[400px] overflow-hidden sm:min-h-[560px]">
              <Image alt="元家自有專業品質檢驗實驗室" className="object-cover" fill sizes="(min-width: 1024px) 50vw, 100vw" src="/brand/quality-team.jpg" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102C34]/55 via-transparent to-transparent" />
              <p className="absolute bottom-7 left-7 text-[11px] font-semibold tracking-[0.18em] text-white/90 sm:left-10">FOOD SAFETY · QUALITY LABORATORY</p>
            </div>
            <div className="flex flex-col justify-center px-7 py-12 sm:px-10 lg:px-14 lg:py-16">
              <SectionLabel>QUALITY CONTROL POINTS</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.35] text-[#17262D] sm:text-4xl">八項把關，讓品質有跡可循。</h2>
              <div className="mt-7 grid border-y border-[#D9E1E5] sm:grid-cols-2" role="list">
                {qualityCheckpoints.map((checkpoint, index) => (
                  <div className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-[#D9E1E5] py-4 last:border-b-0 sm:px-4 sm:odd:border-r sm:odd:pl-0 sm:even:pr-0 sm:[&:nth-last-child(-n+2)]:border-b-0" key={checkpoint} role="listitem">
                    <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.08em] text-[#0F5B78]">{String(index + 1).padStart(2, "0")}</span>
                    <p className="text-sm leading-6 text-[#536168]">{checkpoint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      <section className="relative left-1/2 mt-20 w-screen -translate-x-1/2 overflow-hidden bg-[#F4F8FA] sm:mt-24" id="production">
        <FadeInSection>
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
            <div className="flex flex-col justify-center px-7 py-12 sm:px-10 lg:px-14 lg:py-16">
              <SectionLabel>FOOD R&D CENTER</SectionLabel>
              <h2 className="mt-4 font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.35] text-[#17262D] sm:text-4xl">研發，讓供應更貼近市場。</h2>
              <p className="mt-6 text-[16px] leading-8 text-[#536168]">位於元家台北總公司的「食品研發中心」，肩負調配新風味與開發新產品的重責大任；除了追求衛生美味，更持續因應市場與客戶需求，提升便利與創意度，發展加熱即食產品。</p>
              <p className="mt-5 text-[15px] leading-8 text-[#536168]">元家分別於 1983 年成立高雄冷凍食品加工廠、2007 年成立台南調理食品廠，從原物料加工到調理品生產，皆以標準化流程與品質控管支持產品開發。</p>
              <div className="mt-7 flex flex-wrap gap-2" aria-label="食品生產相關認證">
                {certifications.map(([name]) => <span className="border border-[#B9D0DB] bg-white px-3 py-2 text-xs font-medium tracking-[0.08em] text-[#005DAA]" key={name}>{name}</span>)}
              </div>
            </div>
            <div className="relative min-h-[400px] overflow-hidden sm:min-h-[560px]">
              <Image alt="元家食品研發中心實驗作業" className="object-cover" fill sizes="(min-width: 1024px) 50vw, 100vw" src="/brand/cold-storage.jpg" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102C34]/45 via-transparent to-transparent" />
              <p className="absolute bottom-7 left-7 text-[11px] font-semibold tracking-[0.18em] text-white/90 sm:left-10">PRODUCT DEVELOPMENT</p>
            </div>
          </div>
        </FadeInSection>
      </section>

      <section className="relative left-1/2 mt-20 w-screen -translate-x-1/2 overflow-hidden bg-white sm:mt-24" id="international-sourcing">
        <FadeInSection>
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
            <div className="relative min-h-[400px] overflow-hidden sm:min-h-[560px]">
              <Image alt="元家國際採購與展覽合作現場" className="object-cover" fill sizes="(min-width: 1024px) 50vw, 100vw" src="/brand/channel-service.jpg" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102C34]/55 via-transparent to-transparent" />
              <p className="absolute bottom-7 left-7 text-[11px] font-semibold tracking-[0.18em] text-white/90 sm:left-10">SOURCE · SPECIFICATION · TRACEABILITY</p>
            </div>
            <div className="flex flex-col justify-center bg-[#F4F8FA] px-7 py-12 sm:px-10 lg:px-14 lg:py-16">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[#005DAA]">GLOBAL SOURCING</p>
              <h2 className="mt-5 font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.38] text-[#17262D] sm:text-4xl">由全球源頭開始，
                <br />
                建立每一項食材的供應依據。</h2>
              <div className="mt-7 h-px w-16 bg-[#005DAA]" />
              <p className="mt-7 text-[16px] leading-8 text-[#33434A]">元家掌握全球水產源頭，依品項、規格、產地與可追溯資料，讓採購端能更清楚理解產品來源與供應條件。</p>
              <p className="mt-5 text-[15px] leading-8 text-[#536168]">部分具認證的水產品，以 MSC-COC、ASC-COC 等供應鏈驗證支持永續選品；實際適用資格仍以產品規格書及正式供應文件為準。</p>
              <div className="mt-8 flex flex-wrap gap-3" aria-label="國際採購相關認證">
                <span className="border border-[#9CBCCD] bg-white px-3 py-2 text-xs font-medium tracking-[0.08em] text-[#005DAA]">MSC-COC</span>
                <span className="border border-[#9CBCCD] bg-white px-3 py-2 text-xs font-medium tracking-[0.08em] text-[#005DAA]">ASC-COC</span>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      <section className="relative left-1/2 mt-20 w-screen -translate-x-1/2 overflow-hidden bg-[#163B47] text-white sm:mt-24" id="logistics">
        <FadeInSection>
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
            <div className="flex flex-col justify-center px-7 py-12 sm:px-10 lg:px-14 lg:py-16">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[#A9D8DF]">COLD-CHAIN LOGISTICS</p>
              <h2 className="mt-5 font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.38] sm:text-4xl">冷鏈，是產品抵達前的最後一道品質防線。</h2>
              <div className="mt-7 h-px w-16 bg-[#A9D8DF]" />
              <p className="mt-7 text-[16px] leading-8 text-white/90">商品自進貨開始即列入追蹤管理。大型專業冷凍倉庫 24hr 監控、全年溫度低於 -20℃，確保產品品質；專業 LMS 物流管理系統落實效期暨批號控管，並結合運輸派遣及監控系統，建構出元家強大的後勤支援網絡。</p>
            </div>
            <div className="relative min-h-[400px] overflow-hidden sm:min-h-[560px]">
              <Image alt="元家產品理貨與後勤作業現場" className="object-cover" fill sizes="(min-width: 1024px) 50vw, 100vw" src="/brand/channel-dining.jpg" />
              <div className="absolute inset-0 bg-[#163B47]/20" />
              <p className="absolute bottom-7 left-7 text-[11px] font-semibold tracking-[0.18em] text-white/90 sm:left-10">COLD-CHAIN DELIVERY</p>
            </div>
          </div>
        </FadeInSection>
      </section>
    </>
  );
}

function MilestonesPage({ page }: { page: AboutPage }) {
  return <MilestoneTimeline milestones={page.points ?? []} />;
}

function SupplyPage({ page }: { page: AboutPage }) {
  const steps = [["01", "瀏覽企業型錄", "查看品項、包裝與基本規格"], ["02", "建立採購需求", "依使用情境挑選合適產品"], ["03", "加入詢價單", "集中送出品項、規格與預估數量"], ["04", "業務確認供應", "由專人確認條件、交期與後續合作"]];
  return <><LeadImage page={page} /><Narrative page={page} /><CapabilityStrip title="從供應規格，到合作服務" items={page.points ?? []} /><section className="mt-14 border-y border-[#D9E1E5] py-8"><SectionLabel>PURCHASING FLOW</SectionLabel><h2 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">合作流程，讓溝通更有效率</h2><ol className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{steps.map(([number, title, description]) => <li className="border-t-2 border-[#0F5B78] pt-4" key={number}><span className="font-[family-name:var(--ep-font-en)] text-sm text-[#0F5B78]">{number}</span><h3 className="mt-3 font-medium text-[#17262D]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#536168]">{description}</p></li>)}</ol><div className="mt-7 flex flex-wrap gap-3"><Link className="border border-[#0F5B78] bg-[#0F5B78] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0A455D]" href="/business/catalog">前往企業型錄</Link><Link className="border border-[#0F5B78] px-4 py-2.5 text-sm font-medium text-[#0F5B78] transition hover:bg-[#EEF5F7]" href="/business/product-finder">開始需求篩選</Link></div></section><SupplyMap /></>;
}

function QualityPage({ page }: { page: AboutPage }) {
  const certifications = [["/brand/certifications/certig_01.png", "HACCP 食品安全管理"], ["/brand/certifications/certig_02.png", "ISO 22000 食品安全管理"], ["/brand/certifications/certig_03.png", "HALAL 清真認證"], ["/brand/certifications/certig_04.png", "食品安全與供應認證"]];
  return <><LeadImage page={page} className="aspect-[16/7]" /><Narrative page={page} /><CapabilityStrip title="可持續追溯的品質管理環節" items={page.points ?? []} /><section className="mt-14 border-y border-[#D9E1E5] py-8"><SectionLabel>QUALITY REFERENCE</SectionLabel><h2 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">認證與公開資料</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#536168]">各產品適用的證書、檢驗與供應條件，仍請以產品規格書及正式合作文件為準。</p><div className="mt-7 grid grid-cols-2 gap-px bg-[#D9E1E5] md:grid-cols-4">{certifications.map(([path, label]) => <div className="bg-[#FAF9F6] p-5" key={path}><div className="relative h-20"><Image alt={label} className="object-contain object-left" fill sizes="160px" src={path} /></div><p className="mt-3 text-xs leading-5 text-[#536168]">{label}</p></div>)}</div></section></>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SustainabilityHero({ page }: { page: AboutPage }) {
  return <section className="relative min-h-[500px] overflow-hidden bg-[#102F37] text-white sm:min-h-[560px]"><Image alt={page.imageAlt} className="motion-safe:animate-[sustain-pan_18s_ease-out_infinite_alternate] object-cover" fill preload quality={90} sizes="100vw" src={page.imagePath} /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,39,48,.9)_0%,rgba(8,39,48,.62)_48%,rgba(8,39,48,.18)_100%)]" /><div className="relative mx-auto flex min-h-[500px] max-w-[1120px] items-end px-5 pb-28 pt-20 sm:min-h-[560px] sm:px-8 sm:pb-32 lg:px-10"><div className="max-w-2xl"><p className="motion-safe:animate-[sustain-rise_.65s_.08s_both] text-xs font-semibold tracking-[0.26em] text-[#A9D8DF]">{page.kicker}</p><h1 className="motion-safe:animate-[sustain-rise_.8s_.2s_both] mt-5 font-[family-name:var(--ep-font-serif)] text-4xl font-light leading-[1.28] sm:text-6xl">{page.title}</h1><p className="motion-safe:animate-[sustain-rise_.8s_.36s_both] mt-6 max-w-xl text-[15px] leading-8 text-white/85">{page.summary}</p></div></div><nav aria-label="永續責任章節" className="absolute inset-x-5 bottom-7 z-10 mx-auto flex max-w-[1120px] overflow-x-auto border-y border-white/30 text-sm sm:inset-x-8 lg:inset-x-10"><a className="shrink-0 border-r border-white/30 px-5 py-3 text-white transition hover:bg-white/10" href="#commitment">永續承諾</a><a className="shrink-0 border-r border-white/30 px-5 py-3 text-white transition hover:bg-white/10" href="#focus">行動主軸</a><a className="shrink-0 border-r border-white/30 px-5 py-3 text-white transition hover:bg-white/10" href="#records">公開紀錄</a><a className="shrink-0 px-5 py-3 text-white transition hover:bg-white/10" href="#library">永續資料</a></nav></section>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SustainabilityLegacyPage({ page }: { page: AboutPage }) {
  const focuses = [["01", "永續供應", "在產品選擇與供應溝通中，持續回應食品產業對長期責任的期待。", "/brand/channel-global.jpg", "元家國際供應與合作現場"], ["02", "環境行動", "從冷鏈效率、海洋環境到日常管理，將環境議題納入長期行動。", "/brand/cold-storage.jpg", "元家冷鏈與倉儲管理"], ["03", "社會公益", "透過基金會與公益參與，與社會及在地社群建立更長久的連結。", "/brand/foundation-campaign.jpg", "元家博愛公益慈善基金會活動"]];
  const records = [["2014", "成立元家博愛公益慈善基金會", "持續投入捐血、淨灘與弱勢關懷等公益行動。"], ["2018", "通過 MSC-COC 及 ASC-COC 認證", "將永續海鮮選品納入企業公開發展紀錄。"], ["2022", "台南廠榮獲 FSSC 22000 認證", "並投入綠能與魚電共生。"]];
  return <><section className="-mx-5 bg-[#143943] px-5 py-12 text-white sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10" id="commitment"><FadeInSection><p className="text-[11px] font-semibold tracking-[0.22em] text-[#A9D8DF]">OUR COMMITMENT</p><div className="mt-4 grid gap-8 lg:grid-cols-[.85fr_1.15fr]"><h2 className="font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.35] sm:text-4xl">以長期行動，回應食品企業的責任。</h2><div className="space-y-4 text-[15px] leading-8 text-white/80">{page.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></FadeInSection></section><section className="mt-14" id="focus"><div className="border-b border-[#D9E1E5] pb-4"><SectionLabel>SUSTAINABILITY FOCUS</SectionLabel><h2 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">讓責任成為可理解的行動方向</h2></div><div className="mt-7 grid gap-6 md:grid-cols-3">{focuses.map(([number, title, description, imagePath, imageAlt]) => <FadeInSection className="group" key={title}><article className="h-full border border-[#D9E1E5] bg-white"><div className="relative aspect-[4/3] overflow-hidden bg-[#E7E6E0]"><Image alt={imageAlt} className="object-cover transition duration-700 group-hover:scale-[1.035]" fill sizes="(min-width: 768px) 31vw, 100vw" src={imagePath} /></div><div className="p-6"><p className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.16em] text-[#0F5B78]">{number}</p><h3 className="mt-3 text-xl font-medium text-[#17262D]">{title}</h3><p className="mt-3 text-sm leading-7 text-[#536168]">{description}</p></div></article></FadeInSection>)}</div></section><section className="mt-14 border-y border-[#D9E1E5] py-10" id="records"><div className="border-b border-[#D9E1E5] pb-4"><SectionLabel>PUBLIC RECORDS</SectionLabel><h2 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">元家公開的永續紀錄</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#536168]">以下為元家既有公開資料中的永續、認證與公益相關紀錄。</p></div><div className="grid divide-y divide-[#D9E1E5] md:grid-cols-3 md:divide-x md:divide-y-0">{records.map(([year, title, description]) => <FadeInSection className="py-7 md:px-7 md:first:pl-0 md:last:pr-0" key={year}><p className="font-[family-name:var(--ep-font-en)] text-3xl font-light text-[#0F5B78]">{year}</p><h3 className="mt-4 text-lg font-medium leading-7 text-[#17262D]">{title}</h3><p className="mt-3 text-sm leading-7 text-[#536168]">{description}</p></FadeInSection>)}</div></section><section className="mt-14" id="library"><div className="border-b border-[#D9E1E5] pb-4"><SectionLabel>SUSTAINABILITY LIBRARY</SectionLabel><h2 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">永續資料與公益行動</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#536168]">公開報告與公益資訊集中於此，方便合作夥伴查閱元家的永續作為。</p></div><div className="mt-7 grid gap-6 md:grid-cols-3">{page.resources?.map((resource) => <a className="group flex flex-col border border-[#D9E1E5] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#8FB8CD] hover:shadow-[0_12px_28px_rgba(20,57,67,.1)]" href={resource.href} key={resource.title} rel="noreferrer" target="_blank"><div className="relative aspect-[1.42/1] overflow-hidden bg-[#E7E6E0]"><Image alt={resource.imageAlt ?? resource.title} className={resource.imageFit === "contain" ? "object-contain p-10" : "object-cover transition duration-500 group-hover:scale-[1.03]"} fill sizes="(min-width: 768px) 280px, 100vw" src={resource.imagePath ?? "/brand/foundation-logo.png"} /></div><div className="flex min-h-48 flex-col p-5"><span className="text-[10px] tracking-[0.16em] text-[#7C8585]">OFFICIAL RESOURCE</span><h3 className="mt-3 font-[family-name:var(--ep-font-serif)] text-xl font-light text-[#17262D]">{resource.title}</h3><p className="mt-3 flex-1 text-sm leading-7 text-[#536168]">{resource.description}</p><span className="mt-4 text-sm font-medium text-[#005DAA] group-hover:underline">{resource.label} ↗</span></div></a>)}</div></section></>;
}

function SustainabilityPage({ page }: { page: AboutPage }) {
  const libraryCards = (page.resources ?? []).map((resource) => ({
    ...resource,
    eyebrow: resource.title.includes("基金會") ? "SOCIAL PARTICIPATION" : "SUSTAINABILITY REPORTING",
    visualPath: resource.title.includes("基金會") ? "/brand/foundation-logo-official.png" : resource.imagePath ?? "/brand/sustainability-beach-cleanup.jpg",
    visualFit: "contain",
    isFoundation: resource.title.includes("基金會"),
  }));

  return (
    <>
      <section className="mt-24" id="commitment">
        <FadeInSection>
          <div className="grid items-center gap-12 lg:grid-cols-[.94fr_1.18fr] lg:gap-20">
            <div className="max-w-lg">
              <p className="text-5xl font-bold leading-tight tracking-[0.01em] text-[#17262D] sm:text-6xl">Long-term</p>
              <p className="mt-2 font-[family-name:var(--ep-font-serif)] text-5xl font-light leading-tight text-[#0F5B78] sm:text-6xl">Commitment</p>
              <h2 className="mt-5 text-3xl font-medium tracking-[0.08em] text-[#17262D]">永續責任</h2>
              <span className="mt-7 block h-0.5 w-32 bg-[#A6D800]" />
              <p className="mt-8 text-[17px] leading-9 text-[#536168] sm:text-lg">{page.content[0]}</p>
              <a className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#173E49] px-7 py-3.5 text-[15px] font-medium text-white transition hover:bg-[#0F5B78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F5B78]" href="https://charity.yens.com.tw/" rel="noreferrer" target="_blank">
                查看公開資料 <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="relative px-4 pb-4 sm:px-7 sm:pb-7">
              <div className="absolute bottom-0 right-0 h-[87%] w-[87%] rounded-[3rem] bg-[#DDF3E7]" />
              <div className="relative aspect-[1.3/1] overflow-hidden rounded-[3rem] border-[3px] border-white shadow-[0_24px_42px_rgba(20,57,67,.16)]">
                <Image alt="元家博愛公益慈善基金會活動" className="object-cover" fill sizes="(min-width: 1024px) 610px, 100vw" src="/brand/foundation-campaign.jpg" />
                <div className="absolute inset-4 rounded-[2.4rem] border border-white/80 sm:inset-6" />
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      <section className="relative left-1/2 mt-24 w-screen -translate-x-1/2" id="library">
        <FadeInSection>
          <div className="mx-auto mb-9 flex max-w-[1120px] items-end gap-6 px-5 sm:px-8 lg:px-10">
            <div>
              <SectionLabel>SUSTAINABILITY LIBRARY</SectionLabel>
              <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-3xl font-light text-[#17262D]">ESG</h2>
            </div>
            <span className="mb-2 hidden h-px flex-1 bg-[#C9D5D9] md:block" />
          </div>
          <div className="grid md:grid-cols-3">
            {libraryCards.map((resource) => (
              <a className="group flex min-h-[500px] flex-col bg-[#EFF4F4] text-[#17262D] transition hover:bg-[#E5EEEE] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F5B78] sm:min-h-[550px]" href={resource.href} key={resource.title} rel="noreferrer" target="_blank">
                <div className="relative min-h-[300px] flex-1 overflow-hidden">
                  <Image alt={resource.imageAlt ?? resource.title} className="object-contain p-7 transition duration-500 group-hover:scale-[1.025] sm:p-10" fill sizes="(min-width: 768px) 34vw, 100vw" src={resource.visualPath} />
                </div>
                <div className="flex min-h-[210px] flex-col items-center bg-white p-7 text-center sm:p-8">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0F5B78]">{resource.eyebrow}</p>
                  <h3 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light leading-snug">{resource.title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-7 text-[#536168]">{resource.description}</p>
                  <span className="mt-5 inline-flex items-center gap-3 text-sm font-medium text-[#0F5B78] group-hover:underline">{resource.label} <span aria-hidden="true">→</span></span>
                </div>
              </a>
            ))}
          </div>
        </FadeInSection>
      </section>
    </>
  );
}

function PageBody({ page }: { page: AboutPage }) {
  switch (page.slug) {
    case "company": return <CompanyPage page={page} />;
    case "strengths": return <StrengthsPage />;
    case "milestones": return <MilestonesPage page={page} />;
    case "supply-service": return <SupplyPage page={page} />;
    case "quality-safety": return <QualityPage page={page} />;
    case "sustainability": return <SustainabilityPage page={page} />;
  }
}

export default async function BusinessAboutDetailPage(props: PageProps<"/business/about/[slug]">) {
  const { slug } = await props.params;
  const page = getAboutPage(slug);
  if (!page) notFound();
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "business_staff") redirect("/admin/business");
  if (access.role === "b2c") redirect("/");

  return <div className="min-h-screen bg-white font-[family-name:var(--ep-font-sans)] text-[#2B2B2B]"><BusinessHeader companyName={access.companyName} /><EditorialStyles /><main className="-mt-10"><AboutBanner page={page} /><div className="relative z-10 -mt-6 bg-white"><nav aria-label="麵包屑導覽" className="flex items-center gap-2 overflow-hidden whitespace-nowrap px-5 pt-1 pb-5 text-sm text-[#718087] sm:px-8 lg:px-10"><Link className="transition hover:text-[#005DAA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#005DAA]" href="/business">首頁</Link><span aria-hidden="true" className="text-[#B7C3C9]">/</span><Link className="transition hover:text-[#005DAA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#005DAA]" href="/business/about/company">品牌故事</Link><span aria-hidden="true" className="text-[#B7C3C9]">/</span><span aria-current="page" className="font-medium text-[#536168]">{page.label}</span></nav></div><article className={`mx-auto max-w-[960px] px-5 sm:px-8 lg:px-10 ${page.slug === "milestones" ? "py-5 sm:py-6" : "py-8 lg:py-12"}`}><div>{page.slug === "company" || page.slug === "sustainability" || page.slug === "milestones" || page.slug === "strengths" ? null : <PageIntro page={page} />}<PageBody page={page} />{page.externalHref && page.externalLabel ? <div className="mt-10"><a className="border border-[#0F5B78] bg-[#0F5B78] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0A455D]" href={page.externalHref} rel="noreferrer" target="_blank">{page.externalLabel} ↗</a></div> : null}</div></article></main><style>{`@keyframes sustain-rise { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }`}</style></div>;
}

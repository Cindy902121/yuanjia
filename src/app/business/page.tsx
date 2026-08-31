import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { editorialButtonDark } from "@/lib/editorial/styles";
import { getB2BAccess } from "@/lib/b2b/catalog";
import BusinessHeader from "./catalog/business-header";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "企業採購服務 | 元家",
};

const ADVANTAGES = [
  { title: "國際採購", description: "掌握全球水產源頭，通過 MSC、ASC 等國際永續漁業認證，兼顧美味與海洋永續。" },
  { title: "研發生產", description: "自有食品研發中心與生產工廠，取得 FSSC 22000、HACCP 等多項國際品質認證。" },
  { title: "食品安全", description: "專職品保團隊層層把關，全台超過 20 位專職品保人員，每批進貨自主性品質檢測。" },
  { title: "倉儲物流", description: "大型冷凍倉庫全年溫控 -20°C 以下，搭配專業物流管理系統，確保新鮮送達。" },
];

const QUALITY_STEPS = ["全球採購", "專業加工", "品質檢驗", "冷鏈倉儲", "安心到家"];
const QUALITY_FACTS = [
  "全台超過 20 位專職品保人員",
  "每批進貨自主性品質檢測與嚴格溫度管制",
  "主要產品皆依食品安全計畫通過第三方檢驗證明",
  "專業儲位與效期管理系統，100% 無過期產品",
  "大型專業冷凍倉庫、24hr 監控，全年溫度低於 -20℃",
  "自有專業品質檢驗實驗室，配置通過證照之檢測人員",
  "導入企業資源管理系統，產銷履歷記載完整、可追溯",
  "落實食品安全管制系統，配合政府食安推動政策",
];

export default async function BusinessPage() {
  const access = await getB2BAccess();
  if (access.role === "anonymous") redirect("/login");
  if (access.role === "admin") redirect("/admin");
  if (access.role === "b2c") redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F6] font-[family-name:var(--ep-font-sans)] text-[#2B2B2B]">
      <BusinessHeader companyName={access.companyName} />
      <EditorialStyles />
      <main className="flex flex-1 flex-col">
        <section className="relative flex min-h-[520px] items-end overflow-hidden border-b border-[#e5e2da] lg:min-h-[680px]">
          <div aria-hidden="true" className="absolute inset-0">
            <Image alt="" className="object-cover" fill priority sizes="100vw" src="/hero-seafood.jpg" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
          </div>
          <FadeInSection className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 pb-16 pt-32 sm:px-8 lg:px-10 lg:pb-24">
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-white/85">YUANJIA BUSINESS</span>
            <h1 className="font-[family-name:var(--ep-font-serif)] text-[clamp(2.25rem,4vw,3.75rem)] font-light leading-[1.3] tracking-[0.03em] text-white">新鮮有來源，<br />合作更有力量</h1>
            <div aria-hidden="true" className="h-px w-16 bg-white/50" />
            <p className="max-w-md text-[15px] font-light leading-[2] text-white/90">嚴選全球水產與調理食品，從採購、加工到冷鏈配送，為企業採購提供值得信賴的食品服務。</p>
            <Link className={`mt-2 w-fit ${editorialButtonDark}`} href="/business/catalog">探索企業型錄 EXPLORE</Link>
          </FadeInSection>
        </section>

        <section className="border-b border-[#e5e2da]" id="about">
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1fr] lg:gap-20 lg:px-10 lg:py-32">
            <FadeInSection className="flex flex-col gap-8">
              <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">01 · BRAND STORY</span>
              <span className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.05em] text-[#2b2b2b] sm:text-3xl">品牌故事</span>
            </FadeInSection>
            <FadeInSection className="flex flex-col gap-6 lg:pt-16">
              <p className="text-[15px] font-light leading-[2] text-[#4a4a4a]">元家企業的故事，最早可追溯到 1968 年於澎湖草創的「元進行」商行；1979 年於台北正式成立元家企業股份有限公司，隔年在高雄設立冷凍草蝦外銷廠，以自創品牌行銷日本、美國，奠定日後發展的基礎。此後陸續拓展冷凍水產的進口、銷售與生產加工，並跨足調理食品領域，2012 年起積極開拓海外市場。</p>
              <p className="text-[15px] font-light leading-[2] text-[#4a4a4a]">我們期望透過食的流通，將幸福傳遞給世界——提供穩定、值得信賴的商品與服務，同時關懷生態環境的平衡，引領安心的飲食文化。</p>
            </FadeInSection>
          </div>
        </section>

        <section className="border-b border-[#e5e2da] bg-[#F3F1EB]">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-14 px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
            <FadeInSection><span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">02 · STRENGTHS</span><h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.05em] text-[#2b2b2b] sm:text-3xl">企業優勢</h2></FadeInSection>
            <div className="flex flex-col">
              {ADVANTAGES.map((item, index) => <FadeInSection key={item.title}><article className="flex flex-col gap-3 border-t border-[#2b2b2b]/15 py-8 sm:flex-row sm:items-baseline sm:gap-10 lg:py-10"><span className="font-[family-name:var(--ep-font-en)] text-3xl font-thin text-[#3E5C6B] sm:w-24 sm:shrink-0">{String(index + 1).padStart(2, "0")}</span><h3 className="font-[family-name:var(--ep-font-serif)] text-lg font-medium text-[#2b2b2b] sm:w-48 sm:shrink-0">{item.title}</h3><p className="max-w-xl text-sm font-light leading-[1.9] text-[#4a4a4a]">{item.description}</p></article></FadeInSection>)}
            </div>
          </div>
        </section>

        <section className="border-b border-[#e5e2da]" id="quality">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-5 py-20 text-center sm:px-8 lg:px-10 lg:py-32">
            <FadeInSection className="flex flex-col items-center gap-3"><span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">03 · QUALITY</span><h2 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.05em] text-[#2b2b2b] sm:text-3xl">食品安全與品質，是我們的堅持</h2></FadeInSection>
            <FadeInSection><ol className="mx-auto flex max-w-3xl flex-col items-center gap-6 sm:flex-row sm:justify-between">{QUALITY_STEPS.map((step, index, steps) => <li className="flex items-center gap-4" key={step}><div className="flex flex-col items-center gap-3"><span className="font-[family-name:var(--ep-font-en)] text-2xl font-thin text-[#3E5C6B]">{String(index + 1).padStart(2, "0")}</span><p className="text-sm font-medium tracking-[0.05em] text-[#2b2b2b]">{step}</p></div>{index < steps.length - 1 ? <span aria-hidden="true" className="hidden h-px w-8 bg-[#2b2b2b]/20 sm:block" /> : null}</li>)}</ol></FadeInSection>
            <FadeInSection className="mx-auto grid max-w-4xl grid-cols-1 gap-x-10 gap-y-4 text-left sm:grid-cols-2">{QUALITY_FACTS.map((fact) => <p className="border-t border-[#2b2b2b]/10 pt-4 text-sm font-light leading-[1.9] text-[#4a4a4a]" key={fact}>{fact}</p>)}</FadeInSection>
          </div>
        </section>

        <section className="border-b border-[#e5e2da] bg-[#F3F1EB]">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-14 px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
            <FadeInSection><span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">04 · MEDIA</span><h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.05em] text-[#2b2b2b] sm:text-3xl">媒體都在報導元家</h2></FadeInSection>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
              <FadeInSection className="flex flex-col gap-4"><div className="ep-hover-zoom relative aspect-[4/3]"><Image alt="元家食品與海鮮" aria-hidden="true" className="object-cover" fill sizes="(min-width: 1024px) 50vw, 100vw" src="/media-seafood-platter.jpg" /></div><div className="flex items-baseline gap-3"><time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">2026.06.16</time><span className="text-xs tracking-widest text-[#8a8a8a]">風傳媒</span></div><p className="font-[family-name:var(--ep-font-serif)] text-base leading-[1.8] text-[#2b2b2b]">無懼全球波動！元家企業深化垂直整合，2026 食品展大秀上百款頂級海鮮與即食解方</p></FadeInSection>
              <FadeInSection className="flex flex-col gap-4 lg:mt-20"><div className="ep-hover-zoom relative aspect-[4/3]"><Image alt="元家年節料理" aria-hidden="true" className="object-cover" fill sizes="(min-width: 1024px) 50vw, 100vw" src="/media-cny-feast.jpg" /></div><div className="flex items-baseline gap-3"><time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">2025.12.31</time><span className="text-xs tracking-widest text-[#8a8a8a]">經濟日報</span></div><p className="font-[family-name:var(--ep-font-serif)] text-base leading-[1.8] text-[#2b2b2b]">元家企業推「瑪瑙之宴」年菜組，冷鏈科技打造五星級團圓饗宴</p></FadeInSection>
            </div>
            <FadeInSection><Link className="group inline-flex items-center gap-3 font-[family-name:var(--ep-font-en)] text-sm tracking-[0.15em] text-[#2b2b2b]" href="/business/news"><span>查看企業最新消息 MORE</span><span aria-hidden="true" className="h-px w-8 bg-[#2b2b2b] transition-all duration-300 group-hover:w-12" /></Link></FadeInSection>
          </div>
        </section>

        <section><div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-5 py-24 text-center sm:px-8 lg:py-32"><FadeInSection><p className="font-[family-name:var(--ep-font-serif)] text-xl font-light leading-[2] tracking-[0.05em] text-[#2b2b2b] sm:text-2xl">我們期望透過食的流通，<br />將幸福傳遞給世界。</p></FadeInSection></div></section>
      </main>
    </div>
  );
}

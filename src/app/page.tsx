import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildOpenGraph, canonicalFor, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { editorialButtonDark } from "@/lib/editorial/styles";

const TITLE = "元家｜新鮮海鮮與調理食品";
const DESCRIPTION = "元家精選冷凍海鮮與調理食品，從商品列表開始探索。";

/**
 * Organization 結構化資料，只放首頁一份（慣例做法）。公司全名／地址／電話／
 * 社群連結都直接取自 Footer.tsx 已經在用的同一批真實資料。
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "元家企業股份有限公司",
  alternateName: "YEN & Brothers Enterprise CO., LTD.",
  url: SITE_URL,
  logo: `${SITE_URL}/yens-logo.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "新北大道二段 217 號 14 樓",
    addressLocality: "新莊區",
    addressRegion: "新北市",
    postalCode: "242",
    addressCountry: "TW",
  },
  telephone: "+886-2-8521-1230",
  sameAs: [
    "https://www.youtube.com/@yensseafood",
    "https://www.facebook.com/yensseafood",
    "https://www.instagram.com/yensseafood",
    "https://www.tiktok.com/@yensseafood",
  ],
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonicalFor("/"),
  openGraph: buildOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/hero-seafood.jpg", width: 970, height: 980, alt: "元家精選海鮮" }],
  }),
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

/**
 * / 首頁。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風（原本只在 /design-preview
 * 的提案，見 docs/design-editorial-proposal.md），正式取代 design.md 舊有的
 * 「海洋藍＋鮮活綠」系統，這裡直接把預覽內容搬進正式首頁（原本的 design.md
 * 版面已被取代，不再保留於這個檔案，歷史版本可從 git 記錄查）。
 *
 * 內容（品牌故事、企業優勢、食安 5 步驟＋控管重點、媒體報導精選）全部沿用真實
 * 資料，跟 /design-preview 完全一致，只是連結從 `/design-preview/*` 改回正式
 * 路徑（`/products`、`/media` 等）。
 *
 * 已知範圍差異：舊版首頁有「快速分類」區塊（6 個分類卡片直接連到
 * /products/categories/[slug]），這次沒有沿用——編輯風偏好少而精的入口，
 * 分類瀏覽已經有 Header「商品分類」連到 /products 頁面本身的篩選欄可以做，
 * 如果之後覺得還是需要首頁快速入口，可以再加回來，不是技術上做不到。
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col bg-[#FAF9F6] font-[family-name:var(--ep-font-sans)] text-[#2B2B2B]">
      <JsonLd data={organizationJsonLd} />
      <EditorialStyles />

      {/* HERO：左右滿版真實照片，白色文字疊在圖片上，底部深色漸層維持對比。 */}
      <section className="relative flex min-h-[520px] items-end overflow-hidden border-b border-[#e5e2da] lg:min-h-[680px]">
        <div className="absolute inset-0" aria-hidden="true">
          <Image src="/hero-seafood.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
        </div>

        <FadeInSection className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 pb-16 pt-32 sm:px-8 lg:px-10 lg:pb-24">
          <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-white/85">
            YUANJIA
          </span>
          <h1 className="font-[family-name:var(--ep-font-serif)] text-[clamp(2.25rem,4vw,3.75rem)] font-light leading-[1.3] tracking-[0.03em] text-white">
            新鮮有來源，
            <br />
            生活更有味
          </h1>
          <div className="h-px w-16 bg-white/50" aria-hidden="true" />
          <p className="max-w-md text-[15px] font-light leading-[2] text-white/90">
            嚴選全球水產與即食料理，從採購、加工到冷鏈配送，替每一餐守住品質。
          </p>
          <Link href="/products" className={`mt-2 w-fit ${editorialButtonDark}`}>
            開始挑選 EXPLORE
          </Link>
        </FadeInSection>
      </section>

      {/* 01 品牌故事 */}
      <section id="about" className="scroll-mt-20 border-b border-[#e5e2da]">
        <div id="brand-story" className="scroll-mt-20 mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1fr] lg:gap-20 lg:px-10 lg:py-32">
          <FadeInSection className="flex flex-col gap-8">
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">
              01 · BRAND STORY
            </span>
            <span className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.05em] text-[#2b2b2b] sm:text-3xl">
              品牌故事
            </span>
          </FadeInSection>

          <FadeInSection className="flex flex-col gap-6 lg:pt-16">
            <p className="text-[15px] font-light leading-[2] text-[#4a4a4a]">
              元家企業的故事，最早可追溯到 1968 年於澎湖草創的「元進行」商行；1979
              年於台北正式成立元家企業股份有限公司，隔年在高雄設立冷凍草蝦外銷廠，以自創品牌行銷日本、美國，奠定日後發展的基礎。此後陸續拓展冷凍水產的進口、銷售與生產加工，並跨足調理食品領域，2012
              年起積極開拓海外市場，成為橫跨零售、餐飲、電商與國際貿易的水產食品供應商。
            </p>
            <p className="text-[15px] font-light leading-[2] text-[#4a4a4a]">
              我們期望透過食的流通，將幸福傳遞給世界——提供穩定、值得信賴的商品與服務，同時關懷生態環境的平衡，引領安心的飲食文化。
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* 02 企業優勢：雜誌式清單，不是卡片格線。 */}
      <section className="border-b border-[#e5e2da] bg-[#F3F1EB]">
        <div id="advantages" className="scroll-mt-20 mx-auto flex w-full max-w-[1200px] flex-col gap-14 px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
          <FadeInSection>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">
              02 · STRENGTHS
            </span>
            <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.05em] text-[#2b2b2b] sm:text-3xl">
              企業優勢
            </h2>
          </FadeInSection>

          <div className="flex flex-col">
            {ADVANTAGES.map((item, index) => (
              <FadeInSection key={item.title}>
                <div className="flex flex-col gap-3 border-t border-[#2b2b2b]/15 py-8 sm:flex-row sm:items-baseline sm:gap-10 lg:py-10">
                  <span className="font-[family-name:var(--ep-font-en)] text-3xl font-thin text-[#3E5C6B] sm:w-24 sm:shrink-0">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-[family-name:var(--ep-font-serif)] text-lg font-medium text-[#2b2b2b] sm:w-48 sm:shrink-0">
                    {item.title}
                  </h3>
                  <p className="max-w-xl text-sm font-light leading-[1.9] text-[#4a4a4a]">{item.description}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* 03 食安與品質 */}
      <section id="quality" className="scroll-mt-20 border-b border-[#e5e2da]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-5 py-20 text-center sm:px-8 lg:px-10 lg:py-32">
          <FadeInSection className="flex flex-col items-center gap-3">
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">
              03 · QUALITY
            </span>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.05em] text-[#2b2b2b] sm:text-3xl">
              食品安全與品質，是我們的堅持
            </h2>
          </FadeInSection>

          <FadeInSection>
            <ol className="mx-auto flex max-w-3xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
              {QUALITY_STEPS.map((step, index, arr) => (
                <li key={step} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-3">
                    <span className="font-[family-name:var(--ep-font-en)] text-2xl font-thin text-[#3E5C6B]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm font-medium tracking-[0.05em] text-[#2b2b2b]">{step}</p>
                  </div>
                  {index < arr.length - 1 ? (
                    <span aria-hidden="true" className="hidden h-px w-8 bg-[#2b2b2b]/20 sm:block" />
                  ) : null}
                </li>
              ))}
            </ol>
          </FadeInSection>

          <FadeInSection className="mx-auto grid max-w-4xl grid-cols-1 gap-x-10 gap-y-4 text-left sm:grid-cols-2">
            {QUALITY_FACTS.map((fact) => (
              <p key={fact} className="border-t border-[#2b2b2b]/10 pt-4 text-sm font-light leading-[1.9] text-[#4a4a4a]">
                {fact}
              </p>
            ))}
          </FadeInSection>
        </div>
      </section>

      {/* 04 媒體報導：非對稱圖文跨頁，用真實裁切過的新聞照片。 */}
      <section className="border-b border-[#e5e2da] bg-[#F3F1EB]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-14 px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
          <FadeInSection>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">
              04 · MEDIA
            </span>
            <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.05em] text-[#2b2b2b] sm:text-3xl">
              媒體都在報導元家
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            <FadeInSection className="flex flex-col gap-4">
              <div className="ep-hover-zoom relative aspect-[4/3]">
                <Image src="/media-seafood-platter.jpg" alt="" aria-hidden="true" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="flex items-baseline gap-3">
                <time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">2026.06.16</time>
                <span className="text-xs tracking-widest text-[#8a8a8a]">風傳媒</span>
              </div>
              <p className="font-[family-name:var(--ep-font-serif)] text-base leading-[1.8] text-[#2b2b2b]">
                無懼全球波動！元家企業深化垂直整合 2026食品展大秀上百款頂級海鮮與即食解方
              </p>
            </FadeInSection>

            <FadeInSection className="flex flex-col gap-4 lg:mt-20">
              <div className="ep-hover-zoom relative aspect-[4/3]">
                <Image src="/media-cny-feast.jpg" alt="" aria-hidden="true" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="flex items-baseline gap-3">
                <time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">2025.12.31</time>
                <span className="text-xs tracking-widest text-[#8a8a8a]">經濟日報</span>
              </div>
              <p className="font-[family-name:var(--ep-font-serif)] text-base leading-[1.8] text-[#2b2b2b]">
                元家企業推「瑪瑙之宴」年菜組 冷鏈科技打造五星級團圓饗宴
              </p>
            </FadeInSection>
          </div>

          <FadeInSection>
            <Link
              href="/media"
              className="group inline-flex items-center gap-3 font-[family-name:var(--ep-font-en)] text-sm tracking-[0.15em] text-[#2b2b2b]"
            >
              查看完整媒體報導 MORE
              <span className="h-px w-8 bg-[#2b2b2b] transition-all duration-300 group-hover:w-12" aria-hidden="true" />
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* 收尾引言，呼應參考站尾段的品牌心聲寫法，文字沿用首頁既有真實文案。 */}
      <section>
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-5 py-24 text-center sm:px-8 lg:py-32">
          <FadeInSection>
            <p className="font-[family-name:var(--ep-font-serif)] text-xl font-light leading-[2] tracking-[0.05em] text-[#2b2b2b] sm:text-2xl">
              我們期望透過食的流通，
              <br />
              將幸福傳遞給世界。
            </p>
          </FadeInSection>
        </div>
      </section>
    </main>
  );
}

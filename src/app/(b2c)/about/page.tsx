import Image from "next/image";
import type { Metadata } from "next";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";

const TITLE = "關於元家 | 元家";
const DESCRIPTION = "元家企業的品牌故事、企業優勢與經營理念，從 1968 年澎湖草創至今的水產食品供應商。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonicalFor("/about"),
  openGraph: buildOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    url: "/about",
    images: [{ url: "/hero-seafood.jpg", width: 970, height: 980, alt: "元家精選海鮮" }],
  }),
};

const ADVANTAGES = [
  { title: "國際採購", description: "掌握全球水產源頭，通過 MSC、ASC 等國際永續漁業認證，兼顧美味與海洋永續。" },
  { title: "研發生產", description: "自有食品研發中心與生產工廠，取得 FSSC 22000、HACCP 等多項國際品質認證。" },
  { title: "食品安全", description: "專職品保團隊層層把關，全台超過 20 位專職品保人員，每批進貨自主性品質檢測。" },
  { title: "倉儲物流", description: "大型冷凍倉庫全年溫控 -20°C 以下，搭配專業物流管理系統，確保新鮮送達。" },
];

/**
 * /about 頁面（2026-08-19，PRD B2C 伸展項目，8/17-8/22 團隊任務清單列為選做）。
 *
 * 首頁本來就有 #brand-story／#advantages 兩個錨點區塊涵蓋同樣內容（見
 * src/app/page.tsx），這裡不是重新編一份新內容，而是把同樣的真實內容（品牌
 * 故事、企業優勢，來源見首頁檔案的檔頭說明）做成一個有獨立網址、可以直接
 * 分享／被搜尋引擎索引的頁面，適合「關於我們」這種常被外部連結／SEO 需要
 * 獨立網址的情境（首頁的錨點區塊沒有自己的 title／description，分享出去
 * 只會看到「元家首頁」，不是「關於元家」）。
 *
 * 內容跟首頁保持一致（同一份真實資料），故意沒有另外加首頁沒有的新事實內容，
 * 避免同一件事在两個地方各講一個版本、之後其中一邊漏改。
 */
export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <EditorialStyles />

      {/* Hero：跟首頁同樣的滿版圖片＋白字疊層手法。 */}
      <section className="relative flex min-h-[360px] items-end overflow-hidden border-b border-[#D4DEE2] lg:min-h-[440px]">
        <div className="absolute inset-0" aria-hidden="true">
          <Image src="/hero-seafood.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
        </div>
        <FadeInSection className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-5 pb-14 pt-24 sm:px-8 lg:px-10">
          <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-white/85">
            ABOUT
          </span>
          <h1 className="font-[family-name:var(--ep-font-serif)] text-3xl font-light tracking-[0.05em] text-white sm:text-4xl">
            關於元家
          </h1>
        </FadeInSection>
      </section>

      {/* 品牌故事 */}
      <section className="border-b border-[#D4DEE2]">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1fr] lg:gap-20 lg:px-10 lg:py-32">
          <FadeInSection className="flex flex-col gap-8">
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
              01 · BRAND STORY
            </span>
            <span className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.05em] text-[#0B1620] sm:text-3xl">
              品牌故事
            </span>
          </FadeInSection>

          <FadeInSection className="flex flex-col gap-6 lg:pt-16">
            <p className="text-[15px] font-light leading-[2] text-[#5C7383]">
              元家企業的故事，最早可追溯到 1968 年於澎湖草創的「元進行」商行；1979
              年於台北正式成立元家企業股份有限公司，隔年在高雄設立冷凍草蝦外銷廠，以自創品牌行銷日本、美國，奠定日後發展的基礎。此後陸續拓展冷凍水產的進口、銷售與生產加工，並跨足調理食品領域，2012
              年起積極開拓海外市場，成為橫跨零售、餐飲、電商與國際貿易的水產食品供應商。
            </p>
            <p className="text-[15px] font-light leading-[2] text-[#5C7383]">
              我們期望透過食的流通，將幸福傳遞給世界——提供穩定、值得信賴的商品與服務，同時關懷生態環境的平衡，引領安心的飲食文化。
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* 企業優勢 */}
      <section className="border-b border-[#D4DEE2] bg-[#F6FBFC]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-14 px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
          <FadeInSection>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
              02 · STRENGTHS
            </span>
            <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.05em] text-[#0B1620] sm:text-3xl">
              企業優勢
            </h2>
          </FadeInSection>

          <div className="flex flex-col">
            {ADVANTAGES.map((item, index) => (
              <FadeInSection key={item.title}>
                <div className="flex flex-col gap-3 border-t border-[#0B1620]/15 py-8 sm:flex-row sm:items-baseline sm:gap-10 lg:py-10">
                  <span className="font-[family-name:var(--ep-font-en)] text-3xl font-thin text-[#FF5A36] sm:w-24 sm:shrink-0">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-[family-name:var(--ep-font-serif)] text-lg font-medium text-[#0B1620] sm:w-48 sm:shrink-0">
                    {item.title}
                  </h3>
                  <p className="max-w-xl text-sm font-light leading-[1.9] text-[#5C7383]">{item.description}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* 公司資訊，跟 Footer 同一份真實資料。 */}
      <section>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-5 py-20 text-center sm:px-8 lg:py-24">
          <FadeInSection>
            <p className="font-[family-name:var(--ep-font-serif)] text-lg text-[#0B1620]">
              元家企業股份有限公司
              <br />
              <span className="text-sm text-[#5C7383]">YEN &amp; Brothers Enterprise CO., LTD.</span>
            </p>
            <p className="mt-4 text-sm font-light leading-7 text-[#5C7383]">
              地址：242 新北市新莊區新北大道二段 217 號 14 樓
              <br />
              代表號：(02)8521-1230
            </p>
          </FadeInSection>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { WaterRipple } from "@/app/(b2c)/_ocean/water-ripple";
import { ScallopLineArt } from "@/app/(b2c)/_ocean/marine-line-art";
import { editorialButtonLight } from "@/lib/editorial/styles";
import { heroContent, introContent, timeline, strengthsContent, closingContent } from "./about-content";
import { AboutTimeline } from "./about-timeline";
import { AboutStrengths } from "./about-strengths";

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

/**
 * /about 頁面（2026-08-19 原始建立，PRD B2C 伸展項目）。
 *
 * 2026-09-11：正式版改版。原本是首頁 #brand-story／#advantages 兩個錨點
 * 區塊的精簡摘要搬過來的獨立網址版本（品牌故事兩段文字＋企業優勢四行
 * 條列），這次換成完整的品牌故事＋24 筆大事紀互動時間軸＋企業優勢深度
 * 版面——先在獨立的 `/about-preview` Preview Route 做完整設計、時間軸
 * 互動、Correction Pass（移除深色背景／放大過小字級／確認圖片）三輪，
 * 使用者確認設計後這次正式套用到這個既有的 `/about` 路徑上：
 *
 * - 網址維持原樣，不是新路徑——`sitemap.ts` 早就有 `/about` 這筆
 *   （monthly／priority 0.6），完全不需要動 sitemap／robots。
 * - 這個檔案在 `(b2c)` route group 底下，Header／Footer／
 *   B2CHelpWidget／GA4 由 `(b2c)/layout.tsx` 自動套用（見該檔案），
 *   不是這個頁面自己要處理的事，也不會漏掉。
 * - 內容資料層（`about-content.ts`）全部 import 自既有、真實、來源是
 *   yens.com.tw 的 `src/app/business/about/about-data.ts`，不重寫任何
 *   年份／數字／事實。首頁 `(b2c)/page.tsx` 的品牌故事／企業優勢
 *   Section 完全沒有被這次改版觸碰，兩邊各自獨立維護版面，只共用同一份
 *   事實資料源頭。
 * - 原本 `/about-preview` 底下的四個檔案已經整組搬過來（`page.tsx`／
 *   `about-content.ts`／`about-timeline.tsx`／`about-strengths.tsx`），
 *   `src/app/about-preview/` 這個 Preview 專用資料夾已刪除，避免正式版
 *   上線後還留著一份內容重複、且沒有 Header／Footer 的舊版孤兒頁面。
 */
export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <EditorialStyles />
      <WaterRipple />

      {/* About Hero：安靜開場，Typography 為主，不放照片、不複製首頁 Hero。 */}
      <section className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 lg:px-10 lg:pb-40 lg:pt-40">
        <ScallopLineArt
          tone="light"
          opacity={0.07}
          className="right-[-60px] top-6 hidden h-[260px] w-[400px] lg:block"
        />
        <FadeInSection className="relative mx-auto flex w-full max-w-[1200px] flex-col gap-6">
          <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.4em] text-[#536168]">
            {heroContent.kicker}
          </span>
          <h1 className="max-w-3xl font-[family-name:var(--ep-font-serif)] text-4xl font-light leading-[1.35] tracking-[0.02em] text-[#0B1620] sm:text-5xl lg:text-6xl">
            {heroContent.title}
          </h1>
        </FadeInSection>
        <FadeInSection
          aria-hidden="true"
          className="relative mx-auto mt-24 flex w-full max-w-[1200px] justify-center lg:mt-32"
        >
          <span className="h-10 w-px bg-[#0B1620]/25" />
        </FadeInSection>
      </section>

      {/* Brand Introduction：Lead → 短段落 → Key Quote → 數字，建立閱讀節奏。 */}
      <section className="border-t border-[#0B1620]/10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
          <FadeInSection className="max-w-2xl">
            <p className="font-[family-name:var(--ep-font-serif)] text-2xl font-light leading-[1.6] text-[#0B1620] sm:text-3xl">
              {introContent.lead}
            </p>
          </FadeInSection>
          <FadeInSection className="max-w-xl">
            <p className="text-[17px] font-light leading-[1.9] text-[#0B1620] sm:text-[18px]">
              {introContent.paragraph}
            </p>
          </FadeInSection>
          <FadeInSection className="border-y border-[#0B1620]/15 py-10">
            <p className="mx-auto max-w-2xl text-center font-[family-name:var(--ep-font-serif)] text-xl font-light leading-[1.9] tracking-[0.03em] text-[#0B1620] sm:text-2xl">
              {introContent.quote}
            </p>
          </FadeInSection>
          <FadeInSection className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {introContent.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-2 border-l border-[#0B1620]/15 pl-4">
                <span className="font-[family-name:var(--ep-font-en)] text-3xl font-thin text-[#C2401D] sm:text-4xl">
                  {stat.value}
                </span>
                <span className="text-sm font-light text-[#536168]">{stat.label}</span>
              </div>
            ))}
          </FadeInSection>
        </div>
      </section>

      {/* History Timeline：本頁核心互動，見 about-timeline.tsx。 */}
      <section className="border-t border-[#0B1620]/10 pt-20 lg:pt-32">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-5 pb-14 sm:px-8 lg:px-10">
          <FadeInSection>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
              HISTORY · 1968—TODAY
            </span>
            <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#0B1620] sm:text-3xl">
              每一年，都是元家往前的一小步。
            </h2>
          </FadeInSection>
        </div>
        <AboutTimeline timeline={timeline} />
      </section>

      {/* Enterprise Strengths：bg-[#F6FBFC]（首頁企業優勢既有在用的極淡
          色階）做輕微 tonal variation，不用大面積深色背景區隔 Section。 */}
      <section className="border-t border-[#0B1620]/10 bg-[#F6FBFC] px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto w-full max-w-[1200px]">
          <FadeInSection className="mb-16 max-w-2xl">
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
              STRENGTHS
            </span>
            <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#0B1620] sm:text-3xl">
              {strengthsContent.lead}
            </h2>
            <p className="mt-4 max-w-lg text-[17px] font-light leading-[1.85] text-[#536168]">
              {strengthsContent.summary}
            </p>
          </FadeInSection>
          <AboutStrengths items={strengthsContent.items} />
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-[#0B1620]/10 px-5 py-24 text-center sm:px-8 lg:py-32">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
          <FadeInSection>
            <p className="font-[family-name:var(--ep-font-serif)] text-xl font-light leading-[1.9] tracking-[0.03em] text-[#0B1620] sm:text-2xl">
              {closingContent.statement}
            </p>
          </FadeInSection>
          <FadeInSection>
            <Link href="/products" className={editorialButtonLight}>
              瀏覽商品 →
            </Link>
          </FadeInSection>
        </div>
      </section>
    </main>
  );
}

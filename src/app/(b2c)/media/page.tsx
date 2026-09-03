import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";
import { MEDIA_ITEMS } from "@/lib/content/media-items";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";

const TITLE = "媒體報導 | 元家";
const DESCRIPTION = "元家企業歷年媒體報導精選，涵蓋財經、產業、生活等多家媒體。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonicalFor("/media"),
  openGraph: buildOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    url: "/media",
    images: [{ url: "/media-seafood-platter.jpg", width: 880, height: 429, alt: "元家媒體報導" }],
  }),
};

/**
 * /media 頁面。內容來源／挑選標準／圖片裁切原則見
 * src/lib/content/media-items.ts 檔頭說明，這裡只負責畫面。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，正式取代舊版卡片清單，換成
 * 數字編號＋非對稱兩欄跨頁（有圖的項目左右交錯），沒圖的項目收成純文字條列
 * （跟舊版「沒有乾淨圖片就維持純文字」的原則一致）。
 *
 * 這頁本身沒有掛結構化資料——這些不是我們自己發布的新聞（NewsArticle 這個
 * schema 語意是「這個頁面本身就是一篇報導」，我們只是整理別人報導我們的
 * 清單，用了語意會不正確）。
 *
 * 2026-08-25：部分報導原文資訊量夠豐富，值得做成深度詳情頁
 * （`/media/[slug]`，內容見 src/lib/content/media-detail.ts）——這幾篇的
 * `READ MORE`／清單項目改連到站內詳情頁（`Link`），不是外部原文
 * （`item.slug` 有值時）；沒有詳情頁的報導維持連到外部原文（`item.slug`
 * 是 undefined 時，跟改版前行為一樣）。**這頁本身**還是純引用清單，不需要
 * 掛結構化資料，真正的 `Article`／`FAQPage` schema 是掛在
 * `/media/[slug]` 詳情頁裡，不是這裡。
 */
export default function MediaPage() {
  const withImage = MEDIA_ITEMS.filter((item) => item.image);
  const textOnly = MEDIA_ITEMS.filter((item) => !item.image);

  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <EditorialStyles />

      <section className="border-b border-[#D4DEE2]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <FadeInSection>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
              PRESS
            </span>
            <h1 className="mt-3 font-[family-name:var(--ep-font-serif)] text-3xl font-light tracking-[0.05em] text-[#0B1620] sm:text-4xl">
              媒體都在報導元家
            </h1>
          </FadeInSection>
        </div>
      </section>

      {/* 有圖的報導：數字編號＋非對稱兩欄，單雙數左右交錯。 */}
      <section>
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-20 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          {withImage.map((item, index) => (
            <FadeInSection key={item.sourceUrl}>
              <div
                className={`grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16 ${
                  index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="ep-hover-zoom relative aspect-[4/3]">
                  {item.image ? (
                    <Image src={item.image.src} alt={item.image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-col gap-4">
                  <span className="font-[family-name:var(--ep-font-en)] text-2xl font-thin text-[#FF5A36]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">
                      {item.date.replaceAll("-", ".")}
                    </time>
                    <span className="text-xs tracking-widest text-[#5C7383]">{item.outlet}</span>
                  </div>
                  <h2 className="font-[family-name:var(--ep-font-serif)] text-xl leading-[1.6] text-[#0B1620]">
                    {item.title}
                  </h2>
                  <p className="text-sm font-light leading-[1.9] text-[#5C7383]">{item.summary}</p>
                  {item.slug ? (
                    <Link
                      href={`/media/${item.slug}`}
                      className="group mt-1 inline-flex w-fit items-center gap-3 font-[family-name:var(--ep-font-en)] text-xs tracking-[0.15em] text-[#0B1620]"
                    >
                      READ MORE
                      <span className="h-px w-6 bg-[#0B1620] transition-all duration-300 group-hover:w-10" aria-hidden="true" />
                    </Link>
                  ) : (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group mt-1 inline-flex w-fit items-center gap-3 font-[family-name:var(--ep-font-en)] text-xs tracking-[0.15em] text-[#0B1620]"
                    >
                      READ MORE
                      <span className="h-px w-6 bg-[#0B1620] transition-all duration-300 group-hover:w-10" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* 沒有圖的報導：純文字條列。 */}
      <section className="border-t border-[#D4DEE2] bg-[#F6FBFC]">
        <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
              MORE COVERAGE
            </span>
          </FadeInSection>
          <div className="flex flex-col">
            {textOnly.map((item) => {
              const rowClassName =
                "group flex flex-col gap-2 border-t border-[#0B1620]/15 py-6 sm:flex-row sm:items-baseline sm:gap-8";
              const rowContent = (
                <>
                  <time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383] sm:w-24 sm:shrink-0">
                    {item.date.replaceAll("-", ".")}
                  </time>
                  <span className="text-xs tracking-widest text-[#5C7383] sm:w-24 sm:shrink-0">{item.outlet}</span>
                  <span className="font-[family-name:var(--ep-font-serif)] text-sm leading-[1.7] text-[#0B1620] group-hover:text-[#FF5A36]">
                    {item.title}
                  </span>
                </>
              );

              return (
                <FadeInSection key={item.sourceUrl}>
                  {item.slug ? (
                    <Link href={`/media/${item.slug}`} className={rowClassName}>
                      {rowContent}
                    </Link>
                  ) : (
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer" className={rowClassName}>
                      {rowContent}
                    </a>
                  )}
                </FadeInSection>
              );
            })}
          </div>
          <FadeInSection>
            <a
              href="https://www.yens.com.tw/msg/message-%E5%AA%92%E9%AB%94%E5%A0%B1%E5%B0%8E-18.html"
              target="_blank"
              rel="noreferrer"
              className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.15em] text-[#5C7383] hover:text-[#FF5A36]"
            >
              查看完整媒體報導列表（元家官網）↗
            </a>
          </FadeInSection>
        </div>
      </section>
    </main>
  );
}

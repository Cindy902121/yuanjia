import Link from "next/link";
import type { Metadata } from "next";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";
import { NEWS_ARTICLES } from "@/lib/content/news-items";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";

const TITLE = "最新消息 | 元家";
const DESCRIPTION = "元家企業最新消息與深度報導整理，涵蓋供應鏈、產業動態與經營現況。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonicalFor("/news"),
  openGraph: buildOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    url: "/news",
    images: [{ url: "/products-banner.jpg", width: 1920, height: 380, alt: "元家最新消息" }],
  }),
};

/**
 * /news 頁面（2026-08-25 新增，SEO／AEO／GEO 內容策略，見
 * src/lib/content/news-items.ts 檔頭說明）。
 *
 * 跟 /media（第三方報導清單）不一樣，這裡每篇都是獨立網址的原創編輯內容
 * （/news/[slug]），這頁只負責列表＋導讀，實際內容在各自的詳情頁。
 *
 * 目前只有 1 篇，畫面還是用 map 處理，之後新增文章不用改這頁。
 */
export default function NewsPage() {
  return (
    <main className="flex flex-1 flex-col bg-[#FAF9F6] font-[family-name:var(--ep-font-sans)] text-[#2B2B2B]">
      <EditorialStyles />

      <section className="border-b border-[#e5e2da]">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <FadeInSection>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">
              NEWS
            </span>
            <h1 className="mt-3 font-[family-name:var(--ep-font-serif)] text-3xl font-light tracking-[0.05em] text-[#2b2b2b] sm:text-4xl">
              最新消息
            </h1>
          </FadeInSection>
        </div>
      </section>

      <section>
        <div className="mx-auto flex w-full max-w-[1100px] flex-col px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          {NEWS_ARTICLES.map((article, index) => (
            <FadeInSection key={article.slug}>
              <Link
                href={`/news/${article.slug}`}
                className="group flex flex-col gap-3 border-t border-[#2b2b2b]/15 py-10 first:border-t-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E5C6B]"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-[family-name:var(--ep-font-en)] text-2xl font-thin text-[#3E5C6B]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
                    {article.publishDate}
                  </time>
                </div>
                <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium leading-[1.6] text-[#2b2b2b] group-hover:text-[#3E5C6B] sm:text-2xl">
                  {article.title}
                </h2>
                <p className="max-w-2xl text-sm font-light leading-[1.8] text-[#4a4a4a]">
                  {article.summaryBullets[0]}
                </p>
              </Link>
            </FadeInSection>
          ))}
        </div>
      </section>
    </main>
  );
}

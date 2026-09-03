import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildOpenGraph, canonicalFor, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { NEWS_ARTICLES, getNewsArticle } from "@/lib/content/news-items";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";

/**
 * /news/[slug] 頁面（2026-08-25 新增，同日重新定位、同日正式填入內容）。
 * 內容產製脈絡、資料結構說明見 src/lib/content/news-items.ts 檔頭說明，
 * 這裡只負責畫面。
 *
 * `/news` 現在專門放元家自己發布的第一手消息（新品、優惠、公告），跟
 * `/media`（別人報導我們，深度內容在 `/media/[slug]`）是兩回事。
 *
 * 版面對應內容結構：30 秒摘要（AEO）→ 背景與品質承諾 → 活動方案／規格明細
 * （GEO 結構化表格）→ 購買與參與說明 → 熱門問答（AEO FAQ）。
 *
 * 結構化資料掛 `Article`（第一手公告本身就是元家發布的原創內容，用
 * `Article` 是保守但正確的類型）跟 `BreadcrumbList`；`FAQPage` 只在文章
 * 自己填了 `faq` 才會掛。
 */
export function generateStaticParams() {
  return NEWS_ARTICLES.map((article) => ({ slug: article.slug }));
}

/**
 * 2026-08-25（實測發現，內容還是空陣列時期留下的紀錄，先保留）：
 * `generateStaticParams()` 回傳空陣列時，Next.js 16 對沒有預先產生的
 * slug 呼叫 `notFound()` 會拋出 DYNAMIC_SERVER_USAGE 變成 500，而不是
 * 正常的 404。現在 `NEWS_ARTICLES` 已經有內容、`generateStaticParams()`
 * 不再回傳空陣列，理論上已經不會觸發這個邊界狀況，但先保留
 * `force-dynamic`，之後確認穩定後再評估要不要拿掉、改吃靜態產生的效能
 * 好處。
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsArticle(slug);
  if (!article) {
    return { title: "找不到頁面 | 元家" };
  }

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: canonicalFor(`/news/${slug}`),
    openGraph: buildOpenGraph({
      title: article.metaTitle,
      description: article.metaDescription,
      url: `/news/${slug}`,
      images: [{ url: "/products-banner.jpg", width: 1920, height: 380, alt: article.title }],
    }),
  };
}

export default async function NewsArticlePage({ params }: PageProps<"/news/[slug]">) {
  const { slug } = await params;
  const article = getNewsArticle(slug);
  if (!article) {
    notFound();
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishDate,
    author: { "@type": "Organization", name: "元家企業股份有限公司" },
    publisher: {
      "@type": "Organization",
      name: "元家企業股份有限公司",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/yens-logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/news/${slug}` },
  };

  const faqJsonLd =
    article.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "最新消息", item: `${SITE_URL}/news` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${SITE_URL}/news/${slug}` },
    ],
  };

  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <JsonLd data={articleJsonLd} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      <JsonLd data={breadcrumbJsonLd} />
      <EditorialStyles />

      <article className="border-b border-[#D4DEE2]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <FadeInSection className="flex flex-col gap-4">
            <nav aria-label="breadcrumb" className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">
              <Link href="/news" className="hover:text-[#FF5A36]">
                ← ALL NEWS
              </Link>
            </nav>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
              NEWS
            </span>
            <h1 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light leading-[1.5] tracking-[0.02em] text-[#0B1620] sm:text-3xl">
              {article.title}
            </h1>
            <time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">
              {article.publishDate}
            </time>
          </FadeInSection>

          {/* 活動速報／30 秒摘要：AEO 精選摘要，故意放在文章最前面。 */}
          <FadeInSection className="flex flex-col gap-3 border-l-2 border-[#FF5A36] bg-[#F6FBFC] px-6 py-6">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">
              活動速報
            </span>
            <ul className="flex flex-col gap-2">
              {article.summaryBullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm font-light leading-[1.8] text-[#0B1620]">
                  <span aria-hidden="true">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </FadeInSection>
        </div>
      </article>

      {/* 背景與品質承諾 */}
      <section className="border-b border-[#D4DEE2]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#0B1620]">背景與品質承諾</h2>
          </FadeInSection>
          <FadeInSection className="flex flex-col gap-4">
            {article.backgroundParagraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm font-light leading-[1.9] text-[#5C7383]">
                {paragraph}
              </p>
            ))}
          </FadeInSection>
        </div>
      </section>

      {/* 活動方案／產品規格明細：GEO 要求的結構化比較表格。 */}
      <section className="border-b border-[#D4DEE2] bg-[#F6FBFC]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#0B1620]">{article.tableTitle}</h2>
          </FadeInSection>
          <FadeInSection className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr>
                  {article.tableHeaders.map((header) => (
                    <th
                      key={header}
                      className="border-b border-[#0B1620]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#0B1620]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {article.tableRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border-b border-[#0B1620]/10 px-3 py-3 align-top text-sm font-light leading-[1.8] text-[#5C7383]"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </FadeInSection>
        </div>
      </section>

      {/* 購買與參與說明 */}
      <section className="border-b border-[#D4DEE2]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h3 className="font-[family-name:var(--ep-font-serif)] text-lg font-medium text-[#0B1620]">購買與參與說明</h3>
          </FadeInSection>
          <FadeInSection className="flex flex-col gap-4">
            {article.participationParagraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm font-light leading-[1.9] text-[#5C7383]">
                {paragraph}
              </p>
            ))}
          </FadeInSection>
        </div>
      </section>

      {/* 熱門問答（AEO FAQ） */}
      {article.faq.length > 0 ? (
        <section className="border-b border-[#D4DEE2] bg-[#F6FBFC]">
          <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <FadeInSection>
              <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#0B1620]">熱門問答</h2>
            </FadeInSection>
            <FadeInSection className="flex flex-col">
              {article.faq.map((item) => (
                <div key={item.question} className="flex flex-col gap-2 border-t border-[#0B1620]/15 py-6 first:border-t-0">
                  <h3 className="font-[family-name:var(--ep-font-serif)] text-base font-medium text-[#0B1620]">
                    {item.question}
                  </h3>
                  <p className="text-sm font-light leading-[1.9] text-[#5C7383]">{item.answer}</p>
                </div>
              ))}
            </FadeInSection>
          </div>
        </section>
      ) : null}
    </main>
  );
}

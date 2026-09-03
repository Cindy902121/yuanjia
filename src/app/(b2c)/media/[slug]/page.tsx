import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildOpenGraph, canonicalFor, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { MEDIA_ITEMS } from "@/lib/content/media-items";
import { MEDIA_DETAILS, getMediaDetail } from "@/lib/content/media-detail";
import { getFaqItemById } from "@/lib/content/faq-items";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";

/**
 * /media/[slug] 頁面（2026-08-25 新增）。
 *
 * 分工說明見 src/lib/content/media-detail.ts 檔頭——這裡是「別人報導我們」
 * 裡面資訊量夠豐富、值得展開的深度版本，不是每篇 media-items.ts 的報導都有
 * 對應資料，只有 `MediaItem.slug` 有值的才會連過來。
 *
 * 結構化資料：
 * - `Article`：這頁是元家自己撰寫的深度整理／評論，不是原文轉貼，用
 *   `Article`（不是 `NewsArticle`，理由跟舊版 /news 規劃時一樣：`Article`
 *   語意上更保守準確）。
 * - `FAQPage`：文末附上跟這篇報導相關的公司問答，內容直接引用
 *   src/lib/content/faq-items.ts（`relatedFaqIds`），不在這裡重複存一份
 *   文字——同一題如果之後在 /faq 修改用詞，這裡會自動跟著更新，不會兩邊
 *   對不上。
 * - `BreadcrumbList`：Home / 媒體報導 / 這篇文章。
 */
export function generateStaticParams() {
  return MEDIA_DETAILS.map((detail) => ({ slug: detail.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/media/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = getMediaDetail(slug);
  if (!detail) {
    return { title: "找不到頁面 | 元家" };
  }

  return {
    title: detail.metaTitle,
    description: detail.metaDescription,
    alternates: canonicalFor(`/media/${slug}`),
    openGraph: buildOpenGraph({
      title: detail.metaTitle,
      description: detail.metaDescription,
      url: `/media/${slug}`,
      images: [{ url: "/products-banner.jpg", width: 1920, height: 380, alt: detail.metaTitle }],
    }),
  };
}

export default async function MediaArticlePage({ params }: PageProps<"/media/[slug]">) {
  const { slug } = await params;
  const detail = getMediaDetail(slug);
  const item = MEDIA_ITEMS.find((mediaItem) => mediaItem.slug === slug);
  if (!detail || !item) {
    notFound();
  }

  const relatedFaq = detail.relatedFaqIds
    .map((id) => getFaqItemById(id))
    .filter((faqItem): faqItem is NonNullable<typeof faqItem> => Boolean(faqItem));

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.title,
    description: detail.metaDescription,
    datePublished: item.date,
    author: { "@type": "Organization", name: "元家企業股份有限公司" },
    publisher: {
      "@type": "Organization",
      name: "元家企業股份有限公司",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/yens-logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/media/${slug}` },
  };

  const faqJsonLd =
    relatedFaq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: relatedFaq.map((faqItem) => ({
            "@type": "Question",
            name: faqItem.question,
            acceptedAnswer: { "@type": "Answer", text: faqItem.jsonLdAnswer },
          })),
        }
      : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "媒體報導", item: `${SITE_URL}/media` },
      { "@type": "ListItem", position: 3, name: item.title, item: `${SITE_URL}/media/${slug}` },
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
              <Link href="/media" className="hover:text-[#FF5A36]">
                ← ALL MEDIA
              </Link>
            </nav>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
              PRESS
            </span>
            <h1 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light leading-[1.5] tracking-[0.02em] text-[#0B1620] sm:text-3xl">
              {item.title}
            </h1>
            <div className="flex items-baseline gap-3">
              <time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">
                {item.date}
              </time>
              <span className="text-xs tracking-widest text-[#5C7383]">{item.outlet}</span>
            </div>
          </FadeInSection>

          {/* 快訊摘要／30 秒懶人包：AEO 精選摘要，故意放在文章最前面。 */}
          <FadeInSection className="flex flex-col gap-3 border-l-2 border-[#FF5A36] bg-[#F6FBFC] px-6 py-6">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">
              30 秒懶人包
            </span>
            <ul className="flex flex-col gap-2">
              {detail.summaryBullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm font-light leading-[1.8] text-[#0B1620]">
                  <span aria-hidden="true">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </FadeInSection>
        </div>
      </article>

      {/* 事件核心還原 */}
      <section className="border-b border-[#D4DEE2]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#0B1620]">事件核心還原</h2>
          </FadeInSection>
          <FadeInSection className="flex flex-col gap-4">
            {detail.eventCore.map((paragraph) => (
              <p key={paragraph} className="text-sm font-light leading-[1.9] text-[#5C7383]">
                {paragraph}
              </p>
            ))}
          </FadeInSection>
        </div>
      </section>

      {/* 背景脈絡與名詞拆解 */}
      <section className="border-b border-[#D4DEE2] bg-[#F6FBFC]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#0B1620]">背景脈絡與名詞拆解</h2>
            <p className="mt-3 text-sm font-light leading-[1.9] text-[#5C7383]">{detail.backgroundIntro}</p>
          </FadeInSection>

          <FadeInSection className="flex flex-col">
            {detail.pillars.map((pillar, index) => (
              <div key={pillar.title} className="flex flex-col gap-2 border-t border-[#0B1620]/15 py-6 sm:flex-row sm:gap-8">
                <h3 className="flex shrink-0 items-baseline gap-3 font-[family-name:var(--ep-font-serif)] text-base font-medium text-[#0B1620] sm:w-40">
                  <span className="font-[family-name:var(--ep-font-en)] text-lg font-thin text-[#FF5A36]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {pillar.title}
                </h3>
                <p className="text-sm font-light leading-[1.9] text-[#5C7383]">{pillar.description}</p>
              </div>
            ))}
          </FadeInSection>

          <FadeInSection className="flex flex-col gap-3">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383]">
              名詞解釋
            </span>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#0B1620]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#0B1620]">
                      名詞
                    </th>
                    <th className="border-b border-[#0B1620]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#0B1620]">
                      白話說明
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detail.glossary.map((glossaryItem) => (
                    <tr key={glossaryItem.term}>
                      <td className="border-b border-[#0B1620]/10 px-3 py-3 align-top text-sm font-medium text-[#0B1620]">
                        {glossaryItem.term}
                      </td>
                      <td className="border-b border-[#0B1620]/10 px-3 py-3 align-top text-sm font-light leading-[1.8] text-[#5C7383]">
                        {glossaryItem.definition}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* 產業／社會影響評估 */}
      <section className="border-b border-[#D4DEE2]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#0B1620]">產業／社會影響評估</h2>
          </FadeInSection>

          <FadeInSection className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-[#0B1620]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#0B1620]">
                    指標
                  </th>
                  <th className="border-b border-[#0B1620]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#0B1620]">
                    數據
                  </th>
                  <th className="border-b border-[#0B1620]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#0B1620]">
                    代表意義
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.impactTable.map((row) => (
                  <tr key={row.metric}>
                    <td className="border-b border-[#0B1620]/10 px-3 py-3 align-top text-sm font-medium text-[#0B1620]">
                      {row.metric}
                    </td>
                    <td className="border-b border-[#0B1620]/10 px-3 py-3 align-top text-sm font-light text-[#0B1620]">
                      {row.value}
                    </td>
                    <td className="border-b border-[#0B1620]/10 px-3 py-3 align-top text-sm font-light leading-[1.8] text-[#5C7383]">
                      {row.meaning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FadeInSection>

          <FadeInSection className="flex flex-col gap-4">
            <p className="text-sm font-light leading-[1.9] text-[#5C7383]">{detail.impactIntro}</p>
            <p className="text-sm font-light leading-[1.9] text-[#5C7383]">{detail.impactAnalysis}</p>
          </FadeInSection>
        </div>
      </section>

      {/* 專家／公眾關注重點 */}
      <section className="border-b border-[#D4DEE2] bg-[#F6FBFC]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#0B1620]">專家／公眾關注重點</h2>
          </FadeInSection>
          <FadeInSection className="flex flex-col gap-4">
            {detail.focusParagraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm font-light leading-[1.9] text-[#5C7383]">
                {paragraph}
              </p>
            ))}
          </FadeInSection>
        </div>
      </section>

      {/* 相關 FAQ：內容引用自 /faq，不在這裡重複維護文字。 */}
      {relatedFaq.length > 0 ? (
        <section className="border-b border-[#D4DEE2]">
          <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <FadeInSection className="flex flex-col gap-2">
              <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#0B1620]">相關 FAQ</h2>
              <p className="text-xs font-light text-[#5C7383]">
                以下問答同時收錄於{" "}
                <Link href="/faq" className="underline underline-offset-2 hover:text-[#FF5A36]">
                  常見問題
                </Link>
                。
              </p>
            </FadeInSection>
            <FadeInSection className="flex flex-col">
              {relatedFaq.map((faqItem) => (
                <div key={faqItem.id} className="flex flex-col gap-2 border-t border-[#0B1620]/15 py-6 first:border-t-0">
                  <h3 className="font-[family-name:var(--ep-font-serif)] text-base font-medium text-[#0B1620]">
                    {faqItem.question}
                  </h3>
                  <p className="text-sm font-light leading-[1.9] text-[#5C7383]">{faqItem.jsonLdAnswer}</p>
                </div>
              ))}
            </FadeInSection>
          </div>
        </section>
      ) : null}

      {/* 原始出處，維持可查核性。 */}
      <section>
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-1 px-5 py-12 sm:px-8 lg:px-10">
          <p className="text-xs font-light text-[#5C7383]">
            資料來源：{item.outlet}，{item.date}
          </p>
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="w-fit text-xs font-light text-[#5C7383] underline underline-offset-2 hover:text-[#FF5A36]"
          >
            查看原始報導 →
          </a>
        </div>
      </section>
    </main>
  );
}

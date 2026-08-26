import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildOpenGraph, canonicalFor, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { NEWS_ARTICLES, getNewsArticle } from "@/lib/content/news-items";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";

/**
 * /news/[slug] 頁面（2026-08-25 新增）。內容產製守則、資料結構說明見
 * src/lib/content/news-items.ts 檔頭說明，這裡只負責畫面。
 *
 * 結構化資料掛 3 種：
 * - `Article`：這篇是元家自己撰寫、掛在自己網域下的原創編輯內容（根據公開
 *   報導的真實事實改寫、加深加廣背景與 FAQ），不是單純轉貼——跟 /media 刻意
 *   不掛 NewsArticle 的理由相反，這裡用 `Article`（不是 `NewsArticle`，
 *   `NewsArticle` 語意上更接近第一手新聞編輯室報導，我們是根據公開報導做
 *   的深度整理與評論，`Article` 是比較準確、保守的類型）。
 * - `FAQPage`：對應頁面下方的「精選 FAQ」區塊，跟 /faq 用同一套語意，AEO
 *   要求的「答案引擎可直接抓取」關鍵在這裡。
 * - `BreadcrumbList`：跟商品詳情頁同一套 Home / 分類 / 該頁的慣例。
 *
 * 目前只有 1 篇文章，`generateStaticParams` 用 NEWS_ARTICLES 產生，之後新增
 * 文章不用改這個檔案。
 */
export function generateStaticParams() {
  return NEWS_ARTICLES.map((article) => ({ slug: article.slug }));
}

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
    publisher: { "@type": "Organization", name: "元家企業股份有限公司", logo: { "@type": "ImageObject", url: `${SITE_URL}/yens-logo.png` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/news/${slug}` },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

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
    <main className="flex flex-1 flex-col bg-[#FAF9F6] font-[family-name:var(--ep-font-sans)] text-[#2B2B2B]">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <EditorialStyles />

      <article className="border-b border-[#e5e2da]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <FadeInSection className="flex flex-col gap-4">
            <nav aria-label="breadcrumb" className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
              <Link href="/news" className="hover:text-[#3E5C6B]">
                ← ALL NEWS
              </Link>
            </nav>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">
              NEWS
            </span>
            <h1 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light leading-[1.5] tracking-[0.02em] text-[#2b2b2b] sm:text-3xl">
              {article.title}
            </h1>
            <time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
              {article.publishDate}
            </time>
          </FadeInSection>

          {/* 快訊摘要／30 秒懶人包：AEO 精選摘要，故意放在文章最前面。 */}
          <FadeInSection className="flex flex-col gap-3 border-l-2 border-[#3E5C6B] bg-[#F3F1EB] px-6 py-6">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
              30 秒懶人包
            </span>
            <ul className="flex flex-col gap-2">
              {article.summaryBullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm font-light leading-[1.8] text-[#2b2b2b]">
                  <span aria-hidden="true">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </FadeInSection>
        </div>
      </article>

      {/* 事件核心還原 */}
      <section className="border-b border-[#e5e2da]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#2b2b2b]">事件核心還原</h2>
          </FadeInSection>
          <FadeInSection className="flex flex-col gap-4">
            {article.eventCore.map((paragraph) => (
              <p key={paragraph} className="text-sm font-light leading-[1.9] text-[#4a4a4a]">
                {paragraph}
              </p>
            ))}
          </FadeInSection>
        </div>
      </section>

      {/* 背景脈絡與名詞拆解 */}
      <section className="border-b border-[#e5e2da] bg-[#F3F1EB]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#2b2b2b]">背景脈絡與名詞拆解</h2>
            <p className="mt-3 text-sm font-light leading-[1.9] text-[#4a4a4a]">{article.backgroundIntro}</p>
          </FadeInSection>

          <FadeInSection className="flex flex-col">
            {article.pillars.map((pillar, index) => (
              <div key={pillar.title} className="flex flex-col gap-2 border-t border-[#2b2b2b]/15 py-6 sm:flex-row sm:gap-8">
                <h3 className="flex shrink-0 items-baseline gap-3 font-[family-name:var(--ep-font-serif)] text-base font-medium text-[#2b2b2b] sm:w-40">
                  <span className="font-[family-name:var(--ep-font-en)] text-lg font-thin text-[#3E5C6B]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {pillar.title}
                </h3>
                <p className="text-sm font-light leading-[1.9] text-[#4a4a4a]">{pillar.description}</p>
              </div>
            ))}
          </FadeInSection>

          <FadeInSection className="flex flex-col gap-3">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
              名詞解釋
            </span>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#2b2b2b]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#2b2b2b]">
                      名詞
                    </th>
                    <th className="border-b border-[#2b2b2b]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#2b2b2b]">
                      白話說明
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {article.glossary.map((item) => (
                    <tr key={item.term}>
                      <td className="border-b border-[#2b2b2b]/10 px-3 py-3 align-top text-sm font-medium text-[#2b2b2b]">
                        {item.term}
                      </td>
                      <td className="border-b border-[#2b2b2b]/10 px-3 py-3 align-top text-sm font-light leading-[1.8] text-[#4a4a4a]">
                        {item.definition}
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
      <section className="border-b border-[#e5e2da]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#2b2b2b]">產業／社會影響評估</h2>
          </FadeInSection>

          <FadeInSection className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-[#2b2b2b]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#2b2b2b]">
                    指標
                  </th>
                  <th className="border-b border-[#2b2b2b]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#2b2b2b]">
                    數據
                  </th>
                  <th className="border-b border-[#2b2b2b]/30 px-3 py-2 text-left font-[family-name:var(--ep-font-serif)] font-medium text-[#2b2b2b]">
                    代表意義
                  </th>
                </tr>
              </thead>
              <tbody>
                {article.impactTable.map((row) => (
                  <tr key={row.metric}>
                    <td className="border-b border-[#2b2b2b]/10 px-3 py-3 align-top text-sm font-medium text-[#2b2b2b]">
                      {row.metric}
                    </td>
                    <td className="border-b border-[#2b2b2b]/10 px-3 py-3 align-top text-sm font-light text-[#2b2b2b]">
                      {row.value}
                    </td>
                    <td className="border-b border-[#2b2b2b]/10 px-3 py-3 align-top text-sm font-light leading-[1.8] text-[#4a4a4a]">
                      {row.meaning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FadeInSection>

          <FadeInSection className="flex flex-col gap-4">
            <p className="text-sm font-light leading-[1.9] text-[#4a4a4a]">{article.impactIntro}</p>
            <p className="text-sm font-light leading-[1.9] text-[#4a4a4a]">{article.impactAnalysis}</p>
          </FadeInSection>
        </div>
      </section>

      {/* 專家／公眾關注重點 */}
      <section className="border-b border-[#e5e2da] bg-[#F3F1EB]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#2b2b2b]">專家／公眾關注重點</h2>
          </FadeInSection>
          <FadeInSection className="flex flex-col gap-4">
            {article.focusParagraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm font-light leading-[1.9] text-[#4a4a4a]">
                {paragraph}
              </p>
            ))}
          </FadeInSection>
        </div>
      </section>

      {/* 精選 FAQ */}
      <section className="border-b border-[#e5e2da]">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <FadeInSection>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-xl font-medium text-[#2b2b2b]">精選 FAQ</h2>
          </FadeInSection>
          <FadeInSection className="flex flex-col">
            {article.faq.map((item) => (
              <div key={item.question} className="flex flex-col gap-2 border-t border-[#2b2b2b]/15 py-6 first:border-t-0">
                <h3 className="font-[family-name:var(--ep-font-serif)] text-base font-medium text-[#2b2b2b]">
                  {item.question}
                </h3>
                <p className="text-sm font-light leading-[1.9] text-[#4a4a4a]">{item.answer}</p>
              </div>
            ))}
          </FadeInSection>
        </div>
      </section>

      {/* 原始出處，維持可查核性。 */}
      <section>
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-1 px-5 py-12 sm:px-8 lg:px-10">
          <p className="text-xs font-light text-[#8a8a8a]">
            資料來源：{article.sourceOutlet}
            {article.sourceAuthor ? `，${article.sourceAuthor}` : ""}，{article.sourceDate}
          </p>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="w-fit text-xs font-light text-[#8a8a8a] underline underline-offset-2 hover:text-[#3E5C6B]"
          >
            查看原始報導 →
          </a>
        </div>
      </section>
    </main>
  );
}

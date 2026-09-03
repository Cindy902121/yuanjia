import type { Metadata } from "next";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { FAQ_ITEMS, type FaqAnswerBlock } from "@/lib/content/faq-items";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";

const TITLE = "常見問題 | 元家";
const DESCRIPTION = "海鮮保存、解凍、蝦子產地、食用注意事項、包冰率、退換貨、食品安全等常見問題整理。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonicalFor("/faq"),
  openGraph: buildOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    url: "/faq",
    images: [{ url: "/products-banner.jpg", width: 1920, height: 380, alt: "元家常見問題" }],
  }),
};

/**
 * /faq 頁面。內容合併規則見 src/lib/content/faq-items.ts 檔頭說明，這裡只負責
 * 畫面。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，正式取代舊版左右兩欄卡片
 * 版面，改成數字編號＋細線表格（拿掉粗框），標題用襯線字。`renderBlock()` 是
 * 這個頁面自己的「區塊 → 畫面」轉換邏輯。
 */
function renderBlock(block: FaqAnswerBlock, key: number) {
  if (block.type === "paragraph") {
    return (
      <p key={key} className="text-sm font-light leading-[1.9] text-[#5C7383]">
        {block.text}
      </p>
    );
  }

  if (block.type === "note") {
    return (
      <p key={key} className="text-xs font-light leading-[1.8] text-[#5C7383]">
        {block.text}
      </p>
    );
  }

  return (
    <div key={key} className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr>
            {block.headers.map((header) => (
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
          {block.rows.map((row, rowIndex) => (
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
    </div>
  );
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.jsonLdAnswer },
  })),
};

export default function FaqPage() {
  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <JsonLd data={faqJsonLd} />
      <EditorialStyles />

      <section className="border-b border-[#D4DEE2]">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <FadeInSection>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
              FAQ
            </span>
            <h1 className="mt-3 font-[family-name:var(--ep-font-serif)] text-3xl font-light tracking-[0.05em] text-[#0B1620] sm:text-4xl">
              常見問題
            </h1>
            <p className="mt-4 max-w-xl text-sm font-light leading-[1.9] text-[#5C7383]">
              本網站目前為 MVP 展示版本，實際下單、客服與退換貨服務請以正式上線後的公告為準。
            </p>
          </FadeInSection>
        </div>
      </section>

      <section>
        <div className="mx-auto flex w-full max-w-[1100px] flex-col px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          {FAQ_ITEMS.map((item, index) => (
            <FadeInSection key={item.question}>
              <div className="grid grid-cols-1 gap-6 border-t border-[#0B1620]/15 py-12 lg:grid-cols-[220px_1fr] lg:gap-16">
                <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
                  <span className="font-[family-name:var(--ep-font-en)] text-2xl font-thin text-[#FF5A36]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-[family-name:var(--ep-font-serif)] text-lg leading-[1.6] text-[#0B1620]">
                    {item.question}
                  </h2>
                  {item.subQuestions ? (
                    <ul className="flex flex-col gap-1 text-xs font-light text-[#5C7383]">
                      {item.subQuestions.map((sub) => (
                        <li key={sub}>・{sub}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="flex flex-col gap-4">{item.answer.map((block, blockIndex) => renderBlock(block, blockIndex))}</div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>
    </main>
  );
}

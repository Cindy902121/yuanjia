import Image from "next/image";
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
    images: [{ url: "/brand/cold-storage.jpg", width: 600, height: 382, alt: "元家品保實驗室檢測作業" }],
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
      <p key={key} className="text-sm font-light leading-[1.9] text-[#536168]">
        {block.text}
      </p>
    );
  }

  if (block.type === "note") {
    return (
      <p key={key} className="text-xs font-light leading-[1.8] text-[#536168]">
        {block.text}
      </p>
    );
  }

  return (
    <div key={key} className="overflow-x-auto" role="region" aria-label="對照表格，可左右捲動" tabIndex={0}>
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
                  className="border-b border-[#0B1620]/10 px-3 py-3 align-top text-sm font-light leading-[1.8] text-[#536168]"
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

      {/* Header banner：元家品保實驗室檢測照（public/brand/cold-storage.jpg，
          來源 yens.com.tw，真實照片、無烙印文字），跟 /products 既有的
          「滿版照片＋深色漸層＋白字」Hero 手法一致——漸層由下往上加深，
          文字區塊落在最暗的底部，確保標題在任何照片內容上都清晰可讀，
          不會跟照片細節打架。 */}
      <section className="relative flex min-h-[240px] items-end overflow-hidden border-b border-[#D4DEE2] lg:min-h-[320px]">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/brand/cold-storage.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ filter: "saturate(0.85)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" />
        </div>
        <FadeInSection className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-5 pb-12 pt-20 sm:px-8 lg:px-10 lg:pb-16">
          <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-white/85">
            FAQ
          </span>
          <h1 className="font-[family-name:var(--ep-font-serif)] text-3xl font-light tracking-[0.05em] text-white sm:text-4xl">
            常見問題
          </h1>
          <p className="max-w-xl text-sm font-light leading-[1.9] text-white/80">
            本網站目前為 MVP 展示版本，實際下單、客服與退換貨服務請以正式上線後的公告為準。
          </p>
        </FadeInSection>
      </section>

      <section>
        <div className="mx-auto flex w-full max-w-[1100px] flex-col px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          {FAQ_ITEMS.map((item, index) => (
            <FadeInSection key={item.question}>
              <div className="grid grid-cols-1 gap-6 border-t border-[#0B1620]/15 py-12 lg:grid-cols-[220px_1fr] lg:gap-16">
                <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
                  <span className="font-[family-name:var(--ep-font-en)] text-2xl font-thin text-[#C2401D]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-[family-name:var(--ep-font-serif)] text-lg leading-[1.6] text-[#0B1620]">
                    {item.question}
                  </h2>
                  {item.subQuestions ? (
                    <ul className="flex flex-col gap-1 text-xs font-light text-[#536168]">
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

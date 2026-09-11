import Image from "next/image";
import { ScallopLineArt } from "@/app/(b2c)/_ocean/marine-line-art";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import type { strengthsContent } from "./about-content";

/**
 * 企業優勢——4 項優勢刻意用 4 種不同構圖呈現，不是同一個 Template 重複
 * 四次。文字內容全部從 `about-content.ts` 的 `strengthsContent` 傳進來，
 * 這裡只負責版面。原型先在 `/about-preview` 做過完整設計與驗證，這次正式
 * 移入 `(b2c)/about/`，內容與排版邏輯沒有變動。
 *
 * 數字強調（20+ 位品保人員、24hr、-20°C）都是直接從真實描述文字裡摘出來
 * 的既有事實，不是另外生成的數據。
 */
export function AboutStrengths({ items }: { items: (typeof strengthsContent)["items"] }) {
  const [sourcing, production, safety, logistics] = items;

  return (
    <div className="flex flex-col gap-24 lg:gap-32">
      {/* 01 國際採購：Typography-driven，大數字＋標題＋描述，極淡海流線稿背景，不放照片。 */}
      <FadeInSection className="relative overflow-hidden">
        <ScallopLineArt
          tone="light"
          opacity={0.07}
          className="right-[8%] top-0 hidden h-[220px] w-[340px] lg:block"
        />
        <div className="relative flex flex-col gap-6 lg:max-w-xl">
          <span className="font-[family-name:var(--ep-font-en)] text-5xl font-thin text-[#C2401D] sm:text-6xl">
            {String(sourcing.index).padStart(2, "0")}
          </span>
          <h3 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#0B1620] sm:text-3xl">
            {sourcing.title}
          </h3>
          <p className="text-base font-light leading-[1.9] text-[#536168]">{sourcing.description}</p>
        </div>
      </FadeInSection>

      {/* 02 研發生產：Large Photography 為主，文字疊在小留白區，不是對稱左右分欄。 */}
      <FadeInSection className="relative">
        <div className="relative aspect-[16/9] w-full overflow-hidden lg:aspect-[21/9]">
          <Image
            src="/brand/production-facility.jpg"
            alt="元家高雄冷凍食品加工廠"
            fill
            sizes="100vw"
            className="object-cover"
            style={{ filter: "saturate(0.75) contrast(0.92) brightness(1.02)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1620]/70 via-[#0B1620]/10 to-transparent" />
        </div>
        <div className="relative -mt-16 ml-5 max-w-md bg-[#EAF4F8] p-6 sm:ml-8 sm:p-8 lg:ml-10">
          <span className="font-[family-name:var(--ep-font-en)] text-4xl font-thin text-[#C2401D]">
            {String(production.index).padStart(2, "0")}
          </span>
          <h3 className="mt-3 font-[family-name:var(--ep-font-serif)] text-xl font-light tracking-[0.03em] text-[#0B1620] sm:text-2xl">
            {production.title}
          </h3>
          <p className="mt-3 text-base font-light leading-[1.8] text-[#536168]">{production.description}</p>
        </div>
      </FadeInSection>

      {/* 03 食品安全：Editorial card + Data highlight 混合。 */}
      <FadeInSection className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-16">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src="/brand/quality-team.jpg"
            alt="元家品質檢測實驗室，品保人員進行檢測作業"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
            style={{ filter: "saturate(0.8) contrast(0.94)" }}
          />
        </div>
        <div className="flex flex-col gap-5">
          <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
            0{safety.index} · {safety.title.toUpperCase()}
          </span>
          <div className="flex items-baseline gap-3">
            <span className="font-[family-name:var(--ep-font-en)] text-5xl font-thin text-[#C2401D]">20+</span>
            <span className="text-base font-light text-[#536168]">位專職品保人員</span>
          </div>
          <p className="max-w-md text-base font-light leading-[1.9] text-[#536168]">{safety.description}</p>
        </div>
      </FadeInSection>

      {/* 04 倉儲物流：Data-driven，具體數字用大 Typography 呈現為主視覺，不放照片。 */}
      <FadeInSection className="border-t border-[#0B1620]/15 pt-16">
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
          0{logistics.index} · {logistics.title.toUpperCase()}
        </span>
        <div className="mt-6 flex flex-col gap-10 sm:flex-row sm:items-end sm:gap-16">
          <div className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--ep-font-en)] text-6xl font-thin text-[#0B1620] sm:text-7xl">-20°C</span>
            <span className="text-base font-light text-[#536168]">以下全年溫控</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--ep-font-en)] text-6xl font-thin text-[#0B1620] sm:text-7xl">24hr</span>
            <span className="text-base font-light text-[#536168]">監控管理</span>
          </div>
        </div>
        <p className="mt-8 max-w-xl text-base font-light leading-[1.9] text-[#536168]">{logistics.description}</p>
      </FadeInSection>
    </div>
  );
}

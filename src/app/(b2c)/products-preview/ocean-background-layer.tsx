"use client";

import { useEffect, useRef } from "react";
import { CrabLineArt, ScallopLineArt } from "@/app/(b2c)/_ocean/marine-line-art";

/**
 * 商品列表 Preview 的「安靜海洋」背景層——2026-09-12 使用者要求「比首頁安靜，
 * 但不是靜止」：不換掉 Product Listing Page 現有的 Pale Ice Blue 底色，只在
 * 上面疊一層極低存在感的裝飾，不能干擾商品辨識度與閱讀性。
 *
 * 三個 Marine Graphic Visual Anchor（不是撒滿版的小 icon）：
 * - CrabLineArt：右上角，裁到 viewport 邊界外一部分
 * - ScallopLineArt：左下角，同樣裁邊
 * - 一條大型抽象海流線（下面 `CurrentLine`，這個 Preview 專屬畫的，沒有動
 *   `_ocean/marine-line-art.tsx` 既有的兩個匯出，避免影響其他正式頁面）：
 *   橫跨版面中段，暗示水流方向
 * 三者 opacity 壓在 3%–5%，比首頁任何一處線稿都更淡——這裡是「有東西在動」
 * 而不是「首頁那種明顯的海洋敘事」。
 *
 * 兩個「水下光感」：極大、極淡的 radial-gradient（transparent → 極淡冰白 →
 * transparent），刻意不用飽和藍／青色，不做玻璃感／明顯光暈，使用者第一眼
 * 不該直接注意到它們，只是背景比純色更有層次。
 *
 * 分類浮水印（`activeCategoryLabel`）：只在使用者剛好單選一個分類時出現，
 * 大型、極淡的英文 Typography，放在版面右側留白區，不會疊在商品卡片主要
 * 內容範圍內；多選或未選分類時完全不顯示，不需要每個 Filter 都做出不同
 * 動畫。
 *
 * Desktop-only 極輕微 Parallax：rAF 節流的 scroll 監聽（跟
 * `_ocean/scroll-fish.tsx`、`about-timeline.tsx` 同一種既有寫法，不是新
 * 引入函式庫），viewport ≥1024px 且非 `prefers-reduced-motion: reduce` 才
 * 啟用，位移幅度封頂在幾十 px 內，不影響 scroll 效能；SSR／未啟用時完全
 * 靜止，不是「先跑再停」。
 */
export function OceanBackgroundLayer({ activeCategoryLabel }: { activeCategoryLabel: string | null }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const widthQuery = window.matchMedia("(min-width: 1024px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let ticking = false;
    let baseOffset = 0;

    function measure() {
      baseOffset = layer!.getBoundingClientRect().top + window.scrollY;
    }

    function applyParallax() {
      ticking = false;
      if (!widthQuery.matches || motionQuery.matches) {
        layer!.style.transform = "";
        return;
      }
      const relative = window.scrollY - baseOffset;
      const offset = Math.max(-24, Math.min(24, relative * 0.04));
      layer!.style.transform = `translateY(${offset.toFixed(1)}px)`;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(applyParallax);
    }

    function onResize() {
      measure();
      applyParallax();
    }

    measure();
    applyParallax();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    widthQuery.addEventListener("change", onResize);
    motionQuery.addEventListener("change", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      widthQuery.removeEventListener("change", onResize);
      motionQuery.removeEventListener("change", onResize);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div ref={layerRef} className="absolute inset-0 will-change-transform">
        {/* 水下光感：兩個大型 radial gradient，transparent → 白 → transparent。
            2026-09-12（使用者回饋「完全看不出來有變化」）：第一版用
            `rgba(247,251,252,…)`（接近純白的冰白）疊在 `#EAF4F8`（也接近
            純白的淺藍）背景上——兩個顏色本身太接近，就算 alpha 疊到 50%
            實際視覺差異也趨近於零，不是「調得不夠淡」，是顏色本身選錯、
            天生就疊不出對比。這裡改用真正的純白 `rgba(255,255,255,…)`
            （跟背景色有實際亮度差），alpha 也調高一階，才會是「看得到、
            但看起來很輕」，不是「看不到」。 */}
        <div
          className="absolute -right-[10%] -top-[10%] h-[60vw] w-[60vw] max-h-[720px] max-w-[720px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 68%)" }}
        />
        <div
          className="absolute -left-[15%] top-[55%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 68%)" }}
        />

        {/* Marine Graphic Visual Anchor：同一個回饋，opacity 同步調高（約
            2 倍），同時把桌機以下的隱藏門檻從 md（768px）放寬到直接顯示
            （只在真的很窄的手機隱藏），確保使用者在一般筆電寬度就看得到，
            不是只有很寬的桌機才顯示。 */}
        <CrabLineArt
          tone="light"
          opacity={0.09}
          className="right-[-6%] top-[4%] hidden h-[380px] w-[560px] sm:block"
        />
        <ScallopLineArt
          tone="light"
          opacity={0.08}
          className="bottom-[6%] left-[-8%] hidden h-[320px] w-[480px] sm:block"
        />
        <CurrentLine className="left-[-5%] top-[42%] hidden w-[110%] md:block" />

        {activeCategoryLabel ? (
          <span
            aria-hidden="true"
            className="absolute right-[2%] top-[38%] hidden select-none whitespace-nowrap font-[family-name:var(--ep-font-en)] text-[18vw] font-thin leading-none tracking-tight text-[#0B1620] opacity-[0.05] md:block"
          >
            {activeCategoryLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** 抽象海流線——單純一條大型 S 型細線，暗示水流方向，不是任何生物輪廓。 */
function CurrentLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 300" className={`absolute ${className}`} style={{ opacity: 0.1 }} aria-hidden="true">
      <path
        d="M-50 180 C 200 60, 400 260, 650 140 S 1100 40, 1350 160 S 1650 220, 1700 120"
        fill="none"
        stroke="#0B1620"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 常見水產分類的英文對照——查不到的分類直接顯示原本的中文名稱，不強行翻譯。 */
const CATEGORY_EN_LABEL: Record<string, string> = {
  魚類: "FISH",
  蝦類: "SHRIMP",
  貝類: "SHELLFISH",
  頭足類: "CEPHALOPOD",
  小卷類: "SQUID",
  花枝類: "CUTTLEFISH",
  調理食品: "PREPARED",
  加工食品: "PROCESSED",
};

export function categoryWatermarkLabel(selectedCategorySlugs: string[], categories: { slug: string; name: string }[]) {
  if (selectedCategorySlugs.length !== 1) {
    return null;
  }
  const category = categories.find((item) => item.slug === selectedCategorySlugs[0]);
  if (!category) {
    return null;
  }
  return CATEGORY_EN_LABEL[category.name] ?? category.name;
}

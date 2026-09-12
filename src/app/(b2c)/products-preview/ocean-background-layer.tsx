"use client";

import { useEffect, useRef } from "react";
import { CrabLineArt, ScallopLineArt } from "@/app/(b2c)/_ocean/marine-line-art";

/**
 * 商品列表 Preview 的「安靜海洋」背景層——2026-09-12 使用者要求「比首頁安靜，
 * 但不是靜止」：不換掉 Product Listing Page 現有的 Pale Ice Blue 底色，只在
 * 上面疊一層裝飾，不能干擾商品辨識度與閱讀性，但也不能淡到「打開 DevTools
 * 才確認得到它存在」（第二輪使用者回饋，見下方 2026-09-12 Debug 說明）。
 *
 * 三個 Marine Graphic Visual Anchor（不是撒滿版的小 icon）：
 * - CrabLineArt：右上角，裁到 viewport 邊界外一部分，約 viewport 寬度 26–32%
 * - ScallopLineArt：左下角，同樣裁邊，約 viewport 寬度 16–22%
 * - 一條大型抽象海流線（下面 `CurrentLine`，這個 Preview 專屬畫的，沒有動
 *   `_ocean/marine-line-art.tsx` 既有的兩個匯出，避免影響其他正式頁面）：
 *   橫跨版面中段約 70vw，暗示水流方向
 *
 * 兩個「水下光感」：大型、柔邊的白色 radial-gradient，刻意不用飽和藍／青色、
 * 不做玻璃感／明顯光暈。
 *
 * 分類浮水印（`activeCategoryLabel`）：只在使用者剛好單選一個分類時出現，
 * 大型 Typography（`clamp(80px, 10vw, 180px)`），落在背景層右側、頁面實際
 * 內容欄外側的留白區；多選或未選分類時完全不顯示，不需要每個 Filter 都做出
 * 不同動畫。
 *
 * Desktop-only 極輕微 Parallax：rAF 節流的 scroll 監聽（跟
 * `_ocean/scroll-fish.tsx`、`about-timeline.tsx` 同一種既有寫法，不是新
 * 引入函式庫），viewport ≥1024px 且非 `prefers-reduced-motion: reduce` 才
 * 啟用，位移幅度封頂在幾十 px 內，不影響 scroll 效能；SSR／未啟用時完全
 * 靜止，不是「先跑再停」。
 *
 * 2026-09-12（Visual Visibility Debug，使用者第二輪回饋「重新整理後幾乎
 * 完全看不到」，要求先排除 rendering／layering 問題再調數值）：實際用
 * `getBoundingClientRect()`／`getComputedStyle()` 逐一檢查每個節點後confirm
 * 兩個真正病灶，都不是「opacity 不夠低」：
 * 1. 這個背景層原本掛在 `OceanProductList` 內層被 `max-w-[1200px]` 限制
 *    寬度的 flex row 底下，`absolute inset-0` 只會撐滿那個 1200px 內容欄，
 *    1920px 螢幕上背景層實際只有約 1120px 寬、置中在頁面中段——不是「鋪滿
 *    整個頁面背景」，Crab／Current Line 這種設計成大範圍延伸的元素因此被
 *    硬生生截斷在一個窄欄裡，怎麼調 opacity 都不會變成「大範圍背景圖」。
 *    這裡改用「掙脫父層寬度限制、水平鋪滿整個 viewport」的標準手法
 *    （`left-1/2 w-screen -translate-x-1/2`），垂直方向仍然用 `inset-y-0`
 *    貼齊父層（商品列表區塊本身的高度，不會延伸到 Banner 或 Footer）。
 * 2. `CrabLineArt`／`ScallopLineArt` 預設 `tone="light"` 固定用 Mist
 *    `#536168`，這個顏色跟 Pale Ice Blue 背景色的亮度差本來就偏小（實際
 *    換算：即使 100% 不透明疊上去，RGB 差距也只有背景的個位數百分比）。
 *    改用新增的 `strokeColor` override（見 `marine-line-art.tsx`，純新增
 *    選填 prop，首頁既有呼叫端沒有傳、視覺不受影響）指定更深一階的藍灰色
 *    `#2E4A56`，同樣的低 opacity 下才會有肉眼可辨的對比，不是無止盡調高
 *    透明度硬湊。
 * 這兩個問題修正之後，才把 opacity／stroke-width 落回使用者這輪給的目標
 * 範圍（10%–16%、1.6–2.5px，依各元素大小微調），不是繼續往上硬調數字。
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
    /**
     * 2026-09-12（Visual Visibility Debug，使用者第二輪回饋「重新整理後
     * 幾乎完全看不到」）：實際用 DevTools 等級的檢查（`getBoundingClientRect`
     * ／`getComputedStyle` 逐一查每個節點）確認過，真正的病灶**不是**
     * opacity 數值本身，是這個背景層原本掛在 `OceanProductList` 內層那個
     * 被 `max-w-[1200px]` 限制寬度的 flex row 底下——`absolute inset-0`
     * 只會撐滿「那個 1200px 內容欄」，在 1920px 螢幕上兩側各留約 360px
     * 空白，背景層本身只有約 1120px 寬，完全不是「鋪滿整個頁面背景」，
     * Crab／Current Line 這種原本設計要大範圍延伸、允許超出 viewport 的
     * 元素因此被硬生生截斷在一個窄欄裡。
     *
     * 這裡改用經典的「掙脫父層寬度限制、水平方向鋪滿整個 viewport」手法
     * （`left-1/2 w-screen -translate-x-1/2`，垂直方向仍然用 `inset-y-0`
     * 貼齊父層——也就是貼齊商品列表區塊的實際高度，不會延伸到 Banner
     * 或 Footer）：背景層現在是真正的「整頁背景」，不是「內容欄背景」。
     *
     * 顏色也一併換掉：`CrabLineArt`／`ScallopLineArt` 預設的 `tone="light"`
     * 固定用 Mist `#536168`，這個顏色本身跟 Pale Ice Blue 背景色差就偏小
     * （換算色差只有背景亮度的個位數百分比），這裡改用新增的 `strokeColor`
     * override（見 `marine-line-art.tsx`），指定比 Mist 更深一階、飽和度
     * 也稍微高一點的藍灰色，在同樣的低 opacity 下才會有實際可辨識的對比，
     * 不是無止盡調高透明度去硬湊。
     */
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden">
      <div ref={layerRef} className="absolute inset-0 will-change-transform">
        {/* 水下光感：2 個大型、柔邊 radial gradient，transparent → 白 →
            transparent。用真正的白色（不是接近背景色的冰白）才會跟 Pale
            Ice Blue 背景形成看得出來的亮度差；70% 處收尾製造柔邊羽化，不是
            銳利圓形色塊。 */}
        <div
          className="absolute -right-[5%] -top-[8%] h-[640px] w-[640px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)" }}
        />
        <div
          className="absolute -left-[8%] top-[50%] h-[560px] w-[560px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)" }}
        />
        <div
          className="absolute left-[38%] top-[12%] h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)" }}
        />

        {/* Marine Graphic Visual Anchor：尺寸改用 vw（相對整個 viewport，
            不是相對內容欄）——Crab 約 30vw、Scallop 約 20vw，符合「桌機上
            應為 oversized background graphic」的要求，允許部分超出
            viewport（right/left 用負值百分比裁邊）。
            2026-09-12（同一輪 Debug 追加發現）：內容欄本身 `max-w-[1200px]`，
            兩側真正空白的「留白邊界」要 viewport 寬度明顯大於 1200px 才會
            出現（例如 1920px 時兩側各約 360px 空白；但 768–1279px 這段
            內容欄幾乎頂滿整個畫面寬度，這幾個大尺寸背景圖形不管怎麼調
            opacity，都會直接被商品卡片內容蓋住，肉眼看起來就是「沒有效果」
            ——這不是顏色或透明度能解的，是「這個寬度下根本沒有留白可以
            放」。原本用 `sm:block`（640px）／`md:block`（768px）顯示，
            剛好落在「留白還沒出現」的區間，這裡統一改成 `xl:block`
            （1280px）以上才顯示——1280px 起兩側已經有基本留白，越寬留白
            越多，這幾個裝飾也會越完整地落在留白區，不會被商品格擋住。 */}
        <CrabLineArt
          tone="light"
          strokeColor="#2E4A56"
          strokeWidth={2}
          opacity={0.14}
          className="right-[-2%] top-[6%] hidden h-[26vw] w-[32vw] max-h-[460px] max-w-[620px] min-h-[280px] min-w-[420px] xl:block"
        />
        <ScallopLineArt
          tone="light"
          strokeColor="#2E4A56"
          strokeWidth={1.6}
          opacity={0.13}
          className="bottom-[8%] left-[-4%] hidden h-[16vw] w-[22vw] max-h-[320px] max-w-[440px] min-h-[200px] min-w-[300px] xl:block"
        />
        <CurrentLine className="left-[-8%] top-[40%] hidden w-[70vw] xl:block" />

        {activeCategoryLabel ? (
          <span
            aria-hidden="true"
            className="absolute right-[1%] top-[35%] hidden select-none whitespace-nowrap font-[family-name:var(--ep-font-en)] font-thin leading-none tracking-tight text-[#0B1620] opacity-[0.07] xl:block"
            style={{ fontSize: "clamp(80px, 10vw, 180px)" }}
          >
            {activeCategoryLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** 抽象海流線——單純一條大型 S 型細線，暗示水流方向，不是任何生物輪廓。
 *  2026-09-12：stroke 顏色跟寬度同步比照上面 Crab／Scallop 的除錯結論調整。 */
function CurrentLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 300" className={`absolute ${className}`} style={{ opacity: 0.14 }} aria-hidden="true">
      <path
        d="M-50 180 C 200 60, 400 260, 650 140 S 1100 40, 1350 160 S 1650 220, 1700 120"
        fill="none"
        stroke="#2E4A56"
        strokeWidth="2.5"
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

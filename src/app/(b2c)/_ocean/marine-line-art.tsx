/**
 * 首頁背景線稿裝飾。跟品牌故事區既有的 `OceanLineArt`（見 ocean-line-art.tsx，
 * 抽象洋流／等高線）同一套語言：single path、無填色、細線條、允許超出容器
 * 邊界，刻意不畫眼睛／不畫細節紋理，維持「背景紋理，第二眼才看出是什麼」的
 * 抽象感，不是可愛插畫或 icon。
 *
 * 2026-09：原為 `/about-preview` 專用元件，Ocean Motion 視覺設計五輪確認
 * 核准後原封不動搬進 `_ocean/` 給正式首頁使用，內容／參數沒有變動。
 *
 * 全站只用三種、放在三個不同 Section（使用者明確要求「整個首頁最多 3–4
 * 組 Marine Line Art，不要變成滿版 pattern」）：
 * - `CrabLineArt`：企業優勢 Section 的**主要視覺元素**（見下方 2026-09
 *   修正說明）。
 * - `ScallopLineArt`：收尾引言 Section，非常低調的扇貝造型，尺寸小很多。
 * - 品牌故事的抽象洋流線稿在 ocean-line-art.tsx，不在這個檔案。
 *
 * 2026-09（使用者要求「企業優勢移除多張商品照片 Collage，改以 Typography
 * ＋大型螃蟹線稿為主」，並且「螃蟹請實際畫出來、不要只是簡化的對稱圖形，
 * 要有 organic hand-drawn 的感覺」——重畫 `CrabLineArt` 的 path，`tone`／
 * `opacity` 機制不變）：
 * 舊版的螃蟹是完全鏡射對稱（兩隻螯一樣大、四隻腳角度規律），看起來比較像
 * 工整的 icon，不是「手繪線稿」。這次重畫：
 * - 兩隻螯特意做成不同大小（右螯較大、多一段彎折），真實螃蟹本來就常見
 *   兩螯不對稱，這個不對稱同時也是「hand-drawn」感的主要來源。
 * - 八隻腳（左右各四）都改成兩段式（一個彎折點，模擬關節），角度跟間距
 *   刻意不規律排列，不是等距鏡射。
 * - viewBox 放大到 400×260（原本 240×160），讓整體比例更舒展，也讓下面
 *   page.tsx 可以把它做得更大、允許 60–75% 落在 viewport 內、其餘超出
 *   畫面邊界（使用者原話：「遠看是抽象線條，仔細看才發現是一隻螃蟹」）。
 */

const TONE_STROKE = {
  light: "#5C7383", // slate／ocean blue，呼應淺色背景
  dark: "#EAF4F8", // 冰藍／近白，呼應深色背景
} as const;

type LineArtProps = {
  tone?: keyof typeof TONE_STROKE;
  className?: string;
  opacity?: number;
};

export function CrabLineArt({ tone = "light", className = "", opacity = 0.12 }: LineArtProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 260"
      style={{ opacity }}
      className={`pointer-events-none absolute ${className}`}
    >
      <path
        d="
          M70,110 C68,75 130,45 200,42 C265,40 320,68 322,105 C324,140 270,162 198,160 C128,158 72,145 70,110 Z
          M75,90 C50,70 30,60 20,68 M20,68 L32,74 M20,68 L28,80
          M318,88 C345,65 372,45 390,50 C378,58 372,68 375,78 M390,50 L378,60 M390,50 L385,66
          M95,148 L70,168 L50,190
          M120,155 L98,178 L82,202
          M148,159 L130,184 L118,210
          M178,160 L165,188 L158,214
          M245,159 L268,180 L286,204
          M272,157 L296,176 L314,198
          M296,150 L322,166 L342,186
          M315,140 L344,150 L366,164
        "
        fill="none"
        stroke={TONE_STROKE[tone]}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScallopLineArt({ tone = "light", className = "", opacity = 0.08 }: LineArtProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 80"
      style={{ opacity }}
      className={`pointer-events-none absolute ${className}`}
    >
      <path
        d="
          M10,70 A50,50 0 0 1 110,70 L10,70 Z
          M60,70 L18.4,46 M60,70 L36,28.4 M60,70 L60,22 M60,70 L84,28.4 M60,70 L101.6,46
        "
        fill="none"
        stroke={TONE_STROKE[tone]}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

import type { Metadata } from "next";
import { buildOpenGraph, SITE_URL } from "@/lib/seo";
import { editorialFontClassName } from "@/lib/editorial/fonts";
import "./globals.css";

const DEFAULT_TITLE = "元家｜新鮮海鮮與調理食品";
const DEFAULT_DESCRIPTION =
  "元家精選冷凍海鮮與調理食品，嚴選全球優質產地、通過品質把關，從商品列表開始探索。";

/**
 * 2026-08-18：補上 Open Graph／Twitter Card 預設值（使用者要求「SEO：頁面
 * title／meta description／Open Graph」）。title／description 各頁原本就有
 * （見各 page.tsx），這裡新增的是分享到 LINE／FB／X 等平台時會用到的
 * og:title／og:description／og:image／twitter:card 這組資料，目前每一頁都沒有。
 *
 * 這裡只放「全站預設值」，各頁在自己的 metadata／generateMetadata 裡用
 * src/lib/seo.ts 的 buildOpenGraph() 覆寫 openGraph 的 title／description／
 * images，讓分享出去的卡片跟該頁實際內容一致（不是每一頁分享出去都顯示同一張圖、
 * 同一段文字）。openGraph 這個 key 本身在 Next.js 是整份取代、不是逐欄位合併，
 * 所以 type／locale／siteName 這三個全站固定值也內建進 buildOpenGraph()，
 * 不會因為頁面自己覆寫 openGraph 就消失（見 buildOpenGraph() 檔頭說明）。
 *
 * 沒有另外做一張專門的 1200×630 OG 圖——目前只有 hero-seafood.jpg（真實首頁
 * Banner 裁切版）能用，比例不是社群平台建議的 1.91:1，分享卡片會被平台置中
 * 裁切，但內容是乾淨的海鮮擺拍照，裁切後不會出現破圖或缺文字的問題，先用這張，
 * 之後有專門設計的 OG 圖再換掉即可。
 *
 * twitter.card 選 "summary_large_image"——X／Twitter 的爬蟲在沒有另外設定
 * twitter:title／twitter:description／twitter:image 時，會自動退回讀
 * og:title／og:description／og:image（Twitter 自己文件記載的行為），所以這裡
 * 不用在每一頁重複填一次 twitter 欄位，只要 openGraph 有正確覆寫就夠了。
 *
 * 這組全站預設值套用到「全站」是刻意的（含 B2B／Admin／登入頁）——沒有
 * 覆寫自己 metadata 的頁面，分享出去至少有一個合理的標題／描述，不是空白，
 * 跟下面 2026-08-25 拿掉 Header／Footer 的調整是兩件事，不衝突。
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  openGraph: buildOpenGraph({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    images: [{ url: "/hero-seafood.jpg", width: 970, height: 980, alt: "元家精選海鮮" }],
  }),
  twitter: {
    card: "summary_large_image",
  },
};

/**
 * 2026-08-14：套用 design.md §5.2／§5.3 的品牌色彩與字體（token 定義見
 * src/app/globals.css），跟 B 的 /login 對齊。原本的 Geist 字體（create-next-app
 * 預設）拿掉，改用 design.md 指定的 "Noto Sans TC", "Microsoft JhengHei"（見
 * globals.css 的 --font-sans），這裡不用再另外掛字體 class。
 *
 * 2026-08-17：`data-scroll-behavior="smooth"` 是 Next.js 16 要求的明確
 * 標記——globals.css 有設定 `scroll-behavior: smooth`（給 Header 錨點連結用），
 * Next 偵測到這個 CSS 設定但沒看到這個屬性時會印警告，怕它跟路由切換的捲動
 * 還原互相干擾；加上這個屬性等於明確告訴 Next「這是刻意的」。
 *
 * 2026-08-19：`editorialFontClassName`（見 src/lib/editorial/fonts.ts）掛在
 * `<html>` 上，讓 `var(--ep-font-serif)`／`var(--ep-font-sans)`／
 * `var(--ep-font-en)` 這三個 CSS 變數全站都能用——這裡只是「註冊」這些
 * CSS 變數，不代表全站文字都會被強制換成編輯風字體（實際套用字體的
 * `font-[family-name:...]` class 在下面的 `<body>` 已經拿掉，改到
 * src/app/(b2c)/layout.tsx，只有 B2C 頁面才會真的套用這個字體，B2B／Admin／
 * 登入頁可以自己決定要不要用）。
 *
 * 2026-08-25（回應 B 回報 /business/catalog 同時顯示 B2C Header 與 B2B
 * BusinessHeader）：Header／Footer／B2CHelpWidget 原本直接掛在這個 root
 * layout，是從網站只有 B2C 頁面時期留下來的做法（見這裡先前版本的檔頭
 * 註解），當時就已經寫了 TODO 提醒之後要處理。現在 B2B（/business/catalog
 * 等）、Admin（/admin/*）頁面都是這個 root layout 的子路由，全站套用就會讓
 * 這些頁面也顯示 B2C 導覽列，跟 B2B 自己的版面疊在一起。
 *
 * 處理方式：Header／Footer／B2CHelpWidget，連同原本掛在 `<body>` 的 B2C
 * 專屬底色／字體／文字色，都搬到新的 src/app/(b2c)/layout.tsx，只套用在
 * `(b2c)` route group 底下的頁面（見該檔案的完整清單與理由）。這個 root
 * layout 現在只保留全站都需要的基礎 shell：`<html>`／`<body>` 標籤本身、
 * 字體 CSS 變數註冊、`globals.css`、全站 SEO 預設值——不含任何 B2C 專屬的
 * 元件或視覺樣式，B2B／Admin／登入頁不會再被迫繼承這些。
 *
 * `<body>` 只留 `flex min-h-full flex-col`（純排版骨架，不含顏色／字體），
 * 讓「內容不夠長時 Footer 貼齊視窗底部」這個效果在 B2C 頁面上（透過
 * `(b2c)/layout.tsx` 的內層 div）繼續成立，非 B2C 頁面也可以視需要用同一套
 * flex 骨架排版，不強迫套用 B2C 的顏色。
 *
 * `src/app/globals.css` 裡 design.md 時期定義的 `@theme` token（`ink-900`、
 * `surface-warm`、`brand-ocean-*` 等）**刻意沒有刪除**——`/login` 還沒重新
 * 設計，繼續依賴這些 token，見該檔案。
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      data-scroll-behavior="smooth"
      className={`h-full antialiased ${editorialFontClassName}`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

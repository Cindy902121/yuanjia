import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { B2CHelpWidget } from "@/components/B2CHelpWidget";
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
 * 目前這個網站只有 B2C 頁面（/、/products/*），所以 Header 直接掛在 root layout。
 * 之後 B 開始做 /business/*（B2B）跟 /admin 時，這個 B2C 導覽列（會員登入、企業合作、
 * 購物車這些 B2C 專屬入口）不應該一起出現在那些頁面上——屆時建議改用 Next.js 的
 * route group（例如 (b2c)/layout.tsx）把這個 Header 收進去，跟 B2B／Admin 的版面分開，
 * 不是把 Header 元件本身複雜化去判斷「現在是不是 B2C 頁面」。這裡先不動，只留這個提醒。
 *
 * 2026-08-14：套用 design.md §5.2／§5.3 的品牌色彩與字體（token 定義見
 * src/app/globals.css），跟 B 的 /login 對齊。原本的 Geist 字體（create-next-app
 * 預設）拿掉，改用 design.md 指定的 "Noto Sans TC", "Microsoft JhengHei"（見
 * globals.css 的 --font-sans），這裡不用再另外掛字體 class。
 *
 * 2026-08-14（同日）：加上全站 Footer（src/components/Footer.tsx，design.md §6.5
 * 提早做）。各頁 <main> 都帶 flex-1，Footer 排在 children 後面，內容不夠長時
 * Footer 還是會貼齊視窗底部，不會浮在中間。
 *
 * 2026-08-17：加上 B2C 需求釐清浮動工具（src/components/B2CHelpWidget.tsx，
 * PRD B2C-05／FDD §6.6）。跟 Header 不一樣，這裡沒有用 route group 排除
 * /login、/business、/admin——B2CHelpWidget 本身是 Client Component，直接用
 * usePathname() 判斷要不要渲染（見該檔案），不需要像 Header 那樣為了在 Server
 * Component 裡 await Supabase 查詢而依賴版面結構排除，兩種元件的限制不同，
 * 不是同一套解法硬套。
 *
 * 2026-08-17（同日）：`data-scroll-behavior="smooth"` 是 Next.js 16 要求的明確
 * 標記——globals.css 有設定 `scroll-behavior: smooth`（給 Header 錨點連結用），
 * Next 偵測到這個 CSS 設定但沒看到這個屬性時會印警告，怕它跟路由切換的捲動
 * 還原互相干擾；加上這個屬性等於明確告訴 Next「這是刻意的」。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風（原本只在 /design-preview/*
 * 底下的提案），正式取代 design.md 舊有的「海洋藍＋鮮活綠」系統，套用到全站，
 * 包含 Header／Footer。`editorialFontClassName`（見 src/lib/editorial/fonts.ts）
 * 掛在 `<html>` 上，讓 `var(--ep-font-serif)`／`var(--ep-font-sans)`／
 * `var(--ep-font-en)` 這三個 CSS 變數全站都能用，不用每個頁面自己重新載入一次
 * 字體。`<body>` 的背景／文字色改用編輯風的暖白／墨色（跟舊的
 * `bg-surface-warm`／`text-ink-900` 很接近，視覺上不會突兀），字體改成編輯風
 * 內文字體。
 *
 * `src/app/globals.css` 裡 design.md 時期定義的 `@theme` token（`ink-900`、
 * `surface-warm`、`brand-ocean-*` 等）**刻意沒有刪除**——`/products/tags/[slug]`、
 * `/products/categories/[slug]`、`/cart`、`/checkout`、`/login`、
 * `B2CHelpWidget` 這幾個還沒重新設計，繼續依賴這些 token，見各自檔案；等這些
 * 頁面之後也改版了，才是真的可以清掉舊 token 的時候。
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      data-scroll-behavior="smooth"
      className={`h-full antialiased ${editorialFontClassName}`}
    >
      <body className="flex min-h-full flex-col bg-[#FAF9F6] font-[family-name:var(--ep-font-sans)] text-[#2B2B2B]">
        <Header />
        {children}
        <Footer />
        <B2CHelpWidget />
      </body>
    </html>
  );
}

import type { Metadata } from "next";

/**
 * 目前還沒有正式對外網域（尚未部署），先用環境變數 `NEXT_PUBLIC_SITE_URL`
 * 讓之後接上正式網域時只需要改環境變數，不用動程式碼；本機開發、還沒設定這個
 * 變數時退回 localhost。sitemap.ts／robots.ts／各頁 JSON-LD 都需要組出絕對網址，
 * 2026-08-18 從 layout.tsx 搬到這裡集中管理，避免同一行 `process.env...` 散落在
 * 五六個檔案裡、之後改環境變數名稱要一個個找。
 *
 * ⚠️ 團隊正式部署（有網域）後，記得設定這個環境變數，否則 sitemap／og:image／
 * JSON-LD 裡的網址都會指向 localhost。
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "元家";

/**
 * 2026-08-18：共用的 Open Graph 建構函式。
 *
 * Next.js 的 metadata 合併規則：同一個 key（例如 `openGraph`）如果子層級（頁面）
 * 自己也定義了，會整個取代掉 root layout 定義的那份，不是逐欄位深度合併——這裡
 * 一開始每一頁各自寫一份 `openGraph: { title, description, url, images }`，結果
 * root layout 設的 `type`／`locale`／`siteName` 在每一頁都被蓋掉、完全沒有輸出
 * （實測 `curl` 首頁的 HTML，`og:type`／`og:site_name`／`og:locale` 這三個 meta
 * 標籤都不存在）。
 *
 * 改用這個函式統一產生每一頁的 `openGraph` 物件，把 `type`／`locale`／`siteName`
 * 這三個全站固定值內建進來，各頁只需要傳自己的 title／description／url／images，
 * 不用每一頁都重複寫、也不會再漏掉。
 */
export function buildOpenGraph(overrides: {
  title: string;
  description: string;
  url: string;
  images: NonNullable<Metadata["openGraph"]>["images"];
}): Metadata["openGraph"] {
  return {
    type: "website",
    locale: "zh_TW",
    siteName: SITE_NAME,
    ...overrides,
  };
}

/**
 * 2026-08-18：canonical 網址的共用小工具。目前唯一已知的重複內容案例是
 * `/products?category=X`（首頁快速分類卡連過去的查詢字串寫法）跟
 * `/products/categories/[slug]`（獨立頁面）——兩者內容幾乎一樣。`/products`
 * 頁面的 metadata 是靜態匯出（不是 generateMetadata），不會因為 query string
 * 不同就換 canonical，本來就一律指回 `/products`，等於已經正確處理了這個案例，
 * 這裡不用特別做例外判斷，各頁面只要老實填自己的路徑即可。
 */
export function canonicalFor(path: string): Metadata["alternates"] {
  return { canonical: path };
}

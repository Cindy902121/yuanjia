import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * 2026-08-18：robots.txt（使用者要求「SEO 技術基礎」）。Next.js App Router
 * 慣例：`src/app/robots.ts` export 一個函式，framework 自動產生 `/robots.txt`。
 *
 * 只擋 `/api/`——API 路由沒有 HTML、沒辦法掛 `<meta name="robots">`，只能靠
 * robots.txt 這種方式排除，本來就不該被索引。
 *
 * **刻意沒有**把 `/checkout`、`/login` 加進 disallow，雖然這兩頁也不希望被索引
 * ——這兩頁已經各自在 page.tsx 設定 `robots: { index: false, follow: false }`
 * （meta tag 層級的 noindex）。noindex 要生效的前提是爬蟲「有辦法爬到這個頁面」
 * 才看得到這個標記；如果同時又在 robots.txt disallow，爬蟲根本不會進去看，
 * Google 可能反而把這個網址收錄成「因 robots.txt 被封鎖」的空白結果（沒有
 * 標題／描述），比單純 noindex 更糟。這是 Google 官方文件明確警告過的常見錯誤
 * 組合，這裡刻意不重複设定。
 *
 * 2026-09（追加審查發現）：`/catalog-preview/*`、`/design-preview/*` 這幾個
 * B2B 型錄／視覺設計試驗頁完全沒有登入驗證、也沒有各自的 `robots` meta
 * 設定——跟上面 `/checkout`、`/login` 不一樣，這裡改用 disallow 而不是逐一
 * 幫每個變體頁補 meta noindex，理由是這兩類頁面的性質不同：`/checkout`、
 * `/login` 是正式功能頁面、有內部連結會被爬到，「先讓爬蟲看到 noindex 再
 * 撤下」才是安全作法；`catalog-preview`、`design-preview` 是純內部設計
 * 試驗場，沒有任何正式頁面連過去，Google 本來就沒有理由知道、也沒有收錄過
 * 這些網址，不存在「先前已索引、需要靠 noindex 乾淨撤下」的問題，直接擋
 * 爬蟲進去最單純、也不用逐一改 8 個檔案。這幾頁本身要不要加登入驗證是
 * 團隊還在決定的 B2B 設計方向，這裡不動，只先擋掉爬蟲索引。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/catalog-preview", "/design-preview"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

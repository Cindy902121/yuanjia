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
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

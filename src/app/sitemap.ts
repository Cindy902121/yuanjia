import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveProducts, getDistinctCategories } from "@/lib/supabase/products";
import { NEWS_ARTICLES } from "@/lib/content/news-items";
import { SITE_URL } from "@/lib/seo";

/**
 * 2026-08-18：sitemap.xml（使用者要求「SEO 技術基礎」，讓爬蟲一次找到所有商品
 * 頁面，不用自己慢慢從連結爬）。Next.js App Router 慣例：`src/app/sitemap.ts`
 * export 一個回傳 URL 陣列的函式，framework 會自動產生 `/sitemap.xml`，不需要
 * 額外設定路由。
 *
 * 商品／分類／標籤清單都直接查正式 Supabase（跟各頁面用同一批查詢函式，見
 * src/lib/supabase/products.ts），不是另外維護一份靜態清單——之後 C 擴充種子
 * 資料、新增商品，這裡會自動反映，不用手動更新。
 *
 * 標籤清單沒有另外查 `b2c_tags` 全表，改用「目前啟用商品實際掛的標籤」去重取得
 * ——避免列出資料庫裡存在、但目前沒有任何商品在用的標籤 slug（那種頁面點進去
 * 會是「無符合商品」空頁，不值得讓爬蟲花力氣爬）。
 *
 * `/checkout`、`/login` 沒有放進來——兩者都設定 `robots: { index: false }`（見
 * 各自的 page.tsx），不應該出現在 sitemap 裡（sitemap 的用途是「這些頁面希望被
 * 索引」，放進本來就不給索引的頁面互相矛盾）。
 *
 * 2026-08-18：補上 `/faq`、`/media`（新增的兩個 SEO 內容頁，見
 * src/app/faq/page.tsx、src/app/media/page.tsx），這兩頁是靜態內容、不用另外
 * 查 Supabase，直接寫進 staticEntries。
 *
 * 2026-08-19：補上 `/about`（新增的伸展頁面，見 src/app/about/page.tsx），一樣
 * 是靜態內容、可被索引。`/user`（會員中心）**沒有**放進來——跟 `/checkout`、
 * `/login` 同一個理由，`/user` 的 metadata 設定 `robots: { index: false }`，
 * 是帳號相關頁面，不該出現在 sitemap 裡。
 *
 * 2026-08-19（同日）：補上 `/business/lead`（企業合作展示表單，PRD 5.4／6.7
 * 正式規格頁面，見 src/app/business/lead/page.tsx）——PRD 6.7 明確把它列在
 * 可索引頁面清單裡，靜態內容，不用查 Supabase。
 *
 * 2026-08-25：補上 `/news`（列表頁，靜態）跟每篇文章各自的 `/news/[slug]`
 * （見 src/lib/content/news-items.ts）——跟商品／分類／標籤同一個做法，
 * 直接從內容資料產生，之後新增文章不用手動改這裡。
 *

 * 沒有帶 `lastModified`——`b2c_products` 雖然有 `updated_at` 欄位，但目前查詢層
 * （B2C_PRODUCT_FIELDS）沒有選取它，為了這個次要欄位去擴充核心商品查詢的回傳
 * 型別（ProductDetailData）不划算，`lastModified` 本來就是可選欄位，先省略。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    getAllActiveProducts(supabase),
    getDistinctCategories(supabase),
  ]);

  const tagSlugs = [...new Set(products.flatMap((product) => product.tags.map((tag) => tag.slug)))];

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/business/lead`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/media`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/news`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/cart`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/products/categories/${encodeURIComponent(category.slug)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const tagEntries: MetadataRoute.Sitemap = tagSlugs.map((slug) => ({
    url: `${SITE_URL}/products/tags/${slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const newsEntries: MetadataRoute.Sitemap = NEWS_ARTICLES.map((article) => ({
    url: `${SITE_URL}/news/${article.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...productEntries, ...categoryEntries, ...tagEntries, ...newsEntries];
}

import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveProducts, getDistinctCategories } from "@/lib/supabase/products";
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

  return [...staticEntries, ...productEntries, ...categoryEntries, ...tagEntries];
}

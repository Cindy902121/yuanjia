import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveProducts, getDistinctCategories } from "@/lib/supabase/products";
import { ProductListWithFilters } from "@/components/ProductListWithFilters";
import { FeaturedProductsBanner } from "@/components/FeaturedProductsBanner";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";

const TITLE = "商品列表 | 元家";
const DESCRIPTION = "瀏覽元家精選冷凍海鮮與調理食品，依分類與標籤篩選商品。";

/**
 * 2026-08-18：canonical 固定指回 "/products"（不管 ?category= 查詢字串是什麼）
 * ——這裡的 metadata 是靜態匯出，本來就不會因為 query string 不同而變，等於
 * 已經自動避開「/products?category=X」跟「/products/categories/[slug]」的重複
 * 內容問題（兩者內容幾乎一樣），不需要額外判斷。
 */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonicalFor("/products"),
  openGraph: buildOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    url: "/products",
    images: [{ url: "/products-banner.jpg", width: 1920, height: 380, alt: "元家嚴選當季鮮味" }],
  }),
};

/**
 * /products 頁面。
 *
 * 2026-08-17：改接正式 Supabase（C 本週排程要求，見 src/lib/supabase/products.ts
 * 檔頭說明），取代原本的 fixture 陣列。搜尋／分類／標籤篩選還是純前端邏輯
 * （ProductListWithFilters），只是初始資料來源換成一次查詢回來的全部啟用商品，
 * UI／篩選規則不用重寫；分類清單也改成動態查詢目前資料庫實際有哪些分類值
 * （getDistinctCategories），不是固定的 fixture 清單。
 *
 * 2026-08-14（沿用）：接住首頁快速分類卡帶來的 ?category=<slug> 查詢字串，
 * 當成 ProductListWithFilters 的初始篩選——只在字串真的對到一個已知分類時
 * 才套用。
 *
 * 2026-08-17（同日，沿用之前幾次調整）：容器 1440px、最上方圖片 banner
 * （FeaturedProductsBanner，左右滿版，<main> 本身不限制寬度）。
 */
export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const params = await searchParams;
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    getAllActiveProducts(supabase),
    getDistinctCategories(supabase),
  ]);

  const categoryParam = typeof params.category === "string" ? params.category : undefined;
  const initialCategorySlug = categories.some((category) => category.slug === categoryParam)
    ? categoryParam
    : undefined;

  return (
    <main className="flex flex-1 flex-col gap-6 py-10">
      <FeaturedProductsBanner />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-ink-900">商品列表</h1>
          <p className="text-sm text-ink-600">目前共 {products.length} 筆商品。</p>
          <p className="text-xs text-ink-600">
            本網站商品資訊為 MVP 展示資料，實際價格與庫存請以正式商城公告為準。
          </p>
        </div>

        <ProductListWithFilters
          products={products}
          categories={categories}
          initialCategorySlug={initialCategorySlug}
        />
      </div>
    </main>
  );
}

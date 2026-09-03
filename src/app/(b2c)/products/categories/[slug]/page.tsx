import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProductsByCategory } from "@/lib/supabase/products";
import { sortByAvailability, toCardData } from "@/lib/types/product";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";
import { EditorialProductGrid } from "@/components/editorial/ProductGrid";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { getCategoryIntro } from "@/lib/content/category-intros";

/**
 * /products/categories/[slug] 頁面。
 *
 * 分類頁跟標籤頁（/products/tags/[slug]）結構幾乎一樣，但正式資料庫目前沒有
 * `b2c_categories` 這張表，分類「slug」直接就是 `b2c_products.category` 的
 * 中文文字本身（見 src/lib/supabase/products.ts 檔頭說明）。
 *
 * 找不到分類、或分類底下目前沒有啟用商品，都顯示「無符合商品」。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，這裡也換成編輯風的網格，
 * 跟標籤頁（/products/tags/[slug]）同一套處理方式。
 *
 * 2026-08-25（SEO／AEO／GEO 內容深度補強）：原本這頁只有標題＋商品格線，沒有
 * 任何文字內容——對搜尋引擎跟 AI 摘要來說是「薄內容」，也把
 * `generateMetadata()` 裡的 description 直接當成頁面唯一文字浪費掉了。這裡
 * 加一段分類導言（見 src/lib/content/category-intros.ts），同一段文字也拿來
 * 當 meta description，維持「畫面上看得到的文字」跟「meta 裡宣稱的內容」
 * 一致（避免 description 寫一套、頁面內容是另一套的常見 SEO 反模式）。
 */
export async function generateMetadata({
  params,
}: PageProps<"/products/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = decodeURIComponent(slug);
  const title = `${categoryName} 商品 | 元家`;
  const description = getCategoryIntro(categoryName);

  return {
    title,
    description,
    alternates: canonicalFor(`/products/categories/${slug}`),
    openGraph: buildOpenGraph({
      title,
      description,
      url: `/products/categories/${slug}`,
      images: [{ url: "/products-banner.jpg", width: 1920, height: 380, alt: title }],
    }),
  };
}

export default async function ProductCategoryPage({ params }: PageProps<"/products/categories/[slug]">) {
  const { slug } = await params;
  const categoryName = decodeURIComponent(slug);
  const supabase = await createClient();
  const products = await getProductsByCategory(supabase, categoryName);
  const matches = sortByAvailability(products.map(toCardData));

  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <EditorialStyles />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-14 px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="flex flex-col gap-4">
          <Link
            href="/products"
            className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383] hover:text-[#FF5A36]"
          >
            ← ALL PRODUCTS
          </Link>
          <div>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
              CATEGORY
            </span>
            <h1 className="mt-2 font-[family-name:var(--ep-font-serif)] text-3xl font-light tracking-[0.05em] text-[#0B1620]">
              {categoryName}
            </h1>
          </div>
          <p className="max-w-2xl text-sm font-light leading-[1.9] text-[#5C7383]">
            {getCategoryIntro(categoryName)}
          </p>
        </div>

        <EditorialProductGrid products={matches} />
      </div>
    </main>
  );
}

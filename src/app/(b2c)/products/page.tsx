import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveProducts, getDistinctCategories } from "@/lib/supabase/products";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { EditorialProductList } from "@/components/editorial/ProductList";
import { collectTagGroups } from "@/lib/editorial/tag-groups";
import { getB2BAccess } from "@/lib/b2b/catalog";
import { B2BShoppingGuard } from "@/components/B2BShoppingGuard";

const TITLE = "商品列表 | 元家";
const DESCRIPTION = "瀏覽元家精選冷凍海鮮與調理食品，依分類與標籤篩選商品。";

/**
 * canonical 固定指回 "/products"（不管 ?category=／?tag= 查詢字串是什麼）——
 * 這裡的 metadata 是靜態匯出，本來就不會因為 query string 不同而變，等於已經
 * 自動避開「/products?category=X」跟「/products/categories/[slug]」的重複內容
 * 問題，不需要額外判斷。
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
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，正式取代舊版
 * ProductListWithFilters＋FeaturedProductsBanner＋ProductCard 的組合，換成
 * EditorialProductList（見 src/components/editorial/ProductList.tsx）。
 *
 * 篩選邏輯不變（搜尋、分類／標籤多選 AND），資料一樣查正式 Supabase；
 * `?category=`／`?tag=` 查詢字串也接住（商品詳情頁的篩選連結會用這個導過來）。
 *
 * 舊版元件（ProductListWithFilters、ProductCard、FeaturedProductsBanner）
 * **沒有刪除**——`/products/categories/[slug]`、`/products/tags/[slug]` 這兩個
 * 還沒重新設計的頁面繼續沿用，等之後也改版了才會是真的可以清掉舊元件的時候。
 *
 * 2026-09-03：路由規格註 1，B2B 公司 session 進來要顯示「請先登出企業帳號」
 * 守門畫面，不是商品列表。放在商品／分類資料查詢之前判斷，B2B 進來時直接
 * short-circuit，不需要多打這幾個 Supabase 查詢。
 */
export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const access = await getB2BAccess();
  if (access.role === "b2b") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 bg-[#EAF4F8] px-5 py-16 font-[family-name:var(--ep-font-sans)] text-[#0B1620] sm:px-8 lg:py-20">
        <B2BShoppingGuard />
      </main>
    );
  }

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

  const tagParam = typeof params.tag === "string" ? params.tag : undefined;
  const allTagSlugs = collectTagGroups(products).flatMap(([, tags]) => tags.map((tag) => tag.slug));
  const initialTagSlug = allTagSlugs.includes(tagParam ?? "") ? tagParam : undefined;

  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <EditorialStyles />

      {/* Banner：跟首頁 hero 同樣的「滿版圖片＋白字疊層」手法。 */}
      <section className="relative flex min-h-[280px] items-end overflow-hidden border-b border-[#D4DEE2] lg:min-h-[360px]">
        <div className="absolute inset-0" aria-hidden="true">
          <Image src="/products-banner.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        </div>
        <FadeInSection className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-5 pb-12 pt-20 sm:px-8 lg:px-10">
          <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-white/85">
            SEASONAL
          </span>
          <h1 className="font-[family-name:var(--ep-font-serif)] text-3xl font-light tracking-[0.05em] text-white sm:text-4xl">
            嚴選當季鮮味
          </h1>
        </FadeInSection>
      </section>

      <section>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <FadeInSection className="mb-14 flex flex-col gap-2">
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
              MENU · 商品一覽
            </span>
            <p className="text-xs font-light text-[#5C7383]">
              本網站商品資訊為 MVP 展示資料，實際價格與庫存請以正式商城公告為準。
            </p>
          </FadeInSection>

          <EditorialProductList
            products={products}
            categories={categories}
            initialCategorySlug={initialCategorySlug}
            initialTagSlug={initialTagSlug}
          />
        </div>
      </section>
    </main>
  );
}

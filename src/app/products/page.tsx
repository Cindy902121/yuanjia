import type { Metadata } from "next";
import { products } from "@/lib/fixtures/products";
import { categories } from "@/lib/fixtures/categories";
import { ProductListWithFilters } from "@/components/ProductListWithFilters";

export const metadata: Metadata = {
  title: "商品列表 | 元家",
  description: "瀏覽元家精選冷凍海鮮與調理食品，依分類與標籤篩選商品。",
};

/**
 * /products 骨架頁。
 *
 * TODO（接上 Supabase 後替換，見 docs/B2C商品展示資料.md §6～§9 與
 * docs/b2c-product-field-spec-v1.md）：
 * - 搜尋／分類篩選目前是純前端邏輯（見 ProductListWithFilters），還沒打 API；
 *   改依 ProductListState 處理 loading／error／empty／ready。
 *
 * 2026-08-14：接住首頁快速分類卡（design.md §6.3）帶來的 ?category=<slug> 查詢
 * 字串，當成 ProductListWithFilters 的初始篩選——只在字串真的對到一個已知分類時
 * 才套用，避免有人手動改網址帶垃圾值時篩選邏輯出錯。用伺服器端讀 searchParams
 * 直接把初始值傳給 client component，不用 useSearchParams（不用額外包 Suspense）。
 */
export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const params = await searchParams;
  const categoryParam = typeof params.category === "string" ? params.category : undefined;
  const initialCategorySlug = categories.some((category) => category.slug === categoryParam)
    ? categoryParam
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-5 py-10 sm:px-8 lg:px-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink-900">商品列表</h1>
        <p className="text-sm text-ink-600">
          目前顯示本機展示資料（{products.length} 筆），尚未接上 Supabase。
        </p>
      </div>

      <ProductListWithFilters
        products={products}
        categories={categories}
        initialCategorySlug={initialCategorySlug}
      />
    </main>
  );
}

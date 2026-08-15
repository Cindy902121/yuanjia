import type { Metadata } from "next";
import { products } from "@/lib/fixtures/products";
import { categories } from "@/lib/fixtures/categories";
import { ProductListWithFilters } from "@/components/ProductListWithFilters";

export const metadata: Metadata = {
  title: "商品列表 | 元家",
  description: "瀏覽元家精選冷凍海鮮與調理食品，依分類與標籤篩選商品。",
};

/**
 * B2C /products 骨架頁。
 *
 * TODO（接上 Supabase 後替換，見 docs/B2C商品展示資料.md §6～§9 與
 * docs/b2c-product-field-spec-v1.md）：
 * - 搜尋／分類篩選目前是純前端邏輯（見 ProductListWithFilters），還沒打 API；
 *   改依 ProductListState 處理 loading／error／empty／ready。
 */
export default async function ProductsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">商品列表</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          目前顯示本機展示資料（{products.length} 筆），尚未接上 Supabase。
        </p>
      </div>

      <ProductListWithFilters products={products} categories={categories} />
    </main>
  );
}

import type { Metadata } from "next";
import { products } from "@/lib/fixtures/products";
import { toCardData } from "@/lib/types/product";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "商品列表 | 元家",
  description: "瀏覽元家精選冷凍海鮮與調理食品，依分類與標籤篩選商品。",
};

/**
 * /products 骨架頁。
 *
 * TODO（接上 Supabase 後替換，見 docs/B2C商品展示資料.md §6～§9 與
 * docs/b2c-product-field-spec-v1.md）：
 * - 改用真正的商品查詢（依 ProductListState 處理 loading／error／empty／ready）。
 * - 搜尋框、分類篩選目前是靜態骨架，尚未接邏輯（本週 8/11–8/12 任務範圍）。
 */
export default async function ProductsPage() {
  const cards = products.map(toCardData);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">商品列表</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          目前顯示本機展示資料（{cards.length} 筆），尚未接上 Supabase。
        </p>
      </div>

      {/* TODO：搜尋框與分類篩選，靜態骨架，尚未接邏輯。 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <input
          type="search"
          placeholder="搜尋商品名稱"
          disabled
          aria-label="搜尋商品名稱（尚未啟用）"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
        />
        <span className="text-xs text-zinc-500">分類篩選（待接上）</span>
      </div>

      {cards.length === 0 ? (
        // 對應 PRD「無符合商品」規則；fixture 固定有 12 筆，此分支僅供未來串接後測試。
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          無符合商品
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      )}
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProductsByCategory } from "@/lib/supabase/products";
import { sortByAvailability, toCardData } from "@/lib/types/product";
import { ProductCard } from "@/components/ProductCard";

/**
 * /products/categories/[slug] 頁面（2026-08-17 新增，C 本週排程要求）。
 *
 * 分類頁跟標籤頁（/products/tags/[slug]）結構幾乎一樣，但正式資料庫目前沒有
 * `b2c_categories` 這張表（見 src/lib/supabase/products.ts 檔頭說明），分類
 * 「slug」直接就是 `b2c_products.category` 的中文文字本身（例如「魚類」）——
 * 不是另外查一張分類表取名稱，這裡的 `slug` 參數本身已經是可以直接顯示的名稱，
 * 不需要像標籤頁那樣另外查詢名稱。
 *
 * 找不到分類、或分類底下目前沒有啟用商品，都顯示「無符合商品」——PRD 對
 * 「無符合商品」的規則沒有區分這兩種情況（分類不存在 vs 分類存在但剛好 0 筆），
 * 前台本來就無法、也不需要區分，跟標籤頁、商品搜尋的無結果處理一致。
 */

export async function generateMetadata({
  params,
}: PageProps<"/products/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = decodeURIComponent(slug);

  return {
    title: `${categoryName} 商品 | 元家`,
    description: `瀏覽所有分類為「${categoryName}」的元家商品。`,
  };
}

export default async function ProductCategoryPage({
  params,
}: PageProps<"/products/categories/[slug]">) {
  const { slug } = await params;
  const categoryName = decodeURIComponent(slug);
  const supabase = await createClient();
  const products = await getProductsByCategory(supabase, categoryName);
  // 缺貨商品排到最後（2026-08-17 使用者要求），見 sortByAvailability 的說明。
  const matches = sortByAvailability(products.map(toCardData));

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-5 py-10 sm:px-8 lg:px-10">
      <Link href="/products" className="text-sm text-ink-600 hover:text-brand-ocean-700 hover:underline">
        ← 返回商品列表
      </Link>
      <h1 className="text-2xl font-semibold text-ink-900">分類：{categoryName}</h1>

      {matches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-subtle p-8 text-center text-sm text-ink-600">
          無符合商品
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      )}
    </main>
  );
}

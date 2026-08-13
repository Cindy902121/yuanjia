import Link from "next/link";
import type { ProductCardData } from "@/lib/types/product";
import { TrackedTagLink } from "@/components/analytics/TrackedTagLink";

interface ProductCardProps {
  product: ProductCardData;
  /** 標籤最多顯示幾個，超過用「+N」表示。可選，預設 3（見 docs/B2C商品展示資料.md §7.4）。 */
  maxVisibleTags?: number;
}

/**
 * 商品卡片。從 /products 與 /products/tags/[slug] 兩個頁面裡重複的行內 markup 抽出來，
 * 兩邊改用同一個元件，畫面規則以後只需要改一個地方。
 *
 * 欄位範圍依 docs/b2c-product-field-spec-v1.md §8（已確認版本）：只顯示圖片、名稱、
 * 價格、標籤——品牌、規格、分類不在卡片上，留給 /products/[slug] 詳情頁。
 *
 * 互動規則（見 docs/B2C商品展示資料.md §7.5）：
 * - 卡片整體點擊用 stretched-link（<Link> 加 after:absolute after:inset-0）導向
 *   /products/[slug]；不要把整張卡片包進最外層 <a> 或改用 role="button" 的 <div onClick>，
 *   那樣鍵盤與螢幕閱讀器操作標籤會有困難，也容易做出無效的巢狀 <a>。
 * - 標籤是獨立的 TrackedTagLink（見 src/components/analytics），用 relative z-10
 *   疊在 stretched-link 之上，確保點標籤只會導向 /products/tags/[slug]，不會同時
 *   觸發卡片跳轉；點擊時也會送出 b2c_tag_click 事件（8/15）。
 * - 圖片目前一律是佔位圖（Supabase 尚無任何商品圖片），alt="" 且 aria-hidden，因為
 *   它是裝飾用、不承載資訊，商品名稱已經由旁邊的文字傳達。
 */
export function ProductCard({ product, maxVisibleTags = 3 }: ProductCardProps) {
  const visibleTags = product.tags.slice(0, maxVisibleTags);
  const hiddenTagCount = product.tags.length - visibleTags.length;

  return (
    <li className="relative rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div
        aria-hidden="true"
        className="mb-3 flex h-32 items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-900"
      >
        無商品圖片
      </div>

      <Link
        href={`/products/${product.slug}`}
        className="after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <h2 className="line-clamp-2 text-base font-medium text-zinc-900 dark:text-zinc-50">
          {product.name}
        </h2>
      </Link>

      <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
        {product.shortDescription}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          NT$ {product.price}
        </span>
        {product.inventoryStatus === "out_of_stock" ? (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300">
            缺貨
          </span>
        ) : null}
      </div>

      {visibleTags.length > 0 ? (
        <ul className="relative z-10 mt-2 flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <li key={tag.slug}>
              <TrackedTagLink
                href={`/products/tags/${tag.slug}`}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {tag.name}
              </TrackedTagLink>
            </li>
          ))}
          {hiddenTagCount > 0 ? (
            <li className="px-2 py-0.5 text-xs text-zinc-400">+{hiddenTagCount}</li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

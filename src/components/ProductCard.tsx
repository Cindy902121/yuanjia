import Link from "next/link";
import type { ProductCardData } from "@/lib/types/product";
import { TrackedTagLink } from "@/components/analytics/TrackedTagLink";
import { AddToCartButton } from "@/components/AddToCartButton";

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
 *
 * 2026-08-14：套用 design.md §5.2／§5.3 的品牌色彩與字體，跟 B 的 /login 對齊
 * （token 見 src/app/globals.css）。標籤 chip 用海洋藍淡色（brand-ocean-050／
 * brand-ocean-800），缺貨徽章沿用 B 在 /login 錯誤訊息用的淡紅（error-050／
 * error-700），不是隨意挑色。
 *
 * 2026-08-14（同日）：套用 design.md §5.4／§7.1 的卡片規格——圓角 16px
 * （rounded-2xl）、圖片統一 4:3（aspect-[4/3]，取代原本固定 h-32）、hover 只做
 * translateY(-2px) 加低強度陰影，160–220ms，且用 motion-safe: 包住（§7.3 尊重
 * prefers-reduced-motion）。
 *
 * 欄位範圍刻意沒有跟著 design.md §6.3 的「商品卡依序呈現：…品牌／分類…規格與
 * 產地…」調整——那一條會把品牌／規格／分類放上卡片，跟 docs/b2c-product-field-spec-v1.md
 * §8（已確認版本，圖片／名稱／價格／標籤才在卡片上，其餘留給詳情頁）互相衝突。
 * 這次依專案既定的優先順序（已確認的欄位規格文件 > design.md 這種候選視覺提案）
 * 只套用 design.md 的版面／間距／圓角，沒有動欄位內容，如果要真的改欄位範圍，
 * 需要先跟已確認那份規格文件的人對過。
 *
 * 2026-08-17：加上「加入購物車」按鈕（PRD B2C-04，2026-08-17 已跟使用者確認卡片
 * 跟詳情頁都要放，見 src/components/AddToCartButton.tsx）。按鈕跟標籤一樣需要
 * relative z-10 疊在 stretched-link 之上，不然點擊會被卡片整體的連結吃掉、變成
 * 導向商品詳情頁而不是加入購物車。
 */
export function ProductCard({ product, maxVisibleTags = 3 }: ProductCardProps) {
  const visibleTags = product.tags.slice(0, maxVisibleTags);
  const hiddenTagCount = product.tags.length - visibleTags.length;

  return (
    <li className="group relative rounded-2xl border border-border-subtle bg-surface-white p-4 transition duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_8px_20px_rgba(23,36,42,0.08)]">
      <div
        aria-hidden="true"
        className="mb-3 flex aspect-[4/3] items-center justify-center rounded-xl bg-surface-warm text-xs text-ink-600"
      >
        無商品圖片
      </div>

      <Link
        href={`/products/${product.slug}`}
        className="after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
      >
        <h2 className="line-clamp-2 text-base font-medium text-ink-900">{product.name}</h2>
      </Link>

      <p className="mt-1 line-clamp-2 text-sm text-ink-600">{product.shortDescription}</p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-900">NT$ {product.price}</span>
        {product.inventoryStatus === "out_of_stock" ? (
          <span className="rounded bg-error-050 px-2 py-0.5 text-xs text-error-700">缺貨</span>
        ) : null}
      </div>

      <div className="relative z-10 mt-2">
        <AddToCartButton
          product={product}
          className="min-h-9 w-full rounded-lg bg-brand-ocean-700 px-3 text-xs font-semibold text-white transition hover:bg-brand-ocean-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700 disabled:cursor-not-allowed disabled:bg-border-subtle disabled:text-ink-600"
        />
      </div>

      {visibleTags.length > 0 ? (
        <ul className="relative z-10 mt-2 flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <li key={tag.slug}>
              <TrackedTagLink
                href={`/products/tags/${tag.slug}`}
                className="rounded-full bg-brand-ocean-050 px-2 py-0.5 text-xs text-brand-ocean-800 hover:bg-brand-ocean-700/15"
              >
                {tag.name}
              </TrackedTagLink>
            </li>
          ))}
          {hiddenTagCount > 0 ? (
            <li className="px-2 py-0.5 text-xs text-ink-600">+{hiddenTagCount}</li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

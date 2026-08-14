import Link from "next/link";
import type { ProductDetailState } from "@/lib/types/product";
import { TrackedTagLink } from "@/components/analytics/TrackedTagLink";

interface ProductDetailProps {
  state: ProductDetailState;
}

/**
 * 商品詳情顯示元件，從 /products/[slug] 頁面抽出來。
 *
 * 接受 ProductDetailState（loading／error／not_found／ready），不是直接接
 * ProductDetailData——目前頁面用同步的 fixture 查詢，找不到商品時由頁面直接呼叫
 * Next.js 的 notFound()（保留正確的 HTTP 404／SEO 語意），所以這裡的 not_found／
 * loading／error 分支現在頁面不會真的用到；等接上 Supabase 換成真正非同步查詢後
 * 才會用上，先在元件層做好，屆時頁面不需要重寫這個元件，只需要把查詢結果組成
 * 對應的 state 傳進來（商品不存在或已下架時，頁面仍應呼叫 notFound()，不是把
 * not_found 狀態傳給這個元件——見 docs/B2C商品展示資料.md §8.1 對 RLS 的說明）。
 *
 * 顯示規則見 docs/B2C商品展示資料.md §8.3：品牌／食安／認證缺漏時對應區塊直接
 * 隱藏，不顯示「無提供資料」等佔位文字。
 *
 * 2026-08-14：套用 design.md §5.2／§5.3 的品牌色彩與字體，跟 B 的 /login 對齊
 * （token 見 src/app/globals.css）。缺貨徽章沿用 B 在 /login 錯誤訊息用的淡紅
 * （error-050／error-700）。
 *
 * 2026-08-14（同日）：主圖依 design.md §6.3「詳情主圖可用 1:1」改用 aspect-square，
 * 圓角改 16px（rounded-2xl），跟卡片、快速分類卡統一。
 */
export function ProductDetail({ state }: ProductDetailProps) {
  if (state.status === "loading") {
    return <ProductDetailSkeleton />;
  }

  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-dashed border-border-subtle p-8 text-center text-sm text-ink-600">
        <p>載入商品資料時發生問題，請稍後再試一次。</p>
      </div>
    );
  }

  if (state.status === "not_found") {
    return (
      <div className="rounded-lg border border-dashed border-border-subtle p-8 text-center text-sm text-ink-600">
        <p>找不到這項商品。</p>
        <Link
          href="/products"
          className="mt-3 inline-block text-brand-ocean-700 underline underline-offset-2 hover:text-brand-ocean-800"
        >
          返回商品列表
        </Link>
      </div>
    );
  }

  const { product } = state;

  return (
    <div className="flex flex-col gap-6">
      <div
        aria-hidden="true"
        className="flex aspect-square max-h-[28rem] items-center justify-center rounded-2xl border border-border-subtle bg-surface-warm text-sm text-ink-600"
      >
        無商品圖片
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink-900">{product.name}</h1>
        {product.brand ? <p className="text-sm text-ink-600">品牌：{product.brand}</p> : null}
        <p className="text-lg font-semibold text-ink-900">NT$ {product.price}</p>
        {product.inventoryStatus === "out_of_stock" ? (
          <span className="w-fit rounded bg-error-050 px-2 py-0.5 text-xs text-error-700">
            缺貨
          </span>
        ) : null}
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-600">規格</dt>
          <dd className="text-ink-900">{product.specification}</dd>
        </div>
        <div>
          <dt className="text-ink-600">產地</dt>
          <dd className="text-ink-900">{product.origin}</dd>
        </div>
        <div>
          <dt className="text-ink-600">保存方式</dt>
          <dd className="text-ink-900">{product.storageMethod}</dd>
        </div>
        <div>
          <dt className="text-ink-600">分類</dt>
          <dd className="text-ink-900">
            {product.categories.map((category) => category.name).join("、")}
          </dd>
        </div>
      </dl>

      <p className="text-sm leading-6 text-ink-600">{product.description}</p>

      {product.foodSafetyInfo ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-900">食品安全</h2>
          <p className="mt-1 text-sm text-ink-600">{product.foodSafetyInfo}</p>
        </section>
      ) : null}

      {product.qualityInfo ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-900">認證／品質</h2>
          <p className="mt-1 text-sm text-ink-600">{product.qualityInfo}</p>
        </section>
      ) : null}

      {product.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <li key={tag.slug}>
              <TrackedTagLink
                href={`/products/tags/${tag.slug}`}
                className="rounded-full bg-brand-ocean-050 px-3 py-1 text-xs text-brand-ocean-800 hover:bg-brand-ocean-700/15"
              >
                {tag.name}
              </TrackedTagLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** 骨架屏；pulse 動畫只在使用者沒有要求減少動態效果時才播放（PRD 8.2 reduced motion）。 */
function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="aspect-square max-h-[28rem] rounded-2xl bg-surface-warm motion-safe:animate-pulse" />
      <div className="flex flex-col gap-2">
        <div className="h-7 w-2/3 rounded bg-surface-warm motion-safe:animate-pulse" />
        <div className="h-5 w-1/3 rounded bg-surface-warm motion-safe:animate-pulse" />
      </div>
      <div className="h-20 rounded bg-surface-warm motion-safe:animate-pulse" />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/useCart";

/**
 * /cart 的實際內容。PRD B2C-04／FDD §7.2：空購物車、商品清單（數量調整／移除）、
 * 總額、清空、前往結帳 CTA。
 *
 * 「即時重新確認價格與庫存」是 /checkout 頁的責任（使用者 2026-08-17 的原話是
 * 「結帳時重新確認」），這裡刻意保持單純，只顯示購物車裡的快照內容，不在這裡
 * 重複做一次比對邏輯。
 */
export function CartPageClient() {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-subtle p-12 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">購物車是空的</h1>
        <p className="text-sm text-ink-600">先去看看有哪些商品，喜歡的話加入購物車吧。</p>
        <Link
          href="/products"
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-ocean-700 px-6 text-sm font-semibold text-white transition hover:bg-brand-ocean-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
        >
          瀏覽商品
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900">購物車</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-medium text-ink-600 underline-offset-2 hover:text-error-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
        >
          清空購物車
        </button>
      </div>

      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-border-subtle bg-surface-white p-4"
          >
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-warm text-[10px] text-ink-600"
            >
              無商品圖片
            </div>

            <div className="flex min-w-[8rem] flex-1 flex-col gap-1">
              <Link
                href={`/products/${item.slug}`}
                className="text-sm font-medium text-ink-900 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
              >
                {item.name}
              </Link>
              <span className="text-sm text-ink-600">NT$ {item.price}</span>
            </div>

            <div className="flex items-center rounded-lg border border-border-subtle">
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                aria-label={`減少 ${item.name} 數量`}
                className="flex h-9 w-9 items-center justify-center text-ink-900 hover:bg-surface-warm"
              >
                −
              </button>
              <span className="flex h-9 w-10 items-center justify-center text-sm text-ink-900">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                aria-label={`增加 ${item.name} 數量`}
                disabled={item.quantity >= 100}
                className="flex h-9 w-9 items-center justify-center text-ink-900 hover:bg-surface-warm disabled:cursor-not-allowed disabled:text-ink-600/40"
              >
                ＋
              </button>
            </div>

            <span className="w-20 text-right text-sm font-semibold text-ink-900">
              NT$ {item.price * item.quantity}
            </span>

            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="text-xs font-medium text-ink-600 underline-offset-2 hover:text-error-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
            >
              移除
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-white p-6">
        <div className="flex items-center justify-between text-base font-semibold text-ink-900">
          <span>總計</span>
          <span>NT$ {totalPrice}</span>
        </div>
        <p className="text-xs text-ink-600">
          本網站商品資訊為 MVP 展示資料，實際價格與庫存請以正式商城公告為準。
        </p>
        <Link
          href="/checkout"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-ocean-700 px-6 text-sm font-semibold text-white transition hover:bg-brand-ocean-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
        >
          前往結帳
        </Link>
      </div>
    </>
  );
}

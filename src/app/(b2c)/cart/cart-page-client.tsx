"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/useCart";
import { editorialButtonSolid, editorialStepperButton, editorialStepperInput, editorialStepperWrap } from "@/lib/editorial/styles";

/**
 * /cart 的實際內容。PRD B2C-04／FDD §7.2：空購物車、商品清單（數量調整／移除）、
 * 總額、清空、前往結帳 CTA。
 *
 * 「即時重新確認價格與庫存」是 /checkout 頁的責任，這裡刻意保持單純，只顯示
 * 購物車裡的快照內容。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，這裡正式取代舊版卡片式
 * 版面——商品清單改成細線分隔的單欄列表（不是卡片格線），數量選擇器改用
 * src/lib/editorial/styles.ts 的直角方框（跟商品詳情頁同一套），CTA 改用
 * `editorialButtonSolid`（常駐填滿墨色，強調這是頁面最主要的下一步動作，
 * hover 才變點綴色，取代原本的海洋藍實色按鈕）。
 */
export function CartPageClient() {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 border border-dashed border-[#2b2b2b]/20 px-12 py-20 text-center">
        <h1 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#2b2b2b]">
          購物車是空的
        </h1>
        <p className="text-sm font-light text-[#4a4a4a]">先去看看有哪些商品，喜歡的話加入購物車吧。</p>
        <Link href="/products" className={`mt-2 ${editorialButtonSolid}`}>
          瀏覽商品
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-baseline justify-between border-b border-[#2b2b2b]/15 pb-6">
        <div className="flex flex-col gap-1">
          <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">
            CART
          </span>
          <h1 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#2b2b2b]">
            購物車
          </h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a] transition-colors hover:text-[#3E5C6B]"
        >
          CLEAR
        </button>
      </div>

      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.productId} className="flex flex-wrap items-center gap-4 border-b border-[#2b2b2b]/10 py-6">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#F3F1EB] text-[10px] text-[#8a8a8a]"
            >
              無商品圖片
            </div>

            <div className="flex min-w-[8rem] flex-1 flex-col gap-1">
              <Link
                href={`/products/${item.slug}`}
                className="font-[family-name:var(--ep-font-serif)] text-sm text-[#2b2b2b] hover:text-[#3E5C6B]"
              >
                {item.name}
              </Link>
              <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
                NT$ {item.price}
              </span>
            </div>

            <div className={editorialStepperWrap}>
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                aria-label={`減少 ${item.name} 數量`}
                className={editorialStepperButton}
              >
                −
              </button>
              <span className={`${editorialStepperInput} flex items-center justify-center`}>{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                aria-label={`增加 ${item.name} 數量`}
                disabled={item.quantity >= 100}
                className={editorialStepperButton}
              >
                ＋
              </button>
            </div>

            <span className="w-20 text-right font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#2b2b2b]">
              NT$ {item.price * item.quantity}
            </span>

            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a] transition-colors hover:text-[#B42318]"
            >
              REMOVE
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4 border-t border-[#2b2b2b]/15 pt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-[family-name:var(--ep-font-serif)] text-base text-[#2b2b2b]">總計</span>
          <span className="font-[family-name:var(--ep-font-en)] text-xl tracking-widest text-[#2b2b2b]">
            NT$ {totalPrice}
          </span>
        </div>
        <p className="text-xs font-light text-[#8a8a8a]">
          本網站商品資訊為 MVP 展示資料，實際價格與庫存請以正式商城公告為準。
        </p>
        <Link href="/checkout" className={`w-fit ${editorialButtonSolid}`}>
          前往結帳 →
        </Link>
      </div>
    </>
  );
}

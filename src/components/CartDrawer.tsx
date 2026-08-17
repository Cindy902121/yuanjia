"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/useCart";

/**
 * Header 的購物車入口。2026-08-17 兩次調整：
 * 1. 先從「點了跳到 /cart」改成鎖點下拉小視窗。
 * 2. 使用者看了附圖參考後，改成「右側滿版高度的抽屜」（附圖是類似的預購網站
 *   購物車），背景加半透明遮罩，這個檔案取代原本的 CartMenu.tsx。
 *
 * 因為現在有整頁遮罩，互動上比較接近「彈出對話框」而不是單純下拉選單，所以：
 * - role="dialog" aria-modal="true"，開啟時把焦點移進面板、Tab／Shift+Tab 在
 *   面板內的可聚焦元素之間循環（簡易 focus trap），關閉時把焦點還給觸發按鈕。
 * - 點遮罩或按 Esc 都會關閉。
 * - 尊重 prefers-reduced-motion：滑入動畫用 motion-safe: 包住。
 *
 * /cart 頁面本身沒有拿掉——FDD §7.2 明確把 /cart 列為獨立頁面，這裡的抽屜底部
 * 一樣留「查看完整購物車」連過去。
 */
export function CartDrawer() {
  const { items, totalPrice, updateQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="relative text-sm text-ink-600 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
      >
        購物車
        {totalQuantity > 0 ? (
          <span
            aria-hidden="true"
            className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-ocean-700 px-1.5 text-xs font-semibold text-white"
          >
            {totalQuantity > 99 ? "99+" : totalQuantity}
          </span>
        ) : null}
        <span className="sr-only">
          {totalQuantity > 0 ? `，目前有 ${totalQuantity} 件商品，開啟購物車` : "，購物車是空的"}
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-ink-900/40 motion-safe:animate-[fade-in_150ms_ease-out]"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="購物車"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-surface-white shadow-[-16px_0_40px_rgba(23,36,42,0.16)] motion-safe:animate-[slide-in-right_200ms_ease-out]"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <h2 className="text-base font-semibold text-ink-900">
                購物車{totalQuantity > 0 ? `（${totalQuantity}）` : ""}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label="關閉購物車"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-surface-warm hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
              >
                ✕
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
                <p className="text-sm text-ink-600">購物車是空的。</p>
                <Link
                  href="/products"
                  onClick={close}
                  className="text-sm font-semibold text-brand-ocean-700 underline underline-offset-2 hover:text-brand-ocean-800"
                >
                  去看看商品
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
                  {items.map((item) => (
                    <li key={item.productId} className="flex gap-3">
                      <div
                        aria-hidden="true"
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-warm text-[10px] text-ink-600"
                      >
                        無圖片
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={close}
                          className="text-sm font-medium text-ink-900 hover:text-brand-ocean-700"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center rounded-lg border border-border-subtle">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              aria-label={`減少 ${item.name} 數量`}
                              className="flex h-7 w-7 items-center justify-center text-ink-900 hover:bg-surface-warm"
                            >
                              −
                            </button>
                            <span className="flex h-7 w-8 items-center justify-center text-xs text-ink-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              aria-label={`增加 ${item.name} 數量`}
                              disabled={item.quantity >= 100}
                              className="flex h-7 w-7 items-center justify-center text-ink-900 hover:bg-surface-warm disabled:cursor-not-allowed disabled:text-ink-600/40"
                            >
                              ＋
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-ink-900">
                            NT$ {item.price * item.quantity}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`移除 ${item.name}`}
                        className="self-start text-ink-600 hover:text-error-700"
                      >
                        🗑
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3 border-t border-border-subtle px-5 py-4">
                  <div className="flex items-center justify-between text-base font-semibold text-ink-900">
                    <span>總計</span>
                    <span>NT$ {totalPrice}</span>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-ocean-700 px-6 text-sm font-semibold text-white transition hover:bg-brand-ocean-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
                  >
                    開始結帳 →
                  </Link>
                  <Link
                    href="/cart"
                    onClick={close}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle text-sm font-medium text-ink-900 hover:border-brand-ocean-700 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
                  >
                    查看完整購物車
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

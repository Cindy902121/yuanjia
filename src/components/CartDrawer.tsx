"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/useCart";
import { editorialButtonSolid, editorialStepperButton, editorialStepperInput, editorialStepperWrap } from "@/lib/editorial/styles";

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
 *
 * 2026-08-19：Header 全站改成日系雜誌編排風後，這裡的觸發按鈕（下面的
 * <button>）跟著換成同一套內文字體＋淡色的樣式，避免在新 Header 裡顯得突兀。
 *
 * 2026-08-19（同日，使用者回報抽屜開啟後版面跑位的 bug 並要求一併改版）：
 * - Bug 本身出在 Header 曾經加了 `backdrop-blur`，讓這個抽屜的
 *   `position: fixed` 滿版遮罩被限制在 Header 的方框大小內，不是這個檔案的
 *   問題，修法見 src/components/Header.tsx 的檔頭說明（已拿掉 backdrop-blur）。
 * - 順便把抽屜內部（品項清單、數量調整、結帳按鈕）也換成編輯風：直角方框
 *   數量選擇器（src/lib/editorial/styles.ts）、細線分隔取代卡片框、按鈕改
 *   editorialButtonSolid／方框連結。
 *
 * 2026-09（配色遷移，只換色不換排版／結構）：這個檔案的配色刻意分兩套處理，
 * 不是單一規則套到底：
 * - 觸發按鈕（上面 87 行附近的 `<button>`）視覺上「長在」Header 的深色列上
 *   （見 src/components/Header.tsx 同批修改），套用跟 Header 導覽連結一樣的
 *   深色底文字（`text-white/70`），不是全站通用的淺色底文字色。
 * - 抽屜面板本身（品項清單、結帳按鈕，`open` 為 true 時渲染的那個區塊）是
 *   浮在頁面內容上的淺色面板，跟全站其他淺色頁面套同一套一般配色規則
 *   （底色／文字／邊框對應到 Preview 的 glacier／ink／mist 等）。
 * 陰影 `shadow-[-16px_0_40px_rgba(...)]` 的顏色數值也跟著新的 ink 色改了
 * rgb 值（原本對應 `#2b2b2b`＝rgb(43,43,43)，現在對應 `#0B1620`＝
 * rgb(11,22,32)），純粹是陰影顏色本身要跟著新的文字／邊框色系一致，不是
 * 新增或調整陰影效果。
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
        className="relative text-sm tracking-[0.1em] text-white/70 transition-colors hover:text-[#FF5A36] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
      >
        購物車
        {totalQuantity > 0 ? (
          <span
            aria-hidden="true"
            className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#FF5A36] px-1.5 text-xs font-semibold text-white"
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
            className="absolute inset-0 bg-[#0B1620]/40 motion-safe:animate-[fade-in_150ms_ease-out]"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="購物車"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620] shadow-[-16px_0_40px_rgba(11,22,32,0.16)] motion-safe:animate-[slide-in-right_200ms_ease-out]"
          >
            <div className="flex items-center justify-between border-b border-[#0B1620]/15 px-6 py-5">
              <h2 className="font-[family-name:var(--ep-font-serif)] text-lg font-light tracking-[0.03em] text-[#0B1620]">
                購物車{totalQuantity > 0 ? `（${totalQuantity}）` : ""}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label="關閉購物車"
                className="flex h-9 w-9 items-center justify-center border border-[#0B1620]/20 text-[#5C7383] transition-colors hover:border-[#0B1620] hover:text-[#0B1620]"
              >
                ✕
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-sm font-light text-[#5C7383]">購物車是空的。</p>
                <Link
                  href="/products"
                  onClick={close}
                  className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#FF5A36] hover:text-[#0B1620]"
                >
                  去看看商品
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
                  {items.map((item) => (
                    <li key={item.productId} className="flex gap-3 border-b border-[#0B1620]/10 pb-5 last:border-0 last:pb-0">
                      <div
                        aria-hidden="true"
                        className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#F6FBFC] text-[10px] text-[#5C7383]"
                      >
                        無圖片
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={close}
                          className="font-[family-name:var(--ep-font-serif)] text-sm text-[#0B1620] hover:text-[#FF5A36]"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center justify-between">
                          <div className={editorialStepperWrap}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              aria-label={`減少 ${item.name} 數量`}
                              className={`${editorialStepperButton} !h-7 !w-7`}
                            >
                              −
                            </button>
                            <span className={`${editorialStepperInput} !h-7 !w-7 flex items-center justify-center !text-xs`}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              aria-label={`增加 ${item.name} 數量`}
                              disabled={item.quantity >= 100}
                              className={`${editorialStepperButton} !h-7 !w-7`}
                            >
                              ＋
                            </button>
                          </div>
                          <span className="font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#0B1620]">
                            NT$ {item.price * item.quantity}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`移除 ${item.name}`}
                        className="self-start text-[#5C7383] transition-colors hover:text-[#B42318]"
                      >
                        🗑
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3 border-t border-[#0B1620]/15 px-6 py-5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-[family-name:var(--ep-font-serif)] text-base text-[#0B1620]">總計</span>
                    <span className="font-[family-name:var(--ep-font-en)] text-lg tracking-widest text-[#0B1620]">
                      NT$ {totalPrice}
                    </span>
                  </div>
                  <Link href="/checkout" onClick={close} className={editorialButtonSolid}>
                    開始結帳 →
                  </Link>
                  <Link
                    href="/cart"
                    onClick={close}
                    className="inline-flex min-h-10 items-center justify-center border border-[#0B1620]/25 font-[family-name:var(--ep-font-en)] text-xs tracking-[0.15em] text-[#0B1620] transition-colors hover:border-[#0B1620]"
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

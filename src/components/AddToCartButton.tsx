"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart/useCart";
import { trackEvent } from "@/lib/analytics/track";

interface AddToCartButtonProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    inventoryStatus: "in_stock" | "out_of_stock";
  };
  /** 這次要加入的數量，預設 1（ProductCard 用）；ProductDetail 會傳入數量選擇器的值。 */
  quantity?: number;
  className?: string;
}

/**
 * 「加入購物車」按鈕，ProductCard 與 ProductDetail 共用（PRD B2C-04 沒有明確排除
 * 卡片上放這顆按鈕，2026-08-17 已跟使用者確認兩處都要）。
 *
 * 缺貨商品（inventoryStatus === "out_of_stock"）按鈕停用，不能加入購物車——跟卡片／
 * 詳情頁已經在顯示的「缺貨」徽章一致，不是另外發明一套規則。
 *
 * 點擊後：
 * - 呼叫 src/lib/cart/store.ts 加入購物車（瀏覽器 localStorage，見該檔案註解）。
 * - 送出 b2c_cart_add 事件（FDD §6.7 白名單）。故意不帶 product_id——目前商品還是
 *   本機 fixture（id 像 "fx-01"），不是真的 UUID，伺服器的 isUuid() 檢查一定會拒絕
 *   （跟 TrackPageView 在 /products/[slug] 不帶 productId 是同一個理由，見該檔案）。
 * - 短暫顯示「已加入」文字回饋（1.5 秒後恢復），並用 aria-live 讓螢幕閱讀器使用者
 *   也能感知到動作結果，不是只有視覺變化。
 */
export function AddToCartButton({ product, quantity = 1, className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) {
      return;
    }
    const timeoutId = setTimeout(() => setJustAdded(false), 1500);
    return () => clearTimeout(timeoutId);
  }, [justAdded]);

  const isOutOfStock = product.inventoryStatus === "out_of_stock";

  function handleClick() {
    if (isOutOfStock) {
      return;
    }
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
      },
      quantity,
    );
    trackEvent({ event_name: "b2c_cart_add" });
    setJustAdded(true);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isOutOfStock}
      aria-live="polite"
      className={
        className ??
        "min-h-11 rounded-lg bg-brand-ocean-700 px-4 text-sm font-semibold text-white transition hover:bg-brand-ocean-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700 disabled:cursor-not-allowed disabled:bg-border-subtle disabled:text-ink-600"
      }
    >
      {isOutOfStock ? "缺貨中" : justAdded ? "已加入購物車" : "加入購物車"}
    </button>
  );
}

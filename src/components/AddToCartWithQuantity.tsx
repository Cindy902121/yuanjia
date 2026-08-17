"use client";

import { useId, useState } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";

interface AddToCartWithQuantityProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    inventoryStatus: "in_stock" | "out_of_stock";
  };
}

/**
 * /products/[slug] 詳情頁用的「數量選擇器＋加入購物車」，跟 ProductCard 上單純的
 * 加入按鈕分開——詳情頁是使用者認真決定要買幾件的地方，卡片上只需要快速加入
 * 一件（PRD 沒有規定卡片要有數量選擇器，2026-08-17 的範圍確認只講「按鈕都要放」，
 * 沒有講數量選擇器要不要也放兩處，這裡刻意留在詳情頁比較合理，避免卡片太擠）。
 *
 * 獨立成 Client Component 是因為 ProductDetail 本身還是 Server Component（沒有
 * 互動狀態的部分不需要變成 client bundle），只有這一小塊有 useState。
 */
export function AddToCartWithQuantity({ product }: AddToCartWithQuantityProps) {
  const [quantity, setQuantity] = useState(1);
  const inputId = useId();
  const isOutOfStock = product.inventoryStatus === "out_of_stock";

  function clampQuantity(value: number) {
    if (Number.isNaN(value)) {
      return 1;
    }
    return Math.min(Math.max(Math.round(value), 1), 100);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-lg border border-border-subtle">
        <button
          type="button"
          onClick={() => setQuantity((current) => clampQuantity(current - 1))}
          disabled={isOutOfStock || quantity <= 1}
          aria-label="減少數量"
          className="flex h-11 w-11 items-center justify-center text-ink-900 hover:bg-surface-warm disabled:cursor-not-allowed disabled:text-ink-600/40 disabled:hover:bg-transparent"
        >
          −
        </button>
        <label htmlFor={inputId} className="sr-only">
          數量
        </label>
        <input
          id={inputId}
          type="number"
          min={1}
          max={100}
          value={quantity}
          disabled={isOutOfStock}
          onChange={(event) => setQuantity(clampQuantity(Number(event.target.value)))}
          className="h-11 w-14 border-x border-border-subtle text-center text-sm text-ink-900 outline-none disabled:bg-surface-warm disabled:text-ink-600"
        />
        <button
          type="button"
          onClick={() => setQuantity((current) => clampQuantity(current + 1))}
          disabled={isOutOfStock || quantity >= 100}
          aria-label="增加數量"
          className="flex h-11 w-11 items-center justify-center text-ink-900 hover:bg-surface-warm disabled:cursor-not-allowed disabled:text-ink-600/40 disabled:hover:bg-transparent"
        >
          ＋
        </button>
      </div>

      <AddToCartButton product={product} quantity={quantity} />
    </div>
  );
}

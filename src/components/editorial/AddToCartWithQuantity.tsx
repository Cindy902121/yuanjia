"use client";

import { useId, useState } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { editorialButtonLight, editorialStepperButton, editorialStepperInput, editorialStepperWrap } from "@/lib/editorial/styles";

interface EditorialAddToCartWithQuantityProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    inventoryStatus: "in_stock" | "out_of_stock";
  };
}

/**
 * 商品詳情頁的「數量選擇器＋加入購物車」，編輯風版本（原
 * design-preview/products/_components/EditorialAddToCartWithQuantity.tsx，
 * 2026-08-19 團隊確認正式採用後搬到這裡，取代
 * src/components/AddToCartWithQuantity.tsx 在 /products/[slug] 頁面的位置——
 * 舊元件本身沒有刪除，可能還有其他地方在用）。
 *
 * 邏輯照搬 AddToCartWithQuantity.tsx（clampQuantity 1～100 的規則一致），只是
 * 視覺換成編輯風的直角方框，加入購物車按鈕一樣直接重用真的 AddToCartButton
 * （真的購物車邏輯）。
 */
export function EditorialAddToCartWithQuantity({ product }: EditorialAddToCartWithQuantityProps) {
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
    <div className="flex flex-wrap items-center gap-4">
      <div className={editorialStepperWrap}>
        <button
          type="button"
          onClick={() => setQuantity((current) => clampQuantity(current - 1))}
          disabled={isOutOfStock || quantity <= 1}
          aria-label="減少數量"
          className={editorialStepperButton}
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
          className={editorialStepperInput}
        />
        <button
          type="button"
          onClick={() => setQuantity((current) => clampQuantity(current + 1))}
          disabled={isOutOfStock || quantity >= 100}
          aria-label="增加數量"
          className={editorialStepperButton}
        >
          ＋
        </button>
      </div>

      <AddToCartButton product={product} quantity={quantity} className={editorialButtonLight} />
    </div>
  );
}

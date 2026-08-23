"use client";

import { useSyncExternalStore } from "react";
import {
  addCartItem,
  clearCart,
  getCartSnapshot,
  removeCartItem,
  subscribeToCart,
  updateCartItemQuantity,
  type CartItem,
} from "./store";

/**
 * SSR 時沒有 localStorage，跟 getCartSnapshot() 在瀏覽器端第一次讀到「空購物車」
 * 時的形狀一致。刻意是模組層級的固定陣列、不是每次呼叫回傳新的 []——
 * useSyncExternalStore 用 Object.is 比較前後兩次快照，回傳新陣列參照會被當成
 * 「每次都變了」，觸發無限重新渲染（React 會直接跳出 in-loop 錯誤警告）。
 */
const EMPTY_CART: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

/**
 * 讀取／操作購物車的 hook；底層是 src/lib/cart/store.ts 那個 store，不是 Context，
 * 原因見該檔案開頭註解。用 useSyncExternalStore 訂閱，購物車在任何地方被改動
 * （加入、調整數量、移除、清空），所有有呼叫這個 hook 的元件都會同步重新渲染。
 */
export function useCart() {
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerSnapshot);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    totalQuantity,
    totalPrice,
    addItem: addCartItem,
    updateQuantity: updateCartItemQuantity,
    removeItem: removeCartItem,
    clearCart,
  };
}

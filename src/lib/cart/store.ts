/**
 * B2C 購物車狀態，存瀏覽器（PRD B2C-04「購物車保存於瀏覽器」，FDD §7.2 /cart
 * 頁面規格）。刻意不是 React Context——Header 目前是 async Server Component
 * （要 `await` Supabase 查登入狀態，見 Header.tsx），沒辦法直接包 Provider；
 * 改用一個獨立於 React 樹之外的小型 store（訂閱／發布模式），Header 只需要掛一個
 * 小的 Client Component（見 src/components/CartLink.tsx）訂閱這個 store，不用把
 * 整個 Header 改成 Client Component。
 *
 * 2026-08-17：依使用者要求（PRD B2C-04 之外的補充決定）——購物車項目保存「加入
 * 當下」的名稱／價格快照，之後商品資料變動（改價、下架）不會讓購物車裡的顯示
 * 跟著變；`/checkout` 頁再另外重新查一次即時資料比對（見
 * src/app/checkout/checkout-form.tsx），不是這裡的責任。
 */

export interface CartItem {
  /** 對應 ProductCardData.id（目前是 fixture id，例如 "fx-01"，不是真的 UUID）。 */
  productId: string;
  slug: string;
  /** 加入當下的名稱快照，不會因商品資料異動而改變。 */
  name: string;
  /** 加入當下的單價快照（新台幣），不會因商品資料異動而改變。 */
  price: number;
  quantity: number;
}

const STORAGE_KEY = "yuanjia_b2c_cart_v1";
const CHANGE_EVENT = "yuanjia:cart-change";

/** 單次購物車可加入的最大數量，跟 mock-orders API 的 100 品項上限對齊（見 FDD §6.3）。 */
const MAX_QUANTITY_PER_ITEM = 100;

function isBrowser() {
  return typeof window !== "undefined";
}

function readRaw(): CartItem[] {
  if (!isBrowser()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // 防禦性檢查：localStorage 內容可能被手動改壞，壞掉的項目直接濾掉，不讓整個購物車報錯。
    return parsed.filter(
      (item): item is CartItem =>
        item &&
        typeof item.productId === "string" &&
        typeof item.slug === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeRaw(items: CartItem[]) {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 例如無痕模式關閉 storage 或容量已滿——購物車功能退化成「當次瀏覽有效」，
    // 不讓寫入失敗擋住互動。
  }
  // 同分頁內的其他訂閱者（useCart 的多個實例）用自訂事件通知；瀏覽器原生的
  // storage 事件只會通知「其他」分頁，同一分頁不會觸發，兩者都需要。
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

let cache: CartItem[] | null = null;

/** 目前購物車內容的快照（給 useSyncExternalStore 的 getSnapshot 用）。 */
export function getCartSnapshot(): CartItem[] {
  if (cache === null) {
    cache = readRaw();
  }
  return cache;
}

export function subscribeToCart(callback: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }
  const handler = () => {
    cache = readRaw();
    callback();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function commit(items: CartItem[]) {
  cache = items;
  writeRaw(items);
}

/** 加入購物車；同一個商品已存在則累加數量，數量上限見 MAX_QUANTITY_PER_ITEM。 */
export function addCartItem(item: Omit<CartItem, "quantity">, quantity = 1) {
  const items = readRaw();
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY_PER_ITEM);
    commit([...items]);
    return;
  }
  commit([
    ...items,
    { ...item, quantity: Math.min(Math.max(quantity, 1), MAX_QUANTITY_PER_ITEM) },
  ]);
}

export function updateCartItemQuantity(productId: string, quantity: number) {
  const items = readRaw();
  if (quantity <= 0) {
    commit(items.filter((i) => i.productId !== productId));
    return;
  }
  commit(
    items.map((i) =>
      i.productId === productId
        ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) }
        : i,
    ),
  );
}

export function removeCartItem(productId: string) {
  commit(readRaw().filter((i) => i.productId !== productId));
}

export function clearCart() {
  commit([]);
}

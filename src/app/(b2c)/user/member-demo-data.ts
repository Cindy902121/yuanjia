import type { ProductCardData } from "@/lib/types/product";
import { DEMO_MEMBER_PROFILE } from "@/lib/cart/demo-profile";

/**
 * ============================================================================
 * ⚠️ DEMO / MOCK DATA —— 會員中心展示資料
 * ============================================================================
 *
 * 2026-09-11：使用者要求「這是課堂展示用 MVP，不會正式投入商業使用」，會員
 * 中心這次新增的訂單查詢／專屬優惠／收藏清單／多筆收件地址，目前 Supabase
 * 完全沒有對應的資料表（`b2c_orders`／`b2c_order_items` 只有 admin 專用、
 * 沒有依登入使用者查詢自己訂單的 API，見 `/api/b2c/mock-orders/route.ts`
 * 檔頭；優惠券／收藏／多筆地址目前完全沒有對應的表）——依使用者明確指示，
 * 這次**不新增／修改任何 Database Schema、RLS、Auth、API**，這個檔案裡的
 * 每一筆資料都是純前端展示用的假資料，不是從 Supabase 讀出來的。
 *
 * 本檔案內所有 `DEMO_*` 常數／`buildDemo*()` function 都是這個意思的標記——
 * 之後如果要接上真正的後端資料，找這個字首就能找到所有需要替換的地方。
 *
 * 商品相關的展示資料（收藏清單、訂單品項）**不是憑空編的**，是把真正從
 * Supabase 查出來的既有商品（`getAllActiveProducts()`，跟 `/products`
 * 頁面同一份資料）代入這裡的 builder function 產生——商品名稱、價格、照片
 * 全部是真實資料，只有「訂單編號」「訂單日期」「訂單狀態」「收藏與否」
 * 「優惠券」「收件地址」這些本來就沒有資料來源的欄位是這裡新編的展示內容。
 */

// ----------------------------------------------------------------------------
// 訂單
// ----------------------------------------------------------------------------

export type DemoOrderStatus = "pending_payment" | "pending_shipment" | "pending_receipt" | "picked_up" | "completed";

export const ORDER_STATUS_LABEL: Record<DemoOrderStatus, string> = {
  pending_payment: "待付款",
  pending_shipment: "待出貨",
  pending_receipt: "待收貨",
  picked_up: "已取貨",
  completed: "已完成",
};

/** Progress Timeline 顯示順序——訂單從左到右走過這五個階段。 */
export const ORDER_STATUS_SEQUENCE: DemoOrderStatus[] = [
  "pending_payment",
  "pending_shipment",
  "pending_receipt",
  "picked_up",
  "completed",
];

/**
 * 訂單查詢的 Filter Tabs——依使用者需求規格文字逐字對應「全部訂單／待付款／
 * 待出貨／待收貨／已完成」五個頁籤。「已取貨」是 Progress Timeline 裡的一個
 * 真實階段，但使用者列出的 Filter Tabs 清單裡沒有單獨給它一個頁籤，這裡照實
 * 作——「已取貨」的訂單只會出現在「全部訂單」頁籤，不會出現在其他任何單一
 * 狀態頁籤，沒有另外幫它加一個規格沒列的頁籤，也沒有把它硬塞進其他頁籤。
 */
export type OrderFilterTab = "all" | Exclude<DemoOrderStatus, "picked_up">;

export const ORDER_FILTER_TABS: { key: OrderFilterTab; label: string }[] = [
  { key: "all", label: "全部訂單" },
  { key: "pending_payment", label: "待付款" },
  { key: "pending_shipment", label: "待出貨" },
  { key: "pending_receipt", label: "待收貨" },
  { key: "completed", label: "已完成" },
];

export interface DemoOrderItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image: { url: string; alt: string } | null;
}

export interface DemoOrder {
  id: string;
  status: DemoOrderStatus;
  /** 展示用日期字串（已經是 `YYYY/MM/DD` 顯示格式，不是 ISO，這裡只是展示不是要排序運算）。 */
  placedAtLabel: string;
  items: DemoOrderItem[];
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
}

function orderTotal(order: Pick<DemoOrder, "items">) {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getOrderTotal(order: DemoOrder) {
  return orderTotal(order);
}

/**
 * 用真實商品資料（`getAllActiveProducts()` 查出來的既有商品）組出 6 筆展示
 * 訂單，涵蓋全部 5 種狀態（待付款／待出貨／待收貨各 1 筆，已取貨／已完成
 * 各示範一次進度走完的樣子）。商品用循環取用真實商品清單（不夠 6 種就重複
 * 使用，符合「同一個客人不同時間回購同樣商品」的合理情境），數量／收件人
 * 資訊沿用既有的 `DEMO_MEMBER_PROFILE`（跟 /user 頁面原本使用的展示收件
 * 資料是同一組，全站展示身分維持一致）。
 */
export function buildDemoOrders(products: ProductCardData[]): DemoOrder[] {
  if (products.length === 0) {
    return [];
  }

  const pick = (index: number) => products[index % products.length];

  function item(index: number, quantity: number): DemoOrderItem {
    const product = pick(index);
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      quantity,
      image: product.coverImage,
    };
  }

  const recipientName = DEMO_MEMBER_PROFILE.recipientName;
  const recipientPhone = DEMO_MEMBER_PROFILE.recipientPhone;
  const deliveryAddress = DEMO_MEMBER_PROFILE.deliveryAddress;

  return [
    {
      id: "YJ-20260903-0142",
      status: "pending_payment",
      placedAtLabel: "2026/09/03",
      items: [item(0, 2)],
      recipientName,
      recipientPhone,
      deliveryAddress,
    },
    {
      id: "YJ-20260828-0136",
      status: "pending_shipment",
      placedAtLabel: "2026/08/28",
      items: [item(1, 1), item(2, 3)],
      recipientName,
      recipientPhone,
      deliveryAddress,
    },
    {
      id: "YJ-20260815-0119",
      status: "pending_receipt",
      placedAtLabel: "2026/08/15",
      items: [item(3, 1)],
      recipientName,
      recipientPhone,
      deliveryAddress,
    },
    {
      id: "YJ-20260730-0098",
      status: "picked_up",
      placedAtLabel: "2026/07/30",
      items: [item(4, 2), item(0, 1)],
      recipientName,
      recipientPhone,
      deliveryAddress,
    },
    {
      id: "YJ-20260706-0071",
      status: "completed",
      placedAtLabel: "2026/07/06",
      items: [item(2, 1)],
      recipientName,
      recipientPhone,
      deliveryAddress,
    },
    {
      id: "YJ-20260622-0053",
      status: "completed",
      placedAtLabel: "2026/06/22",
      items: [item(1, 2), item(3, 2)],
      recipientName,
      recipientPhone,
      deliveryAddress,
    },
  ];
}

// ----------------------------------------------------------------------------
// 專屬優惠
// ----------------------------------------------------------------------------

export type DemoCouponStatus = "available" | "used" | "expired";

export const COUPON_STATUS_LABEL: Record<DemoCouponStatus, string> = {
  available: "可使用",
  used: "已使用",
  expired: "已失效",
};

/** 優惠券種類，決定 OffersSection 用哪個 Icon 呈現——不是憑外觀猜的，資料層就分類好。 */
export type DemoCouponKind = "amount_off" | "free_shipping" | "percent_off";

export interface DemoCoupon {
  id: string;
  kind: DemoCouponKind;
  title: string;
  discountLabel: string;
  condition: string;
  validUntilLabel: string;
  status: DemoCouponStatus;
}

/** 3 張展示優惠券，涵蓋「可使用／已使用／已失效」三種狀態，內容合理貼近冷凍水產電商情境。 */
export const DEMO_COUPONS: DemoCoupon[] = [
  {
    id: "coupon-new-member",
    kind: "amount_off",
    title: "新會員優惠",
    discountLabel: "NT$ 150",
    condition: "訂單滿 NT$ 1,000 可折抵，每帳號限用一次",
    validUntilLabel: "2026/12/31 前使用",
    status: "available",
  },
  {
    id: "coupon-frozen-free-shipping",
    kind: "free_shipping",
    title: "冷凍水產滿額免運",
    discountLabel: "免運費",
    condition: "單筆訂單冷凍水產品滿 NT$ 1,500 免運",
    validUntilLabel: "2026/10/31 前使用",
    status: "available",
  },
  {
    id: "coupon-salmon-discount",
    kind: "percent_off",
    title: "鮭魚系列商品 85 折",
    discountLabel: "85 折",
    condition: "限鮭魚菲力系列商品，恕不與其他優惠併用",
    validUntilLabel: "已於 2026/08/20 到期",
    status: "expired",
  },
];

// ----------------------------------------------------------------------------
// 收件地址
// ----------------------------------------------------------------------------

export interface DemoAddress {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  isDefault: boolean;
}

/** 2 筆展示收件地址，第一筆沿用既有 `DEMO_MEMBER_PROFILE`（跟 /user 頁面／結帳頁展示資料一致）並設為預設。 */
export const DEMO_ADDRESSES: DemoAddress[] = [
  {
    id: "addr-home",
    label: "住家",
    recipientName: DEMO_MEMBER_PROFILE.recipientName,
    recipientPhone: DEMO_MEMBER_PROFILE.recipientPhone,
    address: DEMO_MEMBER_PROFILE.deliveryAddress,
    isDefault: true,
  },
  {
    id: "addr-office",
    label: "公司",
    recipientName: DEMO_MEMBER_PROFILE.recipientName,
    recipientPhone: "0287654321",
    address: "106台北市大安區敦化南路二段100號8樓",
    isDefault: false,
  },
];

// ----------------------------------------------------------------------------
// 收藏清單
// ----------------------------------------------------------------------------

/**
 * 從真實商品清單取前 4 筆當成預設收藏（不是憑空造的收藏商品，跟 `/products`
 * 頁面看到的是同一批真實資料）；使用者可在會員中心用 Front-end State 加入／
 * 移除，重新整理後恢復這份預設清單。
 */
export function buildDemoFavoriteIds(products: ProductCardData[]): string[] {
  return products.slice(0, 4).map((product) => product.id);
}

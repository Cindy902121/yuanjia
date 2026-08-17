/**
 * B2C 商品前端型別。
 *
 * 依據 docs/b2c-product-field-spec-v1.md §8（PR #2，已 merge 進 B2C／main，
 * 標記為「依目前確認內容設計」）。這個檔案**取代** docs/B2C商品展示資料.md
 * 舊版草案裡的 ProductCardData／ProductDetailData 定義——舊版把品牌、分類、
 * 規格放進卡片，已被 docs/b2c-product-display-data-review.md 判定為
 * 「P0：商品卡內容和已確認需求衝突」，需要 A／B／C 再確認並統一。
 *
 * 對應的正式 Supabase schema 目前只存在於 GitHub Draft PR #1
 * 「Supabase B2C 商品欄位與 schema 對齊草案」（agent/supabase-schema-alignment
 * 分支，尚未 merge、尚未對遠端資料庫執行 db push）。在 PR #1 合併並套用前，
 * 這裡的欄位形狀只用來讓前端先用假資料（見 ../fixtures/products.ts）開發，
 * 之後接 Supabase 時只需要換掉查詢與 Mapper，元件不需要改。
 */

export type InventoryStatus = "in_stock" | "out_of_stock";

export interface ProductImageRef {
  url: string;
  alt: string;
}

export interface ProductTagRef {
  slug: string;
  name: string;
  /**
   * 標籤群組（例如「食材」「料理方式」「需求特性」「加工方式」）。
   * docs/b2c-product-field-spec-v1.md §8 的範例型別沒有列出這個欄位，但同一份文件
   * §7「標籤與 AND 篩選」本身就是照群組在描述標籤，且已套用／PR #1 的 b2c_tags
   * 都有真實的 group_name 欄位——這裡補上是為了讓多選篩選 UI 能依群組分區，
   * 不是要推翻已確認的欄位範圍。
   */
  groupName: string;
}

export interface ProductCategoryRef {
  slug: string;
  name: string;
  isPrimary: boolean;
}

export interface ProductDetailImage {
  url: string;
  alt: string;
  role: "cover" | "detail";
  sortOrder: number;
}

export interface ProductCertification {
  slug: string;
  name: string;
  issuer: string | null;
  description: string | null;
  imageUrl: string | null;
  certificateNumber: string | null;
  validUntil: string | null;
  note: string | null;
}

/**
 * 商品卡片（商品列表、首頁精選、搜尋結果）使用的最小資料。
 * 刻意不含品牌、分類、規格——這些只在詳情頁顯示（docs/b2c-product-field-spec-v1.md §1.6）。
 */
export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: "TWD";
  shortDescription: string;
  inventoryStatus: InventoryStatus;
  coverImage: ProductImageRef | null;
  tags: ProductTagRef[];
}

/** 商品詳情頁使用；擴充卡片欄位。 */
export interface ProductDetailData extends ProductCardData {
  brand: string;
  specification: string;
  origin: string;
  storageMethod: string;
  description: string;
  foodSafetyInfo: string | null;
  qualityInfo: string | null;
  /** 多對多正式分類；每筆商品最多一個 isPrimary: true（見 b2c_product_categories）。 */
  categories: ProductCategoryRef[];
  /** 目前 Storage 沒有任何檔案，fixture 資料一律是空陣列，由元件顯示佔位圖。 */
  images: ProductDetailImage[];
  /** 未經逐項核實的認證不應出現在這裡；fixture 資料預設空陣列，見檔頭說明。 */
  certifications: ProductCertification[];
}

/** 商品列表容器狀態；ProductCard 只在 status === "ready" 時，針對陣列中每一筆被呼叫一次。 */
export type ProductListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty"; reason: "no_search_result" | "no_filter_result" }
  | { status: "ready"; products: ProductCardData[] };

/**
 * 商品詳情頁容器狀態。
 * not_found 同時涵蓋「slug 不存在」與「商品已下架」——B2C 公開查詢的 RLS
 * 只會回傳 is_active = true 的商品，兩種情況在前台無法區分。
 */
export type ProductDetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not_found" }
  | { status: "ready"; product: ProductDetailData };

/**
 * 排序：庫存中的商品在前，缺貨排到最後；同一種庫存狀態內維持原本順序（穩定排序，
 * Array.prototype.sort 自 ES2019 起保證穩定）。2026-08-17 使用者要求缺貨商品排在
 * 最後——用排序而不是手動調整 fixture 陣列順序，之後不管加幾筆新商品、不管
 * 哪一筆缺貨，順序都會自動正確，不用每次手動搬動陣列位置。
 */
export function sortByAvailability<T extends { inventoryStatus: InventoryStatus }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    if (a.inventoryStatus === b.inventoryStatus) {
      return 0;
    }
    return a.inventoryStatus === "out_of_stock" ? 1 : -1;
  });
}

/** 由 ProductDetailData 取出卡片所需欄位，確保卡片與詳情頁資料永遠一致（單一資料來源）。 */
export function toCardData(product: ProductDetailData): ProductCardData {
  const {
    id,
    slug,
    name,
    price,
    currency,
    shortDescription,
    inventoryStatus,
    coverImage,
    tags,
  } = product;
  return { id, slug, name, price, currency, shortDescription, inventoryStatus, coverImage, tags };
}

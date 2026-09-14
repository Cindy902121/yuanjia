import type { ProductImageRef } from "@/lib/types/product";

/**
 * Supabase 商品的照片對照表（2026-08-17 起，使用者要求「抓真實商品的照片，
 * 然後應用到現在開發的網頁」，來源為元家自己的官網 yens.com.tw／asf.com.tw）。
 * 原本只有最初 5 筆種子商品，2026-09-04 補上第 6 筆 `taiwan-squid`（見該筆
 * 註解說明來由）——這份對照表的設計本來就是「slug → 照片」開放式擴充，不是
 * 寫死只服務 5 筆，之後不管哪個管道（seed、後台編輯器）新增商品，都可以照
 * 同一套模式補照片。
 *
 * 正式資料庫 `b2c_products.image_path` 目前全部是 null（尚無任何商品圖片，見
 * src/lib/supabase/products.ts 檔頭說明），這裡不是等 image_path 有值，而是先用
 * 「slug → 對照表」的方式手動補上照片，之後正式圖片欄位補齊了，只需要
 * 把 src/lib/supabase/products.ts 的 mapRow() 改回直接讀 image_path，這個對照表
 * 整份刪掉即可，元件（ProductCard／ProductDetail）不用改。
 *
 * 官網上找不到跟這些商品完全對應的真實商品（規格／產地／作法都有出入），
 * 使用者已確認「用接近的照片，注明不完全對應」——每筆都在 `mismatchNote` 記錄
 * 已知落差，之後有正式商品攝影就整批換掉。
 */
export interface ProductPhotoEntry {
  image: ProductImageRef;
  /** 已知跟正式商品規格／產地／作法的落差，供之後檢視、換照片時參考。 */
  mismatchNote: string;
}

export const PRODUCT_PHOTOS: Record<string, ProductPhotoEntry> = {
  "taiwan-milkfish-belly": {
    image: {
      url: "/product-photos-milkfish-belly.jpg",
      alt: "台灣虱目魚肚示意照（近似商品，非正式商品攝影）",
    },
    mismatchNote:
      "來源商品標示 160g/片，正式資料庫規格為 180g/包，包裝規格不完全一致。",
  },
  "seasoned-mackerel": {
    image: {
      url: "/product-photos-mackerel.jpg",
      alt: "日式調味鯖魚示意照（近似商品，非正式商品攝影）",
    },
    mismatchNote:
      "來源為「萬葉 輕鹽鯖魚」的生鮮切片照，「輕鹽」與正式商品名稱「調味」的調味方式不完全一致。",
  },
  "norwegian-salmon-fillet": {
    image: {
      url: "/product-photos-salmon-fillet.jpg",
      alt: "挪威鮭魚菲力示意照（近似商品，非正式商品攝影）",
    },
    mismatchNote: "來源商品產地為智利，正式資料庫產地為挪威，產地不一致。",
  },
  "argentine-red-shrimp": {
    image: {
      url: "/product-photos-shrimp.jpg",
      alt: "阿根廷天使紅蝦示意照（近似商品，非正式商品攝影）",
    },
    mismatchNote:
      "來源商品產地為馬來西亞（完美紅-白蝦），正式資料庫產地為阿根廷，產地與蝦種皆不完全一致。",
  },
  "taiwan-clam": {
    image: {
      url: "/product-photos-clam.jpg",
      alt: "台灣鮮甜蛤蜊示意照（近似商品，非正式商品攝影）",
    },
    mismatchNote:
      "來源照片為熟凍去殼花蛤肉的情境照，跟正式商品「台灣鮮甜蛤蜊」的帶殼／處理方式可能不完全一致。",
  },
  /**
   * 2026-09-04：`taiwan-squid`（台灣鮮甜小卷）是 9/4 最終回歸測試時，發現
   * 團隊另一分支（codex/admin-management，B2C 商品後台編輯器）的 seed
   * 套用到共用遠端 Supabase 後才出現的第 6 筆商品（見
   * docs/b2c-regression-evidence-0831-0904.md §6.2）。這裡照同一套「slug →
   * 官網近似商品照」邏輯補上照片，不是等哪個團隊成員之後才想到要補圖。
   */
  "taiwan-squid": {
    image: {
      url: "/product-photos-squid.jpg",
      alt: "台灣鮮甜小卷示意照（近似商品，非正式商品攝影）",
    },
    mismatchNote:
      "來源為元家官網「透抽」（Loligo Squid）產品照，產地標示印尼，跟正式資料庫「台灣鮮甜小卷」的台灣產地不一致；「透抽」與「小卷」在市場上常混用但嚴格來說指不同體型／規格的小型烏賊，命名也不完全對應。",
  },
};

/** 依 slug 取得近似商品照片；沒有對應資料時回傳 null，元件維持顯示「無商品圖片」佔位。 */
export function getProductPhoto(slug: string): ProductImageRef | null {
  return PRODUCT_PHOTOS[slug]?.image ?? null;
}

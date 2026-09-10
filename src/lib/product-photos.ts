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
 *
 * 2026-09（P2-2 二次確認）：實際把 6 張照片叫出來跟資料庫規格逐一核對，
 * 發現其中 4 張（虱目魚肚、鮭魚菲力、天使紅蝦、蛤蜊）照片本身印著規格
 * 重量色塊，且有 3 張（鮭魚菲力／天使紅蝦／蛤蜊）的重量色塊跟資料庫規格
 * 不一致，這 3 筆先前只記錄了產地／品種／處理方式的落差，沒記錄到這個
 * 印在照片上、比較容易被客人直接看出來的重量落差——這次一併補進各筆的
 * `mismatchNote`。第一次的處理方式是「維持原圖，不裁圖也不換圖」，只把
 * 商品列表／詳情／購物車頁面的揭露文字寫更明確（見
 * src/app/(b2c)/products/page.tsx、products/[slug]/page.tsx、
 * cart/cart-page-client.tsx）。
 *
 * 2026-09-10（使用者重新考慮，改為裁修照片）：文字揭露終究只是「事後說明」，
 * 客人還是會先看到照片上印著跟頁面文字不同的數字，容易先入為主覺得網站
 * 資料錯誤——改成直接處理照片本身：4 張印有規格色塊的照片，色塊區域（右下角
 * 一塊固定位置、固定大小的圓角矩形）都用該區域自己的像素做強力模糊處理
 * （sharp `.blur(30)`，把模糊過的區域疊回原圖同一位置），不是裁切或去背—
 * —裁切會改變圖片長寬比，用在目前 `aspect-square` 的顯示容器裡，
 * `object-cover` 裁切結果不可控；模糊則是圖片尺寸完全不變、只讓色塊上的
 * 文字看不清楚，看起來像自然的景深失焦，不像明顯的後製痕跡。鯖魚、小卷
 * 這兩張本來就沒有印刷規格，沒有動。
 *
 * 商品列表／詳情／購物車頁面的「商品照片為近似示意」揭露文字**維持不變，
 * 沒有拿掉**——規格重量的落差已經處理掉了，但產地／品種／處理方式的落差
 * （見下面各筆 `mismatchNote` 沒有印在照片上的那部分）依然存在，這些是
 * 光看照片看不出來的，揭露文字對這部分還是必要的，不是重複或多餘。
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
      "來源商品標示 160g/片，正式資料庫規格為 180g/包，包裝規格不完全一致。原始照片印有「160g/片」規格色塊，已於 2026-09-10 用模糊處理蓋掉，圖片現況已無此問題。",
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
    mismatchNote:
      "來源商品產地為智利，正式資料庫產地為挪威，產地不一致。原始照片印有「175g/包」規格色塊，跟正式資料庫規格 200g/包 不一致，已於 2026-09-10 用模糊處理蓋掉，圖片現況已無此問題。",
  },
  "argentine-red-shrimp": {
    image: {
      url: "/product-photos-shrimp.jpg",
      alt: "阿根廷天使紅蝦示意照（近似商品，非正式商品攝影）",
    },
    mismatchNote:
      "來源商品產地為馬來西亞（完美紅-白蝦），正式資料庫產地為阿根廷，產地與蝦種皆不完全一致。原始照片印有「600g/盒」規格色塊，跟正式資料庫規格 500g/盒 不一致，已於 2026-09-10 用模糊處理蓋掉，圖片現況已無此問題。",
  },
  "taiwan-clam": {
    image: {
      url: "/product-photos-clam.jpg",
      alt: "台灣鮮甜蛤蜊示意照（近似商品，非正式商品攝影）",
    },
    mismatchNote:
      "來源照片為熟凍去殼花蛤肉的情境照，跟正式商品「台灣鮮甜蛤蜊」的帶殼／處理方式可能不完全一致。原始照片印有「1000g/包」規格色塊，跟正式資料庫規格 500g/包 不一致，已於 2026-09-10 用模糊處理蓋掉，圖片現況已無此問題。",
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

# 元家 B2C 第一版產品欄位規格

- 文件版本：v1.0
- 整理日期：2026-08-10
- 適用範圍：首頁、商品列表、商品詳情、分類頁、標籤頁
- 狀態：討論草案，尚未套用至正式 Supabase

## 1. 需求結論

第一版資料模型依目前確認內容設計：

1. 首頁預設顯示最新商品，也允許管理員指定精選商品及手動排序。
2. 「蝦蟹類、魚類、貝類、軟體類、肉類、調理食品」是正式分類。
3. 商品可同時屬於多個正式分類，例如調理過的魚可同時屬於「魚類」與「調理食品」。
4. 蝦與蟹在正式分類中合併為「蝦蟹類」，更細的差異交由標籤處理。
5. 商品規格使用可直接閱讀的文字，例如「去骨魚排，2 片／盒」。
6. 商品卡片以圖片、名稱、價格及標籤為主；品牌、規格等完整資料放在詳情頁。
7. 每項商品可放 1 張封面圖及 3–5 張細節圖，詳情頁下方可補充完整說明。
8. 資料庫保留庫存數量，前台只顯示「有庫存／售完」狀態，不顯示實際數字。
9. 食安或品質證書包含證書圖片及文字補充。
10. 第一版不處理購物車、結帳與 B2CHelpWidget 完整功能。

## 2. 頁面需要的資料

| 頁面／元件 | 必要資料 | 選用資料 | 說明 |
|---|---|---|---|
| 首頁精選商品 | 封面圖、名稱、價格、商品 slug | 標籤、短摘要 | 先顯示管理員指定精選；不足時可由最新商品補足。 |
| 商品列表 ProductCard | 封面圖、名稱、價格、商品 slug、庫存狀態 | 標籤、短摘要 | 卡片不塞入品牌、規格與完整說明。 |
| 搜尋結果 | ProductCard 資料、搜尋關鍵字 | 結果數量 | 搜尋名稱、品牌、短摘要及規格。 |
| 分類頁 | 分類名稱、分類 slug、分類內商品 | 分類說明 | 一項商品可出現在多個分類頁。 |
| 標籤頁 | 標籤名稱、標籤 slug、符合商品 | 已選標籤清單 | 多標籤採 AND 篩選，商品須符合所有已選標籤。 |
| 商品詳情 ProductDetail | 圖片集、名稱、價格、規格、產地、保存方式、食安、品質、說明、庫存狀態 | 品牌、標籤、分類、證書 | 第一張為封面，其餘依排序顯示細節圖。 |
| 無結果狀態 | 關鍵字或篩選條件 | 清除篩選入口 | 明確說明目前沒有符合商品。 |

## 3. 核心商品欄位：b2c_products

| 欄位 | 型別 | 必填 | 前台顯示 | 用途／規則 |
|---|---|---:|---:|---|
| id | uuid | 是 | 否 | 資料庫主鍵。 |
| slug | text | 是 | 路由 | 商品唯一網址，例如 `boneless-fish-fillet`。建立後避免任意更改。 |
| name | text | 是 | 是 | 商品正式名稱。 |
| brand | text | 是 | 詳情頁 | 品牌名稱；卡片預設不顯示。 |
| specification | text | 是 | 詳情頁 | 可讀規格，例如「去骨魚排，2 片／盒」。 |
| price | numeric(10,2) | 是 | 是 | 售價，不得小於 0。 |
| currency | text | 是 | 視需要 | ISO 三碼幣別，第一版固定 `TWD`。 |
| short_description | text | 是 | 列表／詳情頁首屏 | 約 60–160 字的商品摘要。 |
| description | text | 是 | 詳情頁 | 完整商品說明，可放料理特色或食用建議。 |
| origin | text | 是 | 詳情頁 | 產地，例如「台灣」、「挪威」。 |
| storage_method | text | 是 | 詳情頁 | 保存方式及溫度，例如「冷凍 -18°C 以下」。 |
| food_safety_info | text | 否 | 詳情頁 | 檢驗、過敏原、食安或加工環境文字。 |
| quality_info | text | 否 | 詳情頁 | 品質標準、選品方式或製程補充。 |
| mock_inventory | integer | 是 | 否 | 資料庫庫存數量，不得小於 0。第一版仍是 mock／展示用途。 |
| inventory_status | generated text | 自動 | 是 | 由庫存數量產生：大於 0 為 `in_stock`，否則為 `out_of_stock`。 |
| is_featured | boolean | 是 | 否 | 是否由管理員指定為首頁精選。預設 false。 |
| featured_sort_order | integer | 否 | 否 | 精選商品手動順序；數字越小越前面。 |
| published_at | timestamptz | 否 | 否 | 用於「最新商品」排序；新到舊排列。 |
| is_active | boolean | 是 | 否 | false 時不出現在公開頁面。 |
| created_at | timestamptz | 是 | 否 | 建立時間。 |
| updated_at | timestamptz | 是 | 否 | 最後更新時間。 |

### 暫時保留的舊欄位

| 欄位 | 現況 | 後續處理 |
|---|---|---|
| category | 舊版單一分類文字 | 前端改用多分類關聯後，再另開 migration 移除。 |
| image_path | 舊版單一圖片路徑 | 前端改用圖片關聯後，再另開 migration 移除。 |

## 4. 正式分類

### b2c_categories

| 欄位 | 型別 | 必填 | 用途／規則 |
|---|---|---:|---|
| id | uuid | 是 | 分類主鍵。 |
| slug | text | 是 | 分類頁網址，必須唯一。 |
| name | text | 是 | 前台分類名稱。 |
| description | text | 否 | 分類頁補充說明。 |
| sort_order | integer | 是 | 分類顯示順序，數字越小越前面。 |
| is_active | boolean | 是 | 是否公開顯示。 |
| created_at／updated_at | timestamptz | 是 | 建立及更新時間。 |

第一版正式分類：

| slug | 顯示名稱 | sort_order |
|---|---|---:|
| shrimp-and-crab | 蝦蟹類 | 10 |
| fish | 魚類 | 20 |
| shellfish | 貝類 | 30 |
| cephalopods | 軟體類 | 40 |
| meat | 肉類 | 50 |
| prepared-food | 調理食品 | 60 |

### b2c_product_categories

| 欄位 | 型別 | 必填 | 用途／規則 |
|---|---|---:|---|
| product_id | uuid | 是 | 對應商品。 |
| category_id | uuid | 是 | 對應正式分類。 |
| is_primary | boolean | 是 | 商品主要分類；每項商品最多一個。 |
| sort_order | integer | 是 | 商品在該分類內的手動順序。 |
| created_at | timestamptz | 是 | 關聯建立時間。 |

商品與分類是多對多關係。例：「調味鯖魚」可有主要分類「魚類」，同時加入「調理食品」。

## 5. 商品圖片

### b2c_product_images

| 欄位 | 型別 | 必填 | 用途／規則 |
|---|---|---:|---|
| id | uuid | 是 | 圖片紀錄主鍵。 |
| product_id | uuid | 是 | 所屬商品。 |
| storage_path | text | 是 | Supabase Storage 內的檔案路徑，不直接儲存二進位圖片。 |
| image_role | text | 是 | `cover` 或 `detail`；每項商品最多一張封面圖。 |
| alt_text | text | 否 | 無障礙替代文字；上線前建議設為必填流程。 |
| sort_order | integer | 是 | 圖片順序，數字越小越前面。 |
| created_at／updated_at | timestamptz | 是 | 建立及更新時間。 |

圖片規則：

- 每項商品建議 1 張封面圖及 3–5 張細節圖。
- 第一版接受 JPEG、PNG、WebP，單檔上限 10 MiB。
- Storage bucket 使用 `b2c-media`；公開可讀，只有啟用中的管理員可新增、更新或刪除。
- 建議路徑格式：`products/{product-id}/{filename}`。

## 6. 食安與品質證書

### b2c_certifications

| 欄位 | 型別 | 必填 | 用途／規則 |
|---|---|---:|---|
| id | uuid | 是 | 證書主鍵。 |
| slug | text | 是 | 證書唯一識別。 |
| name | text | 是 | 證書或檢驗名稱。 |
| issuer | text | 否 | 發證／檢驗單位。 |
| description | text | 否 | 證書的通用補充說明。 |
| certificate_image_path | text | 否 | 證書圖片在 Storage 的路徑。 |
| is_active | boolean | 是 | 是否公開顯示。 |
| created_at／updated_at | timestamptz | 是 | 建立及更新時間。 |

### b2c_product_certifications

| 欄位 | 型別 | 必填 | 用途／規則 |
|---|---|---:|---|
| product_id | uuid | 是 | 對應商品。 |
| certification_id | uuid | 是 | 對應證書。 |
| certificate_number | text | 否 | 該商品的證書或報告編號。 |
| valid_from | date | 否 | 生效日期。 |
| valid_until | date | 否 | 到期日期，不得早於生效日期。 |
| note | text | 否 | 此商品專屬的補充文字。 |
| created_at | timestamptz | 是 | 關聯建立時間。 |

## 7. 標籤與 AND 篩選

既有 `b2c_tags` 與 `b2c_product_tags` 繼續使用。標籤用於特性與細分條件，不取代正式分類。

建議標籤群組：

- 品項細分：魚、蝦、蟹、貝類等。
- 料理方式：火鍋、香煎、氣炸等。
- 商品特色：高蛋白、親子友善等。
- 處理方式：即烹、調味等。

多標籤篩選採 AND 邏輯。例如同時選「魚」與「氣炸」，只顯示同時擁有兩個標籤的商品。

## 8. 前端資料介面建議

### ProductCard

```ts
type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: "TWD";
  shortDescription: string;
  inventoryStatus: "in_stock" | "out_of_stock";
  coverImage: {
    url: string;
    alt: string;
  } | null;
  tags: Array<{
    slug: string;
    name: string;
  }>;
};
```

### ProductDetail

```ts
type ProductDetailData = ProductCardData & {
  brand: string;
  specification: string;
  origin: string;
  storageMethod: string;
  description: string;
  foodSafetyInfo: string | null;
  qualityInfo: string | null;
  categories: Array<{
    slug: string;
    name: string;
    isPrimary: boolean;
  }>;
  images: Array<{
    url: string;
    alt: string;
    role: "cover" | "detail";
    sortOrder: number;
  }>;
  certifications: Array<{
    slug: string;
    name: string;
    issuer: string | null;
    description: string | null;
    imageUrl: string | null;
    certificateNumber: string | null;
    validUntil: string | null;
    note: string | null;
  }>;
};
```

## 9. 首頁商品排序建議

第一版建議採兩段邏輯：

1. 先取得 `is_featured = true` 的啟用商品，依 `featured_sort_order`、`published_at` 排序。
2. 若精選數量不足，再用其他啟用商品依 `published_at` 新到舊補足，並排除已選精選商品。

這樣平常不必逐筆維護，首頁會自然顯示新品；活動期間管理員仍可手動指定商品。

## 10. 公開資料與權限

匿名訪客與一般登入使用者只能讀取啟用中的：

- B2C 商品、正式分類及商品分類關聯。
- 標籤及商品標籤關聯。
- 商品圖片、證書及商品證書關聯。
- `b2c-media` 公開圖片。

公司、管理員、詢價、訂單、事件及實際庫存數量不可直接開放給前台。圖片異動僅允許 `app_admins` 中啟用的管理員。

## 11. 本版暫不處理

- 購物車、結帳、付款及正式訂單。
- B2CHelpWidget 完整功能。
- ERP 即時庫存同步。
- 多幣別售價與促銷價格。
- 商品規格變體，例如不同重量各自有價格與庫存。
- 完整後台管理介面。

## 12. 下一階段確認項目

在正式套用 Supabase 前，仍需確認：

1. 首頁預計固定顯示幾項商品，以及精選不足時是否一定由最新商品補足。
2. 「有庫存／售完」是否足夠，或需要「低庫存／補貨中」等更多狀態。
3. 商品說明是否需要富文字格式；第一版目前以純文字規劃。
4. 圖片是否由後台直接上傳，以及建議尺寸、裁切比例與壓縮規格。
5. 證書是多項商品共用，還是每項商品都上傳獨立證書圖片。
6. 誰是第一位 `app_admins` 管理員；未建立管理員前，任何一般帳號都不能上傳圖片。

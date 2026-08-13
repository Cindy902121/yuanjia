# B2C 商品展示資料完整性審查

- 審查日期：2026-08-10
- 審查對象：`docs/B2C商品展示資料.md` v1.0
- 結論：可作為 B2C 設計與測試案例草案；尚不可直接當成正式 seed 或正式商品資料來源。

## 1. 已具備的內容

原文件已涵蓋 12 筆商品、6 個分類、4 組標籤、商品描述、AND 篩選、無結果、缺漏欄位、ProductCard、ProductDetail、事件規格及 18 個驗收案例。作為 UI／UX 與前端討論文件，範圍相當完整。

元家官網目前可確認有魚類、蝦蟹類、貝類、軟體類、肉類與調理食品類等分類；藍鑽蝦仁、熟藍鑽蝦及熟帆立貝的部分產地、規格與產品特色也有官方頁面可核對：

- [元家產品分類](https://www.yens.com.tw/product.html)
- [藍鑽蝦／蝦仁／熟藍鑽蝦](https://www.yens.com.tw/category-%E8%97%8D%E9%91%BD%E8%9D%A6-yens-002-01.html)
- [熟帆立貝](https://www.yens.com.tw/category-%E7%86%9F%E5%B8%86%E7%AB%8B%E8%B2%9D-yens-003-02.html)
- [2025 業務產品型錄](https://www.yens.com.tw/proimages/catalogue.pdf)

## 2. 正式匯入前必須處理

### P0：資料與目前資料庫不一致

- 原文件設計 12 筆商品；目前 migration 與遠端盤點只有 5 筆，slug、品牌、分類與標籤內容不同。
- 文件內沒有可直接執行的 12 筆 SQL seed，也沒有 UUID／關聯表資料。
- 團隊需先決定「取代目前 5 筆」、「保留 5 筆並新增 12 筆」或「12 筆只作測試案例」。

### P0：文件引用在 GitHub 不存在

目前 repository 沒有文件中引用的 `PRD.md`、`FDD.md`、`元家網站_路由與權限規格.md` 與 `supabase-review/remote-schema-audit.md`；實際存在的是 `docs/route-and-permission-spec.md`。在缺少原始依據時，組員無法追溯部分規則。

文件也包含本機絕對路徑 `C:\Users\USER\Documents\ChatGPT\元家`，不應作為團隊文件的永久引用。

### P0：Draft migration 描述需要更新

原文件第 6.0 節表示三支新 migration 已在目前目錄，但它們實際只存在於尚未合併的 GitHub Draft PR #1，不在 `main` 或 `B2C`。

該段還把圖片欄位寫成 `image_type`，草案實際名稱是 `image_role`；`alt_text` 在草案中可為 null，並非 NOT NULL。正式合併 PR #1 前，不能把這些欄位視為已可使用。

### P0：商品卡內容和已確認需求衝突

先前已確認 ProductCard 主要顯示圖片、名稱、價格與標籤，品牌、規格等資料放在商品詳情頁。原文件第 7、10 節卻要求卡片顯示品牌、分類與規格，需由 A／B／C 再確認並統一。

### P0：分類仍是單一分類

已確認正式分類允許商品重複歸類，例如調理過的魚同時屬於「魚類」與「調理食品」。原文件 12 筆商品每筆只有一個分類，無法驗證多分類。

另外，產品欄位規格採用「調理食品」與 slug `prepared-food`；原文件使用「調理食品類」，名稱需要統一。

## 3. 建議補齊的產品資料

### P1：首頁與發布欄位

12 筆資料尚未逐筆定義：

- `currency`（第一版預計 `TWD`）
- `short_description`
- `is_featured`
- `featured_sort_order`
- `published_at`
- `is_active`

因此目前還不能直接測試「最新商品＋管理員手動精選排序」。

### P1：商品圖片

需求是每項商品 1 張封面圖及 3–5 張細節圖；原文件則以目前圖片全為 null 為基準。正式展示前至少需要逐筆補上：

- Storage path 或待上傳檔名
- `cover`／`detail` 角色
- alt 文字
- sort order
- 授權與來源狀態

### P1：證書資料

原文件只有「認證／品質」文字，尚未提供證書圖片、發證單位、證書編號、有效期間與商品關聯。

食品安全與認證不能只因企業具備某項認證，就推定每一項商品都具備同一證書。正式上線前，應取得產品或工廠層級的有效證明，再決定前台文字。元家官網可支持藍鑽蝦的 BAP 與蝦仁需預訂的 ASC 說明，但其他商品仍需逐項核對。

### P1：標籤與分類 slug

原文件有標籤顯示文字，但沒有完整 slug 對照；分類也缺少 slug。沒有穩定 slug，就無法直接建立 `/products/tags/[slug]` 與 `/products/categories/[slug]` 的種子關聯。

### P1：分析事件仍不可落地

文件提出的 card impression、card click、search no result、filter no result 尚未列入既有白名單；`analytics_events` 也沒有 metadata 欄位保存 tag slug、search term、result count、list name 與 position。這些事件應保留「待確認」狀態，不能當成已實作。

## 4. 文件內部需要統一

- 「無品牌時不保留空白」與「為了等高仍保留品牌行高度」互相矛盾，需擇一。
- 第 0 節把部分商品描述成只掛 1–2 個標籤群組，但 #4、#8 實際仍各有 3 個群組；建議改稱「部分標籤群組缺漏」。
- 第 4 節提到庫存為 0 時驗證加入購物車限制，但購物車本週不實作；這一項應只驗證「缺貨狀態」，不要驗證尚不存在的購物流程。
- 第 8.4 節建議放 disabled 購物車按鈕，容易造成假功能；若設計稿沒有強制要求，第一版建議先不顯示。
- ProductDetail 多圖、證書陣列及正式分類應以產品欄位規格的目標模型為準，舊 schema 僅作相容期說明。

## 5. 建議處理順序

1. 先由 A／B／C 決定 12 筆資料是否要正式成為 seed。
2. 統一 ProductCard 顯示欄位與分類名稱／slug。
3. 決定 PR #1 的 schema 草案是否採用，修正後再合併。
4. 補齊 12 筆商品的多分類、圖片、證書、首頁排序與發布欄位。
5. 產生可重複執行的 seed migration，先在測試環境驗證，不直接寫入正式 Supabase。
6. 完成圖片與食安證書來源審核後，才把資料狀態由 draft 改為 ready。

## 6. 完整度判定

| 面向 | 判定 |
|---|---|
| UI／UX 討論與驗收案例 | 完整 |
| ProductCard／ProductDetail 行為規格 | 大致完整，但有兩處需求衝突 |
| 搜尋、分類、標籤與空狀態 | 完整 |
| 與目前 GitHub／Supabase 對齊 | 不完整 |
| 可直接執行的 seed | 不完整 |
| 圖片與證書素材 | 不完整 |
| 正式商品與食安資訊 | 尚待逐項查證 |

因此，本文件應以「展示資料與元件規格草案」身分使用；在 P0 項目解決前，不應直接轉成正式資料庫 migration。

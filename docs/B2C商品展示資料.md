# 元家企業／宅鮮配整合網站 MVP

## B2C 商品展示資料（種子資料設計）

文件版本：v1.0
文件日期：2026-08-10
依據：`PRD.md` 6.1／6.3 商品資料規格、`FDD.md` 4.6／4.6.1 `b2c_products` 與標籤資料結構、`元家網站_路由與權限規格.md`
資料來源：參考元家企業官網 [www.yens.com.tw](https://www.yens.com.tw/) 之產品分類與品項內容（魚類／鮭魚系列、蝦蟹類／藍鑽蝦系列、貝類等），並依 MVP 展示需求改寫為具代表性的示範資料。

> 本文件的名稱、產地、規格、售價與庫存為 **MVP 展示用途**，非官網正式定價、正式庫存或完整商品清單。實際商品內容以正式商城與業務報價為準（對應 PRD 3.2「不納入 MVP」與 6.3「明確標示展示資料」原則）。

> Migration 狀態以 [Supabase migration 歷史整理](supabase-schema-alignment.md) 為準；本文件的 v1.0 商品型別與案例仍保留原始設計假設。

> **過期項目（2026-09-02）**：本文件原定的 12 筆 B2C 展示商品需求已過期，不再作為 MVP seed 或驗收商品數量；現行展示資料以 `supabase/seed.sql` 的 6 筆為準。本文件保留 12 筆內容，僅供歷史案例與 UI 測試參考。

---

## 0. 設計目的

依需求，本批展示商品資料刻意涵蓋以下測試面向：

| 測試面向 | 說明 | 對應商品 |
|---|---|---|
| 不同分類 | 涵蓋魚類、蝦蟹類、貝類、軟體類、肉類、調理食品類共 6 個分類 | 歷史 12 筆（已過期） |
| 相同標籤 | 兩筆商品標籤組合完全相同，驗證篩選會同時回傳兩者 | #2 輕鹽鮭魚切片、#3 柚香鹽麴鮭魚 |
| 不同標籤 | 同食材但不同料理／加工標籤，驗證篩選可正確區分 | #1、#2、#3、#9（同為鮭魚，標籤組合皆不同） |
| 多標籤商品 | 同時掛 3～4 個標籤群組 | #1、#2、#5、#6、#7、#9、#10、#11 |
| 少標籤／缺標籤商品 | 刻意只掛 1～2 個標籤群組，甚至完全不掛某群組 | #4（無加工方式標籤）、#8（無需求特性標籤）、#12（無食材／料理方式標籤） |
| 有／無部分選填資料 | 品牌、食品安全、認證／品質欄位刻意留白 | #3（無認證）、#4（無食安／認證）、#8（無品牌／認證）、#12（無食安／認證，庫存為 0） |
| 能測試 AND 篩選 | 多組同分類、同食材、不同料理方式的商品，可驗證多條件交集 | 見第 4 章篩選測試案例 |
| 能測試搜尋無結果 | 刻意不建立「牛肉」「起司」「羊肉」等品項，作為查無資料驗證用關鍵字 | 見第 4 章搜尋測試案例 |

---

## 1. 分類與標籤定義

### 1.1 商品分類（B2C category）

| 分類 | 說明 | 本批商品數 |
|---|---|---|
| 魚類 | 鮭魚、比目魚等魚類商品 | 5 |
| 蝦蟹類 | 蝦類商品 | 2 |
| 貝類 | 干貝、貝柱等商品 | 2 |
| 軟體類 | 花枝、烏賊等商品 | 1 |
| 肉類 | 雞肉等調理肉品 | 1 |
| 調理食品類 | 即食沙拉等加工調理食品 | 1 |

### 1.2 標籤群組與標籤清單（B2C tag groups，依 FDD 4.6.1）

| 標籤群組 | 標籤（本批使用） |
|---|---|
| 食材 | 鮭魚、比目魚、蝦、干貝、花枝、雞肉 |
| 料理方式 | 火鍋、煎／烤、氣炸、清蒸、煮湯、生食 |
| 需求特性 | 方便料理、少刺／無刺、高蛋白、適合小孩、份量剛好 |
| 加工方式 | 原味、調味、即食／即煮 |

標籤定義由開發團隊預先建立（不開放後台自由新增），本表僅列出歷史 12 筆展示商品實際套用的標籤值，符合 PRD 3.2／6.1 標籤治理原則；12 筆需求已過期。

---

## 2. 商品總表（12 筆，已過期歷史設計）

| # | Slug | 商品名稱 | 分類 | 品牌 | 售價 NT$ | 模擬庫存 | 單位 | 規格 | 產地 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | salmon-fillet-portion | 鮭魚菲力切塊 | 魚類 | 元家 | 320 | 50 | 包 | 150/200g／片，單片真空包裝 | 智利 |
| 2 | salted-salmon-steak | 輕鹽鮭魚切片 | 魚類 | 元家 | 280 | 40 | 包 | 300g／包，半月切片 | 原料挪威／智利，台灣加工分裝 |
| 3 | yuzu-koji-salmon | 柚香鹽麴鮭魚 | 魚類 | 元家 | 250 | 35 | 包 | 180g±15g／包 | 台灣 |
| 4 | greenland-halibut-fillet | 冰釣格陵蘭雪鰈菲力 | 魚類 | 元家 | 450 | 20 | 片 | 依尾重分切，單片真空包裝 | 格陵蘭 |
| 5 | blue-diamond-shrimp-peeled | 藍鑽蝦仁 | 蝦蟹類 | 元家 | 380 | 60 | 盒 | 真空包200g×3包／盒，31/40尾／磅 | 沙烏地阿拉伯 |
| 6 | cooked-blue-diamond-shrimp | 熟藍鑽蝦 | 蝦蟹類 | 元家 | 420 | 25 | 盒 | 1kg／盒（拆件販售） | 沙烏地阿拉伯 |
| 7 | hokkaido-scallop-sashimi | 北海道生食級干貝 | 貝類 | 元家×北光 聯名 | 680 | 15 | 盒 | 500g／盒，生食等級分級 | 日本北海道 |
| 8 | cooked-scallop | 熟帆立貝 | 貝類 | *（未填）* | 550 | 18 | 包 | 1kg／包 | 日本 |
| 9 | torched-salmon-trout-slice | 炙燒鮭鱒壽司切片 | 魚類 | 元家 | 320 | 30 | 盒 | 240g／盒（30片） | 越南 |
| 10 | squid-balls | 元家花枝丸 | 軟體類 | 元家 | 150 | 80 | 包 | 300g／包 | 台灣 |
| 11 | chicken-karaage | 顏師傅唐揚雞塊 | 肉類 | 顏師傅 | 180 | 45 | 包 | 500g／包 | 台灣（國產雞肉） |
| 12 | lobster-flavor-salad | 顏師傅龍蝦風味沙拉 | 調理食品類 | 顏師傅 | 129 | 0（缺貨） | 盒 | 150g×2盒 | 台灣 |

---

## 3. 規格、保存、食安／認證與標籤明細

| # | 商品名稱 | 保存方式 | 食品安全 | 認證／品質 | 食材標籤 | 料理方式標籤 | 需求特性標籤 | 加工方式標籤 |
|---|---|---|---|---|---|---|---|---|
| 1 | 鮭魚菲力切塊 | 冷凍 -18°C以下保存 | 邁向零檢出，通過重金屬與藥物殘留檢驗 | HACCP、ISO 22000 | 鮭魚 | 煎／烤、氣炸 | 少刺／無刺、高蛋白 | 原味 |
| 2 | 輕鹽鮭魚切片 | 冷凍 -18°C以下保存 | 無藥劑殘留，超越歐盟標準檢驗零檢出 | HACCP、ISO 22000 | 鮭魚 | 煎／烤 | 方便料理 | 調味 |
| 3 | 柚香鹽麴鮭魚 | 冷凍 -18°C以下保存 | 低鈉低鹽鹽麴醬調味 | *（未填）* | 鮭魚 | 煎／烤 | 方便料理 | 調味 |
| 4 | 冰釣格陵蘭雪鰈菲力 | 冷凍 -18°C以下保存 | *（未填）* | *（未填）* | 比目魚 | 煎／烤、清蒸 | 少刺／無刺 | *（未填）* |
| 5 | 藍鑽蝦仁 | 冷凍 -18°C以下保存 | 產銷履歷完整，批號可追溯 | ASC（預訂制） | 蝦 | 煮湯、火鍋 | 方便料理、高蛋白 | 原味 |
| 6 | 熟藍鑽蝦 | 冷凍 -18°C以下保存 | 通過 BAP 最佳水產養殖規範驗證 | BAP | 蝦 | 火鍋 | 方便料理、高蛋白 | 即食／即煮 |
| 7 | 北海道生食級干貝 | 冷凍 -18°C以下保存 | 生食級規格，日本原裝進口 | 產地直送溯源認證 | 干貝 | 生食 | 份量剛好 | 原味 |
| 8 | 熟帆立貝 | 冷凍 -18°C以下保存 | 加熱調理即食 | *（未填）* | 干貝 | 清蒸、煮湯 | *（未填）* | 即食／即煮 |
| 9 | 炙燒鮭鱒壽司切片 | 冷凍 -18°C以下保存 | 生食等級原料，可直接食用 | HACCP | 鮭魚 | 生食 | 方便料理 | 即食／即煮 |
| 10 | 元家花枝丸 | 冷凍 -18°C以下保存 | 無添加防腐劑 | *（未填）* | 花枝 | 火鍋、煮湯 | 適合小孩 | 即食／即煮 |
| 11 | 顏師傅唐揚雞塊 | 冷凍 -18°C以下保存 | 使用國產 CAS 認證雞肉 | CAS 台灣優良農產品 | 雞肉 | 氣炸、煎／烤 | 適合小孩、方便料理 | 調味 |
| 12 | 顏師傅龍蝦風味沙拉 | 冷藏 0–7°C保存，即開即食 | *（未填）* | *（未填）* | *（未填）* | *（未填）* | 方便料理、份量剛好 | 即食／即煮 |

### 商品描述（description）

1. **鮭魚菲力切塊**：鮭魚菲力去刺去鱗切塊，肉質細緻、油脂均勻，乾煎、氣炸、烤箱皆可快速上桌，適合家庭與輕食料理。
2. **輕鹽鮭魚切片**：北海道風味鹽漬手法，鹹香入味、半月切片方便料理，是家庭與零售通路的長銷款。
3. **柚香鹽麴鮭魚**：融合柚子清香與低鈉鹽麴醬調味，烤、煎、微波皆宜，兼顧美味與健康需求。
4. **冰釣格陵蘭雪鰈菲力**：全球頂級格陵蘭手釣雪鰈，肉質細白、油脂豐富，煎烤清蒸皆能呈現原始鮮甜。
5. **藍鑽蝦仁**：全世界鹽度最高的紅海海域養殖，純手工剝殼挑腸泥，肉質Q彈鮮甜，小包裝衛生方便。
6. **熟藍鑽蝦**：已完成熟成處理，解凍即可食用或加入火鍋，液態氮急速單凍鎖住鮮甜。
7. **北海道生食級干貝**：元家與北光聯名推出，專屬台灣最高品質規格，鮮甜多汁，適合生食或簡單炙燒。
8. **熟帆立貝**：已熟成處理的帆立貝，簡單加熱即可享用鮮甜貝肉，適合湯品與快炒料理。
9. **炙燒鮭鱒壽司切片**：炙燒表面鎖住油脂香氣，可用於壽司、丼飯與沙拉點綴，即開即食。
10. **元家花枝丸**：精選花枝漿手工製作，Q彈有嚼勁，適合火鍋、關東煮與湯品料理。
11. **顏師傅唐揚雞塊**：醬香入味的日式唐揚雞塊，氣炸或煎烤即可上桌，是全家共享的方便料理選擇。
12. **顏師傅龍蝦風味沙拉**：元家顏師傅品牌推出的即食風味沙拉，開封即可食用，適合輕食與野餐場合。

---

## 4. 篩選與搜尋測試案例建議

### 4.1 AND 篩選測試（多條件全部符合）

| 測試條件（AND） | 預期結果 | 驗證重點 |
|---|---|---|
| 食材＝鮭魚 | #1、#2、#3、#9（共 4 筆） | 單一標籤條件應回傳所有掛該標籤的商品 |
| 食材＝鮭魚 AND 加工方式＝調味 | #2、#3（共 2 筆） | 相同標籤組合商品應同時被篩出 |
| 食材＝鮭魚 AND 料理方式＝生食 | #9（僅 1 筆） | 同食材但不同料理方式標籤應被正確區分 |
| 食材＝比目魚 AND 加工方式＝調味 | 0 筆（無符合商品） | #4 未掛加工方式標籤，驗證「無符合商品」狀態 |
| 分類＝貝類 AND 料理方式＝生食 | #7（僅 1 筆） | 跨分類＋標籤交集 |
| 分類＝貝類 AND 料理方式＝火鍋 | 0 筆（無符合商品） | 分類正確但標籤不符時應回傳空結果 |
| 食材＝蝦 AND 需求特性＝高蛋白 | #5、#6（共 2 筆） | 同分類、同食材、不同加工方式仍可同時符合 |
| 需求特性＝適合小孩 | #10、#11（共 2 筆） | 跨分類（軟體類、肉類）標籤交集 |

### 4.2 搜尋無結果測試

- 建議測試關鍵字：`牛肉`、`起司`、`羊肉`、`鮪魚`——本批 12 筆商品皆未包含上述品項，可用於驗證商品列表「查無商品」與 API 空陣列回應（對應 PRD 6.4／9.1 驗收標準）。
- 亦可用不存在的標籤 slug（例如 `beef`）測試 `/products/tags/[slug]` 之「無符合商品」狀態。

### 4.3 缺漏欄位／邊界狀態測試

| 情境 | 對應商品 | 驗證重點 |
|---|---|---|
| 品牌欄位留白 | #8 熟帆立貝 | 商品卡／詳情頁在無品牌時仍可正常顯示 |
| 食品安全、認證欄位皆留白 | #4、#12 | 商品詳情頁對應區塊應可隱藏或顯示「無提供資料」 |
| 庫存為 0 | #12 顏師傅龍蝦風味沙拉 | 驗證「缺貨」狀態與加入購物車限制 |
| 完全未掛某標籤群組 | #4（無加工方式）、#8（無需求特性）、#12（無食材／料理方式） | 驗證商品詳情頁標籤區塊在部分群組無標籤時的呈現 |

---

## 5. 與正式資料的差異說明

- 本批資料原規劃 12 筆，用於驗證 MVP 資料結構、篩選與搜尋邏輯；12 筆需求已過期，不作為現行 seed 或驗收數量（現行 `supabase/seed.sql` 為 6 筆）。
- 售價、庫存為 MVP 展示用途，正式價格與庫存以正式商城與業務報價為準。
- 產地、規格、食安與認證文字改寫自元家企業官網公開產品介紹內容，用於呈現真實產業語彙與資料完整度，非逐字轉載官網文案。
- B2B 型錄（`b2b_products`）資料結構與本表不同（不含價格、改用產品編號與採購型描述），需另行設計，不在本文件範圍內。

---

## 6. 商品共用資料型別

### 6.0 資料來源、優先順序與已知落差（請先讀本節）

本文件依下列優先順序判斷欄位與命名，發生衝突時以「已套用資料庫 schema」為第 6～10 章型別定義的實作基準，同時保留原有衝突敘述，不自行覆寫：

1. 已套用 Supabase 資料庫 schema／migration（目前 active history 的 baseline／security migration；原始 foundation／demo SQL 保留於 `supabase/migrations_archive/legacy/`，以 `supabase-review/remote-schema-audit.md`〔2026-08-10 唯讀稽核〕核對遠端實際狀態）
2. 專案 TypeScript 型別與查詢程式 — 目前專案（`C:\Users\USER\Documents\ChatGPT\元家`）僅有 `src/app/layout.tsx`、`src/app/page.tsx`（皆為 `create-next-app` 預設樣板，未修改）與 `src/lib/supabase/client.ts`（僅建立瀏覽器端 client）。**沒有任何 `ProductCard`、`ProductDetail`、商品查詢函式、View Model 型別或 analytics 事件程式碼**，因此本文件第 6～10 章是這個範圍的第一份定義依據，不存在需要對齊的既有程式命名。
3. `PRD.md`、`FDD.md`、`元家網站_路由與權限規格.md`
4. 本文件第 0～5 章
5. 現有網頁實際呈現內容 — 專案首頁目前仍是預設樣板頁，尚無商品頁面可比對
6. 元家企業官網公開商品資料（www.yens.com.tw）

檢查結果：本文件第 0～5 章與已套用資料庫 schema／種子資料之間存在下列落差。12 筆 B2C 展示商品需求已標示為過期；原則上以資料庫 schema 與現行 seed 為準設計第 7～10 章型別與規則，歷史 12 筆內容僅供案例參考。

| 編號 | 落差位置 | 內容 | 目前採用依據 | 待團隊確認事項 |
|---|---|---|---|---|
| C1 | 商品筆數與內容（已過期） | 本文件第 2、3 章的 12 筆展示商品需求已過期；現行 `supabase/seed.sql` 以 6 筆展示資料為準，歷史 12 筆的 slug、分類、標籤與現行資料不同 | 型別定義（第 6～8 章）與現行資料庫 schema／seed 對齊；12 筆內容只保留作歷史案例 | 不再更新 migration／seed 以符合本文件 12 筆設計 |
| C2 | 「食材」標籤語意 | 本文件「食材」標籤為魚種細節（鮭魚、比目魚、蝦、干貝、花枝、雞肉）；資料庫「食材」群組標籤實際值是分類本身的複本（魚類、蝦類、貝類） | 沿用資料庫現況作為型別範例，並在型別中註明 `groupName` 是自由文字、`name` 語意由團隊決定 | 「食材」標籤要細到魚種，還是等同分類；決定後需同步調整 `b2c_tags` 種子資料 |
| C3 | 料理方式／需求特性／加工方式標籤詞彙 | PRD 5.3.2 定義料理方式 6 選項、需求特性 5 選項，本文件沿用；資料庫已實作完整料理方式 6 個、需求特性 5 個、加工方式 3 個（原味、即煮、調味） | 型別中 `name`／`slug` 均為 `string`，不假設固定 enum 值 | 已依固定題目補齊；後續新增詞彙需同步 seed 與契約測試 |
| C4 | 「單位」＋「規格」vs 單一 `specification` | 本文件第 2、3 章展示表格把「單位」「規格」拆兩欄；資料庫 `b2c_products` 只有單一 `specification text not null` 欄位（已內含單位，如 `"200g/包"`） | 第 6 章型別只定義一個 `specification: string` 欄位，對應資料庫；不新增 `unit` 欄位 | 是否要新增 `unit` 獨立欄位（需 migration），或維持單一字串由前端整段顯示 |
| C5 | 「認證／品質」結構化程度 | 本文件把「認證／品質」寫成類似清單的字串（如 `"HACCP、ISO 22000"`）；資料庫只有單一可為 `null` 的自由文字 `quality_info`，沒有 `certifications` 陣列或 `qualityHighlights` 結構 | 型別維持 `qualityInfo: string \| null` 單一欄位；如需陣列，前端可用「、」「，」切字串僅供顯示，不當作穩定資料結構 | 是否新增 `certifications text[]` 或另建資料表，才能做到結構化的認證清單 |
| C6 | 商品圖片 | 需求要求「商品圖片陣列」「alt」「isPrimary」「sortOrder」；目前遠端已由 `20260825024950_add_admin_catalog_media_and_management.sql` 建立 `b2c_product_images` 與 `b2c-media` bucket，`b2c_products.image_path` 保留為 legacy 欄位 | `images: ProductImage[]` 型別仍保留；正式查詢應 join `b2c_product_images`，`alt`／`isPrimary`／`sortOrder` 對應資料表欄位與 mapper | 商品圖片資料與前端 mapper 尚需依目前圖片表接線；分類與認證仍未由本次 migration 建立 |
| C7 | 品牌可否留白 | 本文件 #8 熟帆立貝標示品牌「（未填）」；資料庫 `brand text not null`（沒有 NULL，但沒有非空白 CHECK） | `brand: string`（非 `string \| null`）；「未填」情境須落地為空字串 `''`，不是資料庫 `NULL` | 屬型別澄清，不需團隊確認；僅需開發時留意 |
| C8 | 分類（category）沒有獨立資料表 | 路由規格已定義 `/products/categories/[slug]`，需要分類的 slug；資料庫沒有 `categories` 資料表，`b2c_products.category` 只是自由文字（如 `"魚類"`），沒有對應 slug | 型別提供 `categorySlug: string \| null`，由前端暫時用固定對照表（slugify）推導，找不到對照時為 `null` | 是否新增 `categories` 資料表（含 `id`／`name`／`slug`），或改由後端在查詢時一併回傳 slug |
| C9 | 「商品不存在」與「商品已下架」在前台無法區分 | 需求要求分別定義兩種狀態的顯示規則；`b2c_products` 的 RLS 只允許 `anon`／`authenticated` 讀到 `is_active = true` 的商品（見 `20260812150001_establish_mvp_security_contract.sql` policy「b2c_active_products_public_read」），`is_active = false` 的商品用公開查詢會直接查不到，效果等同不存在 | `ProductDetailState` 的 `not_found` 分支同時涵蓋「slug 不存在」與「商品已下架」；只有走 service role／未來 Admin API 的查詢才能區分並顯示「已下架」徽章 | 屬型錄前台 RLS 設計下的結果；如果要讓 B2C 前台顯示「已下架」而非「找不到」，需要另開一支允許讀 inactive 商品的伺服器端 API，不在本次範圍 |
| C10 | `analytics_events` 欄位不足以保存本次建議的事件參數 | 需求要求評估 `product_slug`、`product_name`、`category_slug`、`tag_slug`、`search_term`、`result_count`、`list_name`、`position` 等參數；已套用的 `analytics_events` 資料表欄位只有 `event_name`、`surface`、`product_reference`(uuid)、`product_category`、`product_brand`、`customer_tier_snapshot`、`channel_snapshot`、`occurred_at`，**沒有** `metadata jsonb`（FDD 4.8 原設計有此欄位，但未被實作）、也沒有上述其餘參數對應的欄位 | 第 9 章事件表格仍列出完整建議參數供前端記錄／回報，但逐一標示哪些參數今天送到伺服器也無處可存 | 是否要新增 `metadata jsonb`（呼應 FDD 4.8 原設計）或個別新增欄位；事件 API（`POST /api/analytics/events`，FDD 6.7）目前也尚未建立 |
| C11 | 「商品不存在」「商品已下架」文案未定 | PRD／FDD 只定義「無符合商品」（篩選／搜尋空結果）字串；沒有定義單一商品 404 或下架時的頁面文案 | 第 8 章暫定「找不到這項商品」「此商品目前已下架」 | **2026-09-01 已確認**：採用第 8 章暫定文案作為正式版本，不再另行調整 |

> **Migration 歷史整理（2026-08-27）**：`20260810161047`／`20260810161048`／`20260810161049` 與 `20260819074622` 已移至 `supabase/migrations_archive/legacy/`，因為它們不在遠端 migration history。遠端目前採用 `20260825024950_add_admin_catalog_media_and_management.sql` 建立商品圖片與 Storage；`b2c_categories`、`b2c_certifications` 及 featured 欄位仍不是目前遠端 MVP schema 的一部分。詳見 `docs/supabase-schema-alignment.md`。

### 6.1 資料庫列型別（DB Row Types）

Supabase-js 的查詢結果預設直接回傳資料庫原始欄位名稱（snake_case），不會自動轉成 camelCase。以下型別逐欄對應已套用的 `b2c_products`／`b2c_tags`／`b2c_product_tags`（見 `supabase/migrations/20260812150000_baseline_remote_schema.sql`），供查詢層（server component／route handler）使用；**元件不要直接吃這個型別**，一律先經過 6.3 的 Mapper 轉成 6.2 的 View Model。

```ts
/** 對應 public.b2c_products，欄位與型別逐一比對已套用 schema。 */
interface B2cProductRow {
  id: string;                       // uuid，必填
  slug: string;                     // 必填，唯一，non-blank
  name: string;                     // 必填
  brand: string;                    // 必填（NOT NULL；可能是空字串 ''，不會是 null，見 C7）
  category: string;                 // 必填，自由文字（無 categories 資料表，見 C8）
  specification: string;            // 必填，單一欄位已內含單位，如 "200g/包"（見 C4）
  price: number;                    // 必填，numeric(10,2)，>= 0
  origin: string;                   // 必填
  storage_method: string;           // 必填，單一欄位已內含溫度，如 "冷凍 -18°C 以下"
  description: string;              // 必填
  food_safety_info: string | null;  // 選填
  quality_info: string | null;      // 選填（對應本文件「認證／品質」，見 C5）
  mock_inventory: number;           // 必填，integer，>= 0，預設 0，不會是 null
  image_path: string | null;        // legacy 選填欄位；多圖改由 `b2c_product_images` 提供（見 C6）
  is_active: boolean;               // 必填；anon／authenticated 查詢已被 RLS 過濾成恆為 true（見 C9）
  created_at: string;               // timestamptz，ISO 字串
  updated_at: string;               // timestamptz，ISO 字串
}

/** 對應 public.b2c_tags。沒有獨立的 tag_groups 資料表，group_name 是每筆標籤上的自由文字欄位。 */
interface B2cTagRow {
  id: string;
  group_name: string;   // 必填，non-blank；例如 "食材"、"料理方式"、"需求特性"、"加工方式"
  slug: string;          // 必填，唯一
  name: string;          // 必填
  is_active: boolean;    // 必填
  created_at: string;
  updated_at: string;
}

/** 對應 public.b2c_product_tags（多對多關聯表，複合主鍵）。 */
interface B2cProductTagRow {
  product_id: string;
  tag_id: string;
}
```

### 6.2 前端 View Model 型別（元件實際使用）

```ts
/** 商品圖片。今天 images 陣列長度只會是 0（見 C6），型別提前設計成陣列以相容未來多圖。 */
interface ProductImage {
  src: string;          // 已解析好的可顯示網址；沒有 legacy image_path 或圖片 row 時交給元件顯示佔位圖
  alt: string;           // 規則見 7.3／8.2
  isPrimary: boolean;    // 今天恆為 true（最多一張圖）；保留給未來多圖排序使用
  sortOrder: number;     // 今天恆為 0；保留給未來多圖排序使用
}

/** 單一標籤（供卡片顯示，不分群組）。 */
interface ProductCardTag {
  id: string;
  slug: string;
  name: string;
  groupName: string;     // 例如 "食材"；語意見 C2
}

/** 依群組分組後的標籤（供詳情頁顯示）。沒有任何標籤的群組不會出現在陣列中（見 8.3）。 */
interface ProductDetailTagGroup {
  groupName: string;
  tags: { id: string; slug: string; name: string }[];
}

/** 庫存狀態，由 mockInventory 衍生，不是資料庫欄位。 */
type StockStatus = "in_stock" | "out_of_stock";

function toStockStatus(mockInventory: number): StockStatus {
  return mockInventory > 0 ? "in_stock" : "out_of_stock";
}

/** ProductCard 使用的最小必要資料。 */
interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  brand: string;                  // 可能是 ''，元件自行處理顯示（見 7.4）
  category: string;               // 顯示文字，例如 "魚類"
  categorySlug: string | null;    // 見 C8；null 時分類不可點擊
  price: number;
  specification: string;
  mockInventory: number;
  stockStatus: StockStatus;
  image: ProductImage | null;
  tags: ProductCardTag[];         // 可能是空陣列
}

/** ProductDetail 使用的完整資料。只在 status === "ready"（或 Admin 情境 "inactive"）時存在，見 8.1。 */
interface ProductDetailData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string | null;
  price: number;
  specification: string;
  origin: string;
  storageMethod: string;
  description: string;
  foodSafetyInfo: string | null;
  qualityInfo: string | null;
  mockInventory: number;
  stockStatus: StockStatus;
  images: ProductImage[];              // 今天長度恆為 0，型別仍保留陣列（見 C6）
  tagGroups: ProductDetailTagGroup[];  // 空群組不列入，見 8.3
}
```

必填／選填／可為 `null`／陣列對照表：

| 欄位（View Model） | 對應資料庫欄位 | 必填 | 可為 `null` | 陣列 | 備註 |
|---|---|---|---|---|---|
| `id`／`slug`／`name` | 同名 | 是 | 否 | 否 | — |
| `brand` | `brand` | 是（型別上必填） | 否（可能是 `''`） | 否 | 見 C7 |
| `category` | `category` | 是 | 否 | 否 | 自由文字，見 C8 |
| `categorySlug` | 無對應欄位 | 否 | 是 | 否 | 前端推導，見 C8 |
| `price` | `price` | 是 | 否 | 否 | `>= 0`，資料庫已保證 |
| `specification` | `specification` | 是 | 否 | 否 | 已內含單位，見 C4 |
| `origin` | `origin` | 是 | 否 | 否 | 僅 `ProductDetailData` |
| `storageMethod` | `storage_method` | 是 | 否 | 否 | 僅 `ProductDetailData` |
| `description` | `description` | 是 | 否 | 否 | 僅 `ProductDetailData` |
| `foodSafetyInfo` | `food_safety_info` | 否 | 是 | 否 | 僅 `ProductDetailData` |
| `qualityInfo` | `quality_info` | 否 | 是 | 否 | 僅 `ProductDetailData`；對應本文件「認證／品質」，見 C5 |
| `mockInventory` | `mock_inventory` | 是 | 否 | 否 | 一律是數字，不會是 `null` |
| `stockStatus` | 無對應欄位 | 是 | 否 | 否（enum） | 由 `mockInventory` 衍生 |
| `image`／`images` | `image_path` | 是（欄位一定存在，但可能是 `null`／空陣列） | `image`：是；`images`：否（用空陣列表示無圖） | `images` 是 | 見 C6 |
| `tags`／`tagGroups` | 經 `b2c_product_tags` join | 是（欄位一定存在，可能是空陣列） | 否 | 是 | 見 8.3 |

### 6.3 DB → View Model 轉換（Mapper）規格

資料庫回傳的資料列不會直接符合元件 Props，需要一層 Mapper：

- `mapProductRowToCardData(row: B2cProductRow, tags: B2cTagRow[]): ProductCardData`
  - `brand`／`category`／`specification` 等原樣帶過
  - `stockStatus = toStockStatus(row.mock_inventory)`
  - `categorySlug = lookupCategorySlug(row.category)`（暫定的前端固定對照表，找不到回傳 `null`，見 C8）
  - `image = row.image_path ? { src: resolveImageUrl(row.image_path), alt: buildProductAlt(row), isPrimary: true, sortOrder: 0 } : null`
  - `tags = tags.map(tag => ({ id: tag.id, slug: tag.slug, name: tag.name, groupName: tag.group_name }))`
- `mapProductRowToDetailData(row: B2cProductRow, tags: B2cTagRow[]): ProductDetailData`
  - 邏輯同上，另外把 `tags` 依 `group_name` 分組成 `tagGroups`，**群組內沒有標籤就整組省略**（不要輸出 `{ groupName: "加工方式", tags: [] }`，見 8.3）
  - `images = row.image_path ? [{ src: resolveImageUrl(row.image_path), alt: buildProductAlt(row), isPrimary: true, sortOrder: 0 }] : []`
- `resolveImageUrl(path: string): string` — 依 `b2c-media` bucket 解析 legacy `image_path`；多圖實作應直接使用 `b2c_product_images.storage_path`（見 C6）
- `buildProductAlt(row): string` — 規則見 7.3／8.2

以上是規格與函式簽章建議，不是最終實作；實際程式碼由負責串接查詢的組員撰寫。

---

## 7. ProductCard 元件介面

### 7.1 `ProductCardProps`

```ts
interface ProductCardProps {
  /** 卡片顯示所需的完整資料；不接受 undefined，缺資料由父層的清單狀態處理（見 7.2）。 */
  product: ProductCardData;

  /** 是否優先載入圖片（例如第一屏 above-the-fold 卡片），對應 next/image 的 priority。可選，預設 false。 */
  priority?: boolean;

  /** 這張卡片所在的清單名稱，供分析事件使用（見 §9）；待團隊確認資料庫是否能保存，見 C10。可選。 */
  listName?: string;

  /** 這張卡片在清單中的 0-based 位置，供分析事件使用；待團隊確認資料庫是否能保存，見 C10。可選。 */
  position?: number;

  /** 卡片是否標示「推薦」徽章。資料庫沒有 is_featured 欄位，此值必須由呼叫端（頁面／清單容器）指定，不會從 product 自動推導。可選，預設 false。 */
  featured?: boolean;

  /**
   * 卡片點擊時的附加行為（例如送出分析事件）。元件仍使用真正的 <Link href="/products/[slug]" />
   * 導覽（見 7.5），onCardClick 在 onClick 中被呼叫但不 preventDefault，用於副作用，不是用來取代導覽。
   */
  onCardClick?: (product: ProductCardData) => void;

  /** 標籤點擊時的附加行為，用法同上；預設導覽固定為 /products/tags/[slug]。 */
  onTagClick?: (tag: ProductCardTag) => void;

  className?: string;
}
```

### 7.2 卡片最小必要資料／不應傳入卡片的資料

- **必要**：`product.id`、`slug`、`name`、`brand`、`category`、`price`、`specification`、`mockInventory`／`stockStatus`。這些是 `ProductCardData` 的必填欄位，元件不需要再處理「這欄位可能整個不存在」的情況（只需處理空字串／`null`／空陣列，見 7.4）。
- **不應傳入卡片**：
  - `origin`、`storageMethod`、`description`、`foodSafetyInfo`、`qualityInfo` — 這些只在 `ProductDetailData` 才有，卡片不顯示，也不需要接收，避免卡片元件承擔跟詳情頁一樣的資料量。
  - 清單容器的載入／錯誤／空結果狀態（`loading`／`error`／`empty`／`ready`）— 屬於清單容器（列表頁、標籤頁、篩選結果）的狀態，`ProductCard` 只在容器狀態為 `ready` 時、針對陣列中每一筆資料被呼叫一次；skeleton、錯誤訊息、「無符合商品」由容器負責渲染，不是 `ProductCard` 的 props。
  - `is_active` 原始欄位 — anon 查詢已被 RLS 過濾為恆 true（見 C9），卡片不需要也不應該收到這個欄位去自行判斷要不要顯示。

### 7.3 商品圖片規格與 alt 規則

- 圖片統一透過 `next/image`（專案首頁已使用此元件，見 `src/app/page.tsx`），固定顯示比例（例如 1:1），避免版面跳動。
- `product.image !== null`：`alt = product.image.alt`，格式固定為 `${name}商品圖`（例如「鮭魚菲力切塊商品圖」），不重複帶出品牌／分類避免過度冗長。
- `product.image === null`（**目前所有商品的常態**，見 C6）：顯示固定佔位圖／icon，`alt=""` 且加上 `aria-hidden="true"` — 因為佔位圖不承載資訊，商品名稱已經由旁邊的文字傳達，重複朗讀「無圖片」對螢幕閱讀器使用者沒有幫助。
- 圖片載入失敗（`onError`）：以相同的佔位圖取代，`alt` 同樣清空為 `""` 並標記 `aria-hidden`，並保留原本的圖片容器尺寸（避免 CLS）。

### 7.4 顯示規則

| 情境 | 規則 |
|---|---|
| 品牌為空字串 `''` | 不顯示品牌列／品牌徽章，其餘版面不留空白間距 |
| 沒有圖片（`image === null`） | 顯示固定佔位圖（見 7.3），版面尺寸與有圖片時一致 |
| 圖片載入失敗 | 以佔位圖取代，不顯示破圖圖示，不跳出錯誤訊息 |
| 沒有標籤（`tags.length === 0`） | 不顯示標籤列，不顯示「無標籤」文字 |
| 標籤過多 | 最多顯示 **3 個**標籤；超過時顯示「+N」（N = 剩餘數量），不換行擠壓卡片高度；完整標籤清單只在詳情頁顯示 |
| 庫存為 0（`stockStatus === "out_of_stock"`） | 卡片右上角或圖片上顯示「缺貨」徽章；卡片本身仍可點擊進入詳情頁（瀏覽不等於購買，購物車邏輯本次不實作，見第四節「修改限制」與 8.4） |
| 缺少價格 | 資料庫 `price` 為 `NOT NULL`，理論上不會缺漏；元件仍需防禦式處理 `price` 為 `NaN`／負值等異常情況，顯示「價格洽詢」而非 `NT$0` 或 `NaN` |
| 商品 `is_active = false` | 不會發生在 anon 查詢的卡片清單中（RLS 已過濾，見 C9）；卡片元件不需要處理這個狀態 |
| `featured === true` | 顯示「推薦」徽章；此值來自呼叫端指定，不是 `product` 資料本身的欄位 |
| 商品名稱過長 | 固定顯示 **2 行**，超過以 `line-clamp` 省略號截斷，完整名稱放在 `title` 屬性 |
| 卡片高度與文字行數一致 | 名稱固定 2 行高度、品牌固定 1 行高度（為空時該行區域仍保留高度但不顯示文字，用空白占位而非移除該行），確保同一排卡片等高，不因內容多寡而錯位 |

### 7.5 互動規則

- **卡片整體點擊 → `/products/[slug]`**：實作採用「stretched link」模式，`<article>` 內用一個真正的 `<a>`／Next.js `<Link>` 包住商品名稱，並用 CSS 讓這個連結的可點擊區域延伸覆蓋整張卡片（例如連結加上 `after:absolute after:inset-0`）。**不要**把整張卡片包在最外層 `<a>` 或加上 `role="button"` 的 `<div onClick>`：那樣會讓圖片、名稱、標籤全部落在同一個可點擊區塊內，鍵盤與螢幕閱讀器操作標籤會有困難，也容易做出無效的巢狀 `<a>`。
- **點擊商品名稱**：等同點擊卡片整體（因為名稱本身就是那個真正的連結），導向 `/products/[slug]`。
- **點擊標籤 → `/products/tags/[slug]`**：標籤是獨立的 `<Link>`，用較高的 `z-index`／`position: relative` 疊在 stretched link 之上，讓標籤自己的可點擊區域優先於卡片的延伸點擊區。
- **點擊標籤時不可同時觸發卡片跳轉**：因為標籤連結與卡片連結是兩個不重疊冒泡的真實 `<a>`，瀏覽器只會 follow 使用者實際點到的那一個，不需要 `event.stopPropagation()`；**不要**用 `onClick` 手動 `preventDefault` 再手動 `router.push`，那樣反而容易漏接鍵盤事件。
- **鍵盤 Enter／Space**：因為卡片與標籤都是真正的 `<a>` 元素，`Enter` 原生就會觸發導覽，不需要自行攔截；`<a>` 原生不對 `Space` 做導覽動作，符合連結（非按鈕）的預期行為，**不要**額外綁定 `Space` 觸發跳轉。
- **focus 狀態**：卡片連結與每個標籤連結都要有清楚可見的 `:focus-visible` 外框，不可只用顏色變化表示（對應 PRD 8.2「不以顏色作為唯一狀態訊息」）；Tab 順序為：卡片主連結（名稱／整卡）→ 各標籤（依畫面顯示順序）。
- **避免重複朗讀**：卡片內只有一個「主要」可聚焦連結（名稱／整卡的 stretched link），圖片不是連結、`alt` 依 7.3 規則清空或給出簡短說明，避免同一張卡片的圖片、名稱、隱形整卡連結被螢幕閱讀器唸出三次重複的商品名稱。

---

## 8. ProductDetail 元件介面

### 8.1 `ProductDetailProps`

`ProductDetail` 是純展示元件，只負責畫面，不自己 fetch 資料；由呼叫它的頁面（`/products/[slug]`）決定目前處於哪個狀態並傳入 `state`。

```ts
type ProductDetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  /**
   * slug 不存在，或商品已下架（is_active = false）。
   * 這兩種資料庫實際狀態在 anon 查詢下無法區分（見 C9），B2C 前台一律顯示同一種「找不到商品」畫面。
   */
  | { status: "not_found" }
  /**
   * 僅限 Admin／未來允許讀取 inactive 商品的情境使用；一般 B2C 前台不會拿到這個狀態（見 C9）。
   */
  | { status: "inactive"; product: ProductDetailData }
  | { status: "ready"; product: ProductDetailData };

interface ProductDetailProps {
  state: ProductDetailState;

  /** 標籤點擊；不傳時預設導向 /products/tags/[slug]。 */
  onTagClick?: (tag: { slug: string; name: string }) => void;

  /** 分類點擊；categorySlug 為 null 時不應該渲染成可點擊元素，這個 callback 也不會被呼叫（見 C8）。 */
  onCategoryClick?: (categorySlug: string) => void;

  /** 圖片切換（多圖情境預留，見 8.2）；今天最多只有 1 張圖，這個 callback 實務上不會被觸發。 */
  onImageChange?: (index: number) => void;

  className?: string;
}
```

購物車／加入詢價／數量選擇 **明確不在本次範圍**（見「修改限制」與 PRD 目前 B2C 週期規劃）。本介面刻意不定義 `onAddToCart`、`quantity` 等欄位；未來若要擴充，建議在 `ProductDetailProps` 新增一個獨立的可選 `actions?: { addToCart?: (...) => void }` 區塊，不要把購物車邏輯混進現有欄位。

### 8.2 商品圖片陣列規格

- `product.images: ProductImage[]`，型別上是陣列；本文件原始 seed 案例沒有圖片 row 時維持空陣列（見 C6）。
- **只有一張圖時**（未來情境）：不顯示縮圖列／切換控制項，直接顯示這張圖。
- **有多張圖時**（未來情境，目前不會發生）：顯示主圖＋縮圖列，`isPrimary: true` 的那張預設顯示；縮圖需可用鍵盤（方向鍵或 Tab＋Enter）切換，切換時呼叫 `onImageChange`。
- **圖片不存在**（`images.length === 0`，**目前的必然情況**）：顯示固定佔位圖，`alt=""` 且 `aria-hidden="true"`（理由同 7.3）。
- **圖片載入失敗**：以佔位圖取代，不顯示破圖圖示。

### 8.3 顯示規則

| 情境 | 規則 |
|---|---|
| 品牌為空字串 | 不顯示品牌列 |
| `foodSafetyInfo === null` | 不顯示「食品安全」區塊（整塊隱藏，不顯示「無提供資料」等佔位文字，避免版面出現大量空區塊） |
| `qualityInfo === null` | 不顯示「認證／品質」區塊，理由同上 |
| 某個標籤群組沒有資料 | 該群組整個不出現在 `tagGroups`（由 Mapper 在轉換階段就濾掉，見 6.3），詳情頁不需要另外判斷「這個群組是空的要不要顯示標題」 |
| `stockStatus === "out_of_stock"` | 顯示「缺貨」提示區塊；不隱藏商品其餘資訊（規格、產地、保存方式等展示內容仍完整顯示） |
| `state.status === "not_found"` | 顯示「找不到這項商品」（正式文案，2026-09-01 已確認，見 C11），提供返回商品列表的連結；設定對應的 HTTP 狀態（Next.js 內建 `notFound()`），並確保頁面 `noindex` |
| `state.status === "inactive"` | 僅 Admin 情境；顯示「已下架」徽章（正式文案，2026-09-01 已確認，見 C11）＋商品完整資料，供後台檢視 |
| `state.status === "loading"` | 顯示骨架屏（skeleton），維持與 `ready` 狀態相近的版面高度，避免載入完成後版面跳動 |
| `state.status === "error"` | 顯示通用錯誤訊息＋重試按鈕；不直接顯示原始錯誤字串／stack 給使用者，`message` 供除錯／日誌使用 |

### 8.4 Callback／預留擴充點

- `onTagClick`、`onCategoryClick` 為本次唯一需要的互動 callback。
- 購物車、數量選擇、加入詢價、結帳入口：**本次不實作**。如果設計稿已經在詳情頁放了「加入購物車」按鈕位置，元件可以先渲染一個 disabled 或純視覺佔位的按鈕，但不接任何 props、不觸發任何邏輯，待未來週期再定義 `actions` 擴充點（見 8.1）。

---

## 9. 元件事件規格

### 9.1 現有事件命名規則

專案程式碼中沒有任何既有的事件追蹤實作（見 6.0）。命名規則採用 **FDD.md 6.7 已定義的白名單事件清單**（`b2c_*` 前綴、snake_case），這是目前唯一已經被三人團隊確認過的事件命名依據，優先沿用；清單中沒有對應項目時，才提出新事件名稱並標記「待團隊確認」。

FDD 6.7 已列入白名單、與本次商品卡／詳情頁相關的既有事件：`b2c_product_view`、`b2c_search_category`、`b2c_tag_click`、`b2c_tag_view`。

另外，`POST /api/analytics/events`（FDD 6.7）目前**尚未實作**（專案程式碼中不存在），且其伺服器規則明確「只接受白名單內事件」，因此下表所有「待新增」事件在白名單與 API 實際完成前都無法真正送達伺服器。

### 9.2 事件對照表

| 事件名稱 | 是否在 FDD 6.7 白名單 | 觸發時機 | 觸發元件／頁面 | 必要參數 | 選填參數 | 範例 payload | 是否需要避免重複觸發 |
|---|---|---|---|---|---|---|---|
| `b2c_product_card_impression`（**待新增**） | 否 | 商品卡首次進入可視區域（IntersectionObserver） | `ProductCard`（由清單容器統一觸發，非卡片自己 fire） | `product_id` | `list_name`、`position` | `{ "event_name": "b2c_product_card_impression", "product_id": "baf63df4-...", "list_name": "products-grid", "position": 3 }` | 需要：同一次頁面停留內，同一 `product_id`＋`list_name` 只送一次；捲動離開再進入不重複觸發（待團隊確認是否要改成每次進入都送） |
| `b2c_product_card_click`（**待新增**） | 否 | 使用者點擊商品卡（含點名稱／stretched link 觸發跳轉的當下） | `ProductCard` | `product_id`、`product_slug` | `list_name`、`position` | `{ "event_name": "b2c_product_card_click", "product_id": "baf63df4-...", "product_slug": "norwegian-salmon-fillet", "position": 3 }` | 需要：防止同一次點擊因事件冒泡送出兩次；每次真正點擊仍各自送出（不去重使用者動作） |
| `b2c_product_view` | 是 | 商品詳情頁載入完成（`state.status === "ready"`） | `/products/[slug]` 頁面（非 `ProductDetail` 自己觸發，避免元件重渲染重複送出） | `product_id` | — | `{ "event_name": "b2c_product_view", "surface": "b2c", "product_reference": "baf63df4-...", "product_category": "魚類", "product_brand": "宅鮮配" }` | 需要：依 `slug` 變化時觸發一次，同一 slug 重渲染不重複送出 |
| `b2c_search_category`（分類篩選用途） | 是 | 使用者點擊分類進入 `/products/categories/[slug]` 或在列表頁套用分類篩選 | 商品列表頁／分類頁容器 | `category_slug` | `list_name` | `{ "event_name": "b2c_search_category", "surface": "b2c", "product_category": "魚類" }` | 需要：已在該分類的重複點擊不重複送出 |
| `b2c_search_category`（關鍵字搜尋用途） | 是 | 使用者送出搜尋關鍵字（防抖動後或按下 Enter／搜尋鈕） | 商品列表頁搜尋框 | `search_term` | `result_count` | `{ "event_name": "b2c_search_category", "surface": "b2c" }`（`search_term`／`result_count` 目前無欄位可存，見下方對應表） | 需要：防抖動或明確送出時才送，避免每個按鍵都觸發（確切防抖間隔待團隊確認） |
| `b2c_tag_click` | 是 | 使用者點擊商品卡或詳情頁上的標籤 | `ProductCard`、`ProductDetail` | `tag_slug` | `product_id`、`list_name`、`position` | `{ "event_name": "b2c_tag_click", "surface": "b2c" }`（`tag_slug` 目前無欄位可存，見下方對應表） | 不需要：每次點擊都是獨立動作 |
| `b2c_tag_view` | 是 | `/products/tags/[slug]` 頁面載入完成 | 標籤產品列表頁容器 | `tag_slug` | `result_count` | `{ "event_name": "b2c_tag_view", "surface": "b2c" }`（同上，無欄位可存） | 需要：依 `slug` 變化時觸發一次 |
| `b2c_search_no_result`（**待新增**） | 否 | 搜尋關鍵字送出後、結果為 0 筆 | 商品列表頁容器 | `search_term`、`result_count`(=0) | — | `{ "event_name": "b2c_search_no_result" }`（現無欄位可存任何參數） | 需要：同一次查詢字串在結果維持 0 筆期間只送一次，關鍵字改變後才允許再次觸發 |
| `b2c_filter_no_result`（**待新增**） | 否 | 標籤／分類 AND 篩選送出後、結果為 0 筆（對應本文件 §4.1「0 筆（無符合商品）」案例） | 商品列表頁／標籤頁容器 | `tag_slug`（可多個）、`category_slug`、`result_count`(=0) | — | `{ "event_name": "b2c_filter_no_result" }`（現無欄位可存任何參數） | 需要：同一組篩選條件維持 0 筆期間只送一次，條件改變後才允許再次觸發 |

**參數 → `analytics_events` 欄位對應（見 C10）：**

| 候選參數 | 是否有對應資料庫欄位 |
|---|---|
| `product_id` | 有，對應 `product_reference`（`uuid`，無 DB 層外鍵約束，需自行確保是有效的 `b2c_products.id`） |
| `product_name`／`product_slug` | 沒有；不建議另外持久化易變動的名稱／slug，若要查詢當下名稱可用 `product_id` 反查 |
| `category_slug` | 沒有；現有 `product_category` 存的是分類「顯示文字」（如「魚類」），不是 slug |
| `tag_slug` | 沒有 |
| `search_term` | 沒有；即使未來新增，也建議先做長度與內容清洗，避免直接落地使用者輸入 |
| `result_count` | 沒有 |
| `list_name`／`position` | 沒有 |
| `product_brand` | 有，對應 `product_brand` |

以上除 `product_id`／`product_brand`／`product_category` 外，其餘參數今天都沒有資料庫欄位可保存；是否比照 FDD 4.8 原設計新增 `metadata jsonb`（見 C10）待團隊確認，本次不執行任何 migration。

事件參數一律不得包含姓名、電話、Email、完整客戶代碼或其他個資，沿用 FDD 6.7／9.3 的既有規則；本次新增事件維持相同限制。

---

## 10. 元件狀態與驗收案例

以下案例沿用本文件第 2、3 章的歷史 12 筆商品作為 UI 測試資料；12 筆需求已過期，現行測試應優先使用 `supabase/seed.sql` 的 6 筆商品，必要時再將案例中的商品替換為現行資料。

| # | 案例 | 前置資料 | 操作步驟 | 預期結果 |
|---|---|---|---|---|
| 1 | 正常商品卡 | #1 鮭魚菲力切塊（品牌、價格、庫存、4 個標籤群組皆齊全；`image` 為 `null`，因為目前所有商品皆無圖，見 C6） | 在商品列表頁渲染此商品的 `ProductCard` | 顯示名稱、品牌、分類、價格、規格、最多 3 個標籤＋「+N」、佔位圖（非破圖） |
| 2 | 無品牌商品卡 | #8 熟帆立貝（`brand` 為空字串） | 渲染 `ProductCard` | 不顯示品牌列，其餘欄位正常顯示，卡片高度與其他卡片一致 |
| 3 | 無圖片商品卡 | 任一沒有 `b2c_product_images` row 的商品（legacy `image_path` 為 `null`） | 渲染 `ProductCard` | 顯示固定佔位圖，`alt=""` 且 `aria-hidden`，不顯示錯誤或「無圖片」文字 |
| 4 | 多標籤商品卡 | #1 鮭魚菲力切塊（鮭魚、煎／烤、氣炸、少刺／無刺、高蛋白、原味，共 6 個標籤） | 渲染 `ProductCard` | 最多顯示 3 個標籤＋「+3」，完整標籤清單只在詳情頁才看得到 |
| 5 | 缺貨商品卡 | #12 顏師傅龍蝦風味沙拉（`mockInventory = 0`） | 渲染 `ProductCard` | 顯示「缺貨」徽章；卡片仍可點擊進入詳情頁 |
| 6 | 正常商品詳情 | #5 藍鑽蝦仁（食安、認證、標籤皆齊全） | 進入 `/products/blue-diamond-shrimp-peeled`，`state.status = "ready"` | 顯示完整規格、產地、保存方式、食品安全、認證／品質、所有標籤群組 |
| 7 | 無食安資料詳情 | #4 冰釣格陵蘭雪鰈菲力（`foodSafetyInfo = null`） | 進入該商品詳情頁 | 不顯示「食品安全」區塊，不顯示「無提供資料」佔位文字 |
| 8 | 無認證資料詳情 | #3 柚香鹽麴鮭魚（`qualityInfo = null`） | 進入該商品詳情頁 | 不顯示「認證／品質」區塊 |
| 9 | 部分標籤群組為空 | #8 熟帆立貝（無「需求特性」標籤） | 進入該商品詳情頁 | `tagGroups` 中沒有「需求特性」這個群組，畫面不出現空的「需求特性」標題 |
| 10 | 商品不存在 | 任意不存在的 slug，例如 `/products/does-not-exist` | 進入該網址 | `state.status = "not_found"`，顯示「找不到這項商品」（正式文案，見 C11），設定 404，`noindex` |
| 11 | 商品未發布或停用 | 取本批任一商品（建議 #12），**僅在測試／預覽環境**暫時把該筆 `is_active` 改為 `false`（不變更本文件展示資料集本身） | 分別以（a）anon 前台身分、（b）Admin／service role 身分查詢該商品 | （a）等同「商品不存在」，`state.status = "not_found"`（見 C9）；（b）可查到資料，`state.status = "inactive"`，顯示「已下架」徽章 |
| 12 | API 載入中 | 任一商品，`state = { status: "loading" }` | 渲染 `ProductDetail` | 顯示骨架屏，版面高度與 `ready` 狀態相近，無版面跳動 |
| 13 | API 錯誤 | 模擬查詢失敗，`state = { status: "error", message: "..." }` | 渲染 `ProductDetail` | 顯示通用錯誤訊息＋重試按鈕，不顯示原始錯誤字串 |
| 14 | 手機版操作 | #1 鮭魚菲力切塊 | 在 375px 寬度視窗點擊商品卡與標籤 | 卡片與標籤的可點擊區域皆 ≥ 24×24px（WCAG 2.2 AA 2.5.8），觸控可正確分別觸發卡片跳轉或標籤跳轉 |
| 15 | 鍵盤操作 | 任一含標籤的商品列表 | 用 `Tab` 依序聚焦卡片主連結、各標籤連結，於卡片主連結上按 `Enter` | 依序看到清楚的 focus 外框；`Enter` 觸發導向 `/products/[slug]`；`Space` 在連結上不觸發導覽（連結原生行為） |
| 16 | 標籤點擊不誤觸商品卡 | #1 鮭魚菲力切塊 | 點擊卡片上其中一個標籤（例如「鮭魚」） | 導向 `/products/tags/salmon`（示意 slug），**不會**同時或改為導向 `/products/salmon-fillet-portion` |
| 17 | AND 篩選有結果 | 見 §4.1「食材＝鮭魚 AND 加工方式＝調味」 | 於商品列表頁套用此組合篩選 | 回傳 #2、#3 共 2 筆，皆以 `ProductCard` 正常渲染 |
| 18 | AND 篩選無結果 | 見 §4.1「食材＝比目魚 AND 加工方式＝調味」 | 於商品列表頁套用此組合篩選 | 回傳 0 筆，清單容器顯示「無符合商品」，觸發 `b2c_filter_no_result`（待新增，見 §9） |

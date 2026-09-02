# 固定題目選項差異表

> 目的：把 PRD／FDD 的固定題目選項，和 C API 使用的
> `condition`、標籤／分類／規格欄位逐一對照。
>
> 本文件記錄差異與目前對應狀態。設定檔來源為
> `src/lib/product-finder.ts`；「目前展示資料」以可重跑
> `supabase/seed.sql` 與 B2B catalog migration 為準。其餘未標為「已對應」的
> 差異仍需 A／B 確認後另行調整。
>
> **2026-09-01 更新**：B2C 料理方式（清蒸／煮湯／生食）、需求特性（方便料理／
> 少刺無刺／份量剛好）與「其他海鮮」分類共 7 項缺口，經 A／B／C 確認後已於
> `supabase/seed.sql` 補齊標籤與示範商品，並已套用至正式 Supabase 專案；狀態
> 由「尚無 tag／category」更新為「已對應」。

## B2C

| 步驟 | 顯示選項 | condition key | 對應型別／值 | 目前展示資料 | 差異或備註 |
| --- | --- | --- | --- | --- | --- |
| 1 料理方式 | 火鍋 | `hot-pot` | tag／`hot-pot` | 已有 tag | 已對應 |
| 1 料理方式 | 煎／烤 | `pan-fry` | tag／`pan-fry` | 已有 tag | 已對應 |
| 1 料理方式 | 氣炸 | `air-fry` | tag／`air-fry` | 已有 tag | 已對應 |
| 1 料理方式 | 清蒸 | `steam` | tag／`steam` | 已有 tag（台灣虱目魚肚） | 已對應（2026-09-01） |
| 1 料理方式 | 煮湯 | `soup` | tag／`soup` | 已有 tag（台灣虱目魚肚／台灣鮮甜蛤蜊） | 已對應（2026-09-01） |
| 1 料理方式 | 生食 | `raw` | tag／`raw` | 已有 tag（挪威鮭魚菲力） | 已對應（2026-09-01）；商品描述已加註「急凍鎖鮮達生食級規格」呼應食品安全語意 |
| 2 需求特性 | 方便料理 | `easy-cook` | tag／`easy-cook` | 已有 tag（日式調味鯖魚） | 已對應（2026-09-01）；與「即煮」並存，語意各自獨立不互斥 |
| 2 需求特性 | 少刺／無刺 | `boneless` | tag／`boneless` | 已有 tag（挪威鮭魚菲力／台灣虱目魚肚／日式調味鯖魚） | 已對應（2026-09-01） |
| 2 需求特性 | 高蛋白 | `high-protein` | tag／`high-protein` | 已有 tag | 已對應 |
| 2 需求特性 | 適合小孩 | `kid-friendly` | tag／`kid-friendly` | 已有 tag | 已對應 |
| 2 需求特性 | 份量剛好 | `right-portion` | tag／`right-portion` | 已有 tag（日式調味鯖魚） | 已對應（2026-09-01） |
| 3 產品類型 | 魚類 | `fish` | category／`魚類` | 已有 category | 已對應 |
| 3 產品類型 | 蝦類 | `shrimp` | category／`蝦類` | 已有 category | 已對應 |
| 3 產品類型 | 貝類 | `shellfish` | category／`貝類` | 已有 category | 已對應 |
| 3 產品類型 | 其他海鮮 | `other-seafood` | category／`其他海鮮` | 已有 category／商品（新增台灣鮮甜小卷） | 已對應（2026-09-01） |
| 3 產品類型 | 都可以 | `any` | 不加條件 | 不適用 | API 會略過 `any` |
| 4 其他偏好 | 原味 | `plain` | tag／`plain` | 尚無 tag | 需確認與未加工的差異 |
| 4 其他偏好 | 調味 | `seasoned` | tag／`seasoned` | 已有 tag | 已對應 |
| 4 其他偏好 | 即食／即煮 | `ready-to-cook` | tag／`ready-to-cook` | 已有 tag | 已對應 |
| 4 其他偏好 | 都可以 | `any` | 不加條件 | 不適用 | API 會略過 `any` |

## B2B

| 步驟 | 顯示選項 | condition key | 對應型別／值 | 目前展示資料 | 差異或備註 |
| --- | --- | --- | --- | --- | --- |
| 1 產品類型 | 魚類 | `b2b-fish` | tag／`b2b-fish` | 已有 tag | 已對應 |
| 1 產品類型 | 蝦蟹類 | `b2b-shrimp` | tag／`b2b-shrimp` | 已有 tag／商品 | 顯示名稱採單一「蝦蟹類」；保留既有 condition key |
| 1 產品類型 | 貝類 | `b2b-shellfish` | tag／`b2b-shellfish` | 已有 tag | 已對應 |
| 1 產品類型 | 加工食品等 | `processed-food` | tag／`processed-food` | 已有 tag／商品 | 展示分類採 FDD 的「調理食品」 |
| 2 產品型態 | 原料 | `raw-material` | tag／`raw-material` | 已有 tag | 已對應 |
| 2 產品型態 | 整尾 | `whole-fish` | tag／`whole-fish` | 已有 tag | 已對應 |
| 2 產品型態 | 切片 | `fillet` | tag／`fillet` | 已有 tag | 已對應 |
| 2 產品型態 | 切塊 | `cut-piece` | tag／`cut-piece` | 已有 B2B tag／商品 | B2C 同名 tag 不可跨產品線共用 |
| 2 產品型態 | 調味 | `seasoned` | tag／`seasoned` | 已有 B2B tag／商品 | B2C 同名 tag 不可跨產品線共用 |
| 3 使用情境 | 餐飲料理 | `restaurant` | tag／`restaurant` | 已有 tag | 已對應 |
| 3 使用情境 | 零售販售 | `retail` | tag／`retail` | 已有 tag | 已對應 |
| 3 使用情境 | 團膳／大量供應 | `bulk-supply` | tag／`bulk-supply` | 已有 tag | 已對應 |
| 4 規格／保存 | 5kg／箱 | `pack-5kg` | specification／`5kg/箱` | 商品 packaging 有 5kg／箱 | 設定檔以規格比對；尚無獨立 tag |
| 4 規格／保存 | 10kg／箱 | `pack-10kg` | specification／`10kg/箱` | 商品 packaging 有 10kg／箱 | 設定檔以規格比對；尚無獨立 tag |
| 4 規格／保存 | 冷凍保存 | `frozen` | tag／`frozen` | 已有 tag | 已對應 |
| 4 規格／保存 | 略過 | `any` | 不加條件 | 不適用 | API 會略過 `any` |

## 判讀規則

- 同一題組多選條件採 AND；`any` 不會產生查詢條件。
- B2C 的分類條件只比對 `b2c_products.category`；B2B 的
  `specification` 條件同時比對 `b2b_products.specification` 與
  `b2b_products.packaging`。
- 「尚無 tag／category」是仍待確認的資料契約差異；本次已依授權補齊 B2B 展示資料。
- B2B 展示資料現涵蓋蝦蟹類、魚類、貝類、軟體類、肉類與調理食品。
- B2C 固定題目原本的 7 項缺口（清蒸、煮湯、生食、方便料理、少刺／無刺、份量剛好、其他海鮮）已於 2026-09-01 依 A／B／C 確認補齊 `supabase/seed.sql` 標籤與示範商品；本文件所有列項目前均為「已對應」。

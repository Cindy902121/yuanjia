# Supabase schema 對齊與 B2C 商品欄位草案

## 現況判定

2026-08-10 的唯讀盤點顯示，遠端專案 `ixggooilggtesdrmjeon` 已有 14 張
`public` 資料表及示範商品資料，內容與以下兩支本機 migration 相符：

- `20260810054414_create_mvp_foundation.sql`
- `20260810055532_add_demo_catalog_data.sql`

但遠端沒有 migration 歷史紀錄。因此這兩支檔案不可再次執行；應先把它們標記為
`applied`，再推送後續 migration。

## 執行原則

1. GitHub 先保存、審查 migration 草案。
2. 正式 Supabase 先修復 migration 歷史，不重建既有資料表或重灌示範資料。
3. 依檔名時間戳順序執行三支新 migration。
4. 每一步確認結果後才進入下一步；正式套用前先備份資料庫。

## migration 順序

| 順序 | migration | 用途 |
|---:|---|---|
| 1 | `20260810161047_harden_public_privileges.sql` | 移除 `anon`／`authenticated` 的過寬資料表權限，保留 B2C 公開唯讀，建立封裝後的管理員判斷函式。 |
| 2 | `20260810161048_extend_b2c_catalog.sql` | 增加商品首頁欄位、多分類、3–5 張商品圖片、證書資料及公開讀取政策。 |
| 3 | `20260810161049_create_b2c_media_storage.sql` | 建立 `b2c-media` bucket；公開讀取，僅啟用中的管理員可異動。 |

## 第一版產品資料模型

既有 `b2c_products` 保留品牌、規格、價格、產地、保存方式、食安、品質、庫存數量與
詳細說明，並新增：

- `currency`：第一版固定 `TWD`，仍保留未來擴充空間。
- `short_description`：列表或詳情頁首屏摘要。
- `is_featured`、`featured_sort_order`：預設顯示最新商品，管理員可指定與排序精選商品。
- `published_at`：穩定控制「最新」排序。
- `inventory_status`：由資料庫數量產生 `in_stock`／`out_of_stock`，前台不揭露數量。

關聯表負責：

- `b2c_categories`、`b2c_product_categories`：正式分類，多對多；同一商品可同時屬於「魚類」與「調理食品」。
- `b2c_product_images`：一張封面圖加多張細節圖，透過 `sort_order` 排序。
- `b2c_certifications`、`b2c_product_certifications`：證書圖片、發證單位、效期及補充文字。
- 既有 `b2c_tags`、`b2c_product_tags`：維持標籤與 AND 篩選用途，不和正式分類混用。

`b2c_products.category` 與 `b2c_products.image_path` 暫時保留供舊程式相容；前端切換至新關聯後，再另開 migration 移除。

## 正式套用前指令

專案尚未固定 Supabase CLI 版本時，先在獨立變更中安裝並提交 lockfile：

```powershell
pnpm add -D supabase
```

登入、連結並先確認遠端狀態：

```powershell
pnpm exec supabase login
pnpm exec supabase link --project-ref ixggooilggtesdrmjeon
pnpm exec supabase migration list
```

確認專案無誤後，僅登記已存在的兩支 migration：

```powershell
pnpm exec supabase migration repair 20260810054414 --status applied
pnpm exec supabase migration repair 20260810055532 --status applied
pnpm exec supabase migration list
```

先預覽差異，再套用：

```powershell
pnpm exec supabase db push --dry-run
pnpm exec supabase db push
```

> `migration repair` 與 `db push` 都會改動遠端狀態。執行前必須再次核對 project ref、備份與 dry-run 輸出。

## 驗收清單

- migration list 顯示五支 migration 的本機／遠端版本一致。
- 既有 5 筆 B2C 與 5 筆 B2B 商品沒有重複或遺失。
- 匿名使用者只能讀取啟用中的 B2C 商品、分類、標籤、圖片與證書關聯。
- 匿名或一般登入使用者無法讀取公司、管理員、詢價、模擬訂單與事件資料。
- 每項既有商品都有一個主要正式分類；調味商品另屬於「調理食品」。
- 首頁可依 `published_at` 顯示最新商品，也可依 `is_featured` 與 `featured_sort_order` 手動調整。
- 商品詳情可取得封面／細節圖、規格、產地、保存、食安、品質、標籤與證書。
- `app_admins` 至少建立一位啟用中的管理員後，該帳號可上傳、更新與刪除 `b2c-media` 圖片；一般帳號不可異動。

# Supabase migration 歷史整理

## 結論（2026-08-29）

已依 linked remote project `ixggooilggtesdrmjeon` 的唯讀查詢整理 migration。遠端 `supabase_migrations.schema_migrations` 有 10 筆紀錄；本機 `supabase/migrations/` 的 10 支 active migration 均已套用至 remote，沒有 pending migration。

這次沒有執行 `migration repair` 或正式 `db push`：唯讀 migration history 已確認 10 支 active migration 與 remote 對齊；`20260827031543` 的 corrective migration 已在 remote history 中。

## Active migration 順序

| 順序 | migration | 用途 |
|---:|---|---|
| 1 | `20260812150000_baseline_remote_schema.sql` | 將既有遠端 MVP schema 固定成可追蹤的 baseline。 |
| 2 | `20260812150001_establish_mvp_security_contract.sql` | 建立 RLS、角色權限、公開 B2C 讀取與企業資料隔離。 |
| 3 | `20260814032551_add_missing_foreign_key_indexes.sql` | 補齊外鍵查詢索引。 |
| 4 | `20260814032613_align_b2b_demo_catalog.sql` | 對齊 B2B 示範型錄資料。 |
| 5 | `20260817033059_enforce_b2b_client_code_format.sql` | 約束企業客戶代碼格式與前綴規則。 |
| 6 | `20260817072826_b2b_product_spec_options.sql` | 建立 B2B 商品多規格選項。 |
| 7 | `20260817073045_add_b2b_rfq_spec_option_fk_index.sql` | 補齊詢價規格選項外鍵索引。 |
| 8 | `20260825024950_add_admin_catalog_media_and_management.sql` | 建立 B2C／B2B 商品圖片、Storage bucket、圖片 RLS 與 B2B 批量新增 RPC。 |
| 9 | `20260825025003_add_admin_roles_and_b2b_status.sql` | 建立 `app_admins.role`、`b2b_products.status`、狀態同步、RLS 與 Admin 狀態 RPC。 |
| 10 | `20260827031543_fix_admin_bulk_status_ambiguity.sql` | 限定批次狀態 RPC 的資料表欄位，修正 PostgreSQL 42702 歧義；已套用至 remote。 |

## 已移出 active 的歷史檔案

以下檔案都在 `supabase/migrations_archive/legacy/`，只供稽核與比對，不得重播：

- `20260810054414_create_mvp_foundation.sql`、`20260810055532_add_demo_catalog_data.sql`：原始 2026-08-10 foundation／demo setup。
- `20260810161047_harden_public_privileges.sql`、`20260810161048_extend_b2c_catalog.sql`、`20260810161049_create_b2c_media_storage.sql`：本機草稿，未出現在遠端 migration history；不能用 `migration repair` 標成 applied。
- `20260819074622_add_admin_catalog_media_and_management.sql`：舊版本機 Admin media 草稿，已由遠端實際套用的 `20260825024950` 取代。

因此，`20260810161048` 提案中的分類、認證及額外 B2C 欄位不代表目前遠端 schema；目前已落地的是 `20260825024950` 定義的商品圖片與 Storage。

## 已核對的遠端結果

- 10 支 migration history 與本機 active 版本一致；沒有 pending migration。
- `app_admins.role`、`b2b_products.status` 與 Admin 狀態 RPC 存在。
- `b2c_product_images`、`b2b_product_images` 及 `b2c-media`／`b2b-media` bucket 存在。
- public tables 已啟用 RLS。

## 後續驗證與維護

```bash
supabase migration list --linked
supabase db push --dry-run
supabase db reset
```

`db reset` 只重建本機隔離資料庫，會清除本機資料；正式環境不要用它。`db push --dry-run` 顯示無 pending migration 後，才可考慮正式 push。

截至 2026-08-29 的 remote migration history 沒有 pending migration；下一次新增 schema 仍須先執行 `supabase db push --dry-run`，確認差異後再依部署指示執行正式 push。

未來新增 schema 時建立新的 migration，不修改已套用檔案。只有在「SQL 已精確套用、但 history row 缺失」時才可使用 `migration repair`；本次不需要 repair。

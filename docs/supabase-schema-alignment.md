# Supabase migration 歷史整理

## 結論（2026-09-03）

已依 linked remote project `ixggooilggtesdrmjeon` 的唯讀查詢核對 migration。遠端 `supabase_migrations.schema_migrations` 有 11 筆紀錄；repository 的 `supabase/migrations/` 也有 11 支 active migration，版本與名稱逐筆對齊。

linked remote 的 `supabase db push --linked --dry-run --skip-vault` 回報 `upToDate: true`，沒有 pending migration。這次沒有執行 `migration repair` 或正式 `db push`；本機隔離 DB 的 `db reset` 已完成。

本機隔離資料庫原先有 12 筆 history，包含沒有 repository 檔案的孤兒版本 `20260812150002_b2c_editor_fields`、`20260827030729_admin_replace_b2b_product_tags`，且尚未套用 `20260830175215_b2b_analytics_reporting`。已在本機執行 `supabase db reset --local --yes`，依目前 11 支 active migration 重建並執行 `supabase/seed.sql`；現在 local history 已回到 11/11 對齊，`supabase db push --local --dry-run --skip-vault` 回報 `upToDate: true`。

動態 seed rerun 已完成：在沒有主機 `psql` 的情況下，測試透過 Docker container fallback 連線 `54322`，連續執行兩次 `supabase/seed.sql`，Auth identity 綁定保持不變；展示資料筆數也符合預期（B2C／B2B 商品 6／8、標籤 16／15、規格選項 10、標籤關聯 26／31）。

Admin Analytics 五家公司整合驗證已完成：測試動態建立 5 家企業，透過 summary API 驗證漏斗、商品／RFQ 排名、Finder，以及 4 家資料聚合為 `其他（已遮罩）`；同一測試實際下載 CSV 並回查 `analytics_export_audits`；本機 real contract 共 39 pass、0 fail、0 skipped。

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
| 10 | `20260827031543_fix_admin_bulk_status_ambiguity.sql` | 限定批次狀態 RPC 的資料表欄位，修正 PostgreSQL 42702 歧義；已部署至 remote。 |
| 11 | `20260830175215_b2b_analytics_reporting.sql` | 補充 B2B 行為分析身份欄位、事件索引、匯出稽核表與 Admin 聚合／清理 RPC。已部署至 remote。 |

## 已移出 active 的歷史檔案

以下檔案都在 `supabase/migrations_archive/legacy/`，只供稽核與比對，不得重播：

- `20260810054414_create_mvp_foundation.sql`、`20260810055532_add_demo_catalog_data.sql`：原始 2026-08-10 foundation／demo setup。
- `20260810161047_harden_public_privileges.sql`、`20260810161048_extend_b2c_catalog.sql`、`20260810161049_create_b2c_media_storage.sql`：本機草稿，未出現在遠端 migration history；不能用 `migration repair` 標成 applied。
- `20260819074622_add_admin_catalog_media_and_management.sql`：舊版本機 Admin media 草稿，已由遠端實際套用的 `20260825024950` 取代。

因此，`20260810161048` 提案中的分類、認證及額外 B2C 欄位不代表目前遠端 schema；目前已落地的是 `20260825024950` 定義的商品圖片與 Storage。

## 已核對的遠端結果

- 遠端 history 與本機 active migration 版本／名稱 11 支一致；沒有 remote pending migration。
- `supabase db push --linked --dry-run --skip-vault` 回報 `upToDate: true`。
- 本機隔離 DB 已透過 `supabase db reset --local --yes` 重建；local history 與 11 支 active migration 一致。
- `supabase db push --local --dry-run --skip-vault` 回報 `upToDate: true`。
- 動態 seed rerun 通過；連續兩次執行後 `companies.auth_user_id` 綁定不變，展示資料筆數符合預期。
- Admin Analytics 五家公司遮罩、CSV 下載與 `analytics_export_audits` 回查整合測試通過；`< 5` 的商品／Finder 選項不回傳原始資料，`>= 5` 的資料可正常顯示。
- `app_admins.role`、`b2b_products.status` 與 Admin 狀態 RPC 存在。
- `b2c_product_images`、`b2b_product_images` 及 `b2c-media`／`b2b-media` bucket 存在。
- public tables 已啟用 RLS。

## 後續驗證與維護

```bash
supabase start
supabase db reset --local --yes
supabase migration list --linked
supabase db push --linked --dry-run --skip-vault
supabase migration list --local
supabase db push --local --dry-run --skip-vault
```

`db reset --local` 只重建本機隔離資料庫，會清除本機資料；正式環境不要用它。`db push --dry-run` 顯示無 pending migration 後，才可考慮正式 push。

目前 linked remote 與 local DB 都是最新；`20260827031543_fix_admin_bulk_status_ambiguity.sql` 與 `20260830175215_b2b_analytics_reporting.sql` 都已完成正式部署。seed rerun 測試不需要主機安裝 `psql`，測試 helper 會在 `psql` 不存在時改用本機 Supabase DB container 執行。

已知例外：`auth_leaked_password_protection` 為學生專題刻意忽略的 Supabase Auth warning；本專案不規劃正式營運，因此不修改 Auth 設定，也不把此 warning 視為 migration 或 schema 錯誤。若未來正式上線，才需重新評估並啟用。

未來新增 schema 時建立新的 migration，不修改已套用檔案。只有在「SQL 已精確套用、但 history row 缺失」時才可使用 `migration repair`；本次不需要 repair。

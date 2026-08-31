# Supabase schema 對齊與本機隔離測試

## 結論（2026-08-31）

最近一次對 linked remote project `ixggooilggtesdrmjeon` 的唯讀盤點（2026-08-29）
顯示遠端 migration history 有 10 筆；本分支現在有 12 支 active migration：

- 前 10 支的版本與遠端歷史一致。
- `20260812150002_b2c_editor_fields.sql` 是 B2C 編輯頁目前需要的
  `currency`／`short_description`，尚待遠端審查與部署。
- `20260827030729_admin_replace_b2b_product_tags.sql` 是 B2B 標籤整批替換
  的原子 RPC，尚待遠端審查與部署。

本次只重整本機 migration chain、重建本機隔離資料庫並執行測試；沒有執行
`migration repair`、`db push` 或任何遠端資料修改。

## Active migration 順序

| 順序 | migration | 用途 |
|---:|---|---|
| 1 | `20260812150000_baseline_remote_schema.sql` | 將既有遠端 MVP schema 固定成可追蹤的 baseline。 |
| 2 | `20260812150001_establish_mvp_security_contract.sql` | 建立 RLS、角色權限、公開 B2C 讀取與企業資料隔離。 |
| 3 | `20260812150002_b2c_editor_fields.sql` | 增加 B2C 編輯頁使用的 `currency` 與 `short_description`。 |
| 4 | `20260814032551_add_missing_foreign_key_indexes.sql` | 補齊外鍵查詢索引。 |
| 5 | `20260814032613_align_b2b_demo_catalog.sql` | 對齊 B2B 示範型錄資料與標籤。 |
| 6 | `20260817033059_enforce_b2b_client_code_format.sql` | 約束企業客戶代碼格式與前綴規則。 |
| 7 | `20260817072826_b2b_product_spec_options.sql` | 建立 B2B 商品多規格選項與詢價快照欄位。 |
| 8 | `20260817073045_add_b2b_rfq_spec_option_fk_index.sql` | 補齊詢價規格選項外鍵索引。 |
| 9 | `20260825024950_add_admin_catalog_media_and_management.sql` | 建立 B2C／B2B 商品圖片、Storage bucket、圖片 RLS 與 B2B 批量新增 RPC。 |
| 10 | `20260825025003_add_admin_roles_and_b2b_status.sql` | 建立 `app_admins.role`、`b2b_products.status`、狀態同步與 Admin 狀態 RPC。 |
| 11 | `20260827030729_admin_replace_b2b_product_tags.sql` | 以單一 RPC 原子替換 B2B 商品標籤。 |
| 12 | `20260827031543_fix_admin_bulk_status_ambiguity.sql` | 修正批次狀態 RPC 的 PostgreSQL 欄位歧義。 |

## 已移出 active 的歷史檔案

以下檔案位於 `supabase/migrations_archive/legacy/`，只供稽核與比對，不得重播：

- `20260810054414_create_mvp_foundation.sql`
- `20260810055532_add_demo_catalog_data.sql`
- `20260810161047_harden_public_privileges.sql`
- `20260810161048_extend_b2c_catalog.sql`
- `20260810161049_create_b2c_media_storage.sql`
- `20260819074622_add_admin_catalog_media_and_management.sql`
- `20260825022150_add_admin_roles_and_b2b_status.sql`
- `20260825030000_fix_admin_b2b_status_rpc.sql`

其中 2026-08-10 的三支 B2C 擴充檔案包含尚未採用的正式分類、認證與精選欄位；
本期 B2C 只保留目前編輯頁需要的兩個欄位。舊 Admin migration 已由 active
目錄中的遠端版本號取代，Git history 保留原始內容。

## 目前 schema 邊界

- B2C `b2c_products` 使用 baseline 欄位，加上 `currency` 與
  `short_description`；`category` 仍是單一文字欄位。
- 本期不建立 `b2c_categories`、`b2c_product_categories`、
  `b2c_certifications`、`b2c_product_certifications`、featured 或其他
  normalized B2C schema。
- `b2c_product_images`／`b2b_product_images` 與 `b2c-media`／`b2b-media`
  由 Admin media migration 建立；圖片限制為 JPEG、PNG、WebP、每張最多 5 MB，
  每項商品最多 1 張封面與 5 張細節圖。
- 管理寫入走 Next.js server-side service role；B2C 上架前必須有封面圖，
  B2B 圖片仍使用私有 bucket 與短效 signed URL。
- 所有 public table 維持 RLS；匿名只讀取 active B2C，企業使用者只讀取自己公司
  可見的 B2B／RFQ 資料。

## 本機隔離測試環境

本機 Supabase 是唯一測試資料庫，API 位於 `127.0.0.1:54321`，Postgres 位於
`127.0.0.1:54322`，Next 測試 server 預設位於 `127.0.0.1:3100`。URL、key、
Auth 帳密只放在被 Git ignore 的 `.env.local`／`.env.test.local`，不放入
migration、seed 或文件。

第一次建立或 schema 變更後，依序執行：

```bash
supabase start --yes
supabase db reset --local --yes
supabase migration list --local
docker exec -i supabase_db_supabase psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/seed.b2b-test-fixtures.sql
node scripts/provision-contract-test-identities.mjs
node scripts/provision-b2b-isolation-fixture.mjs
pnpm test:contracts:real
```

`db reset --local` 會清除本機資料與 Auth identity，所以每次 reset 後都要重新
執行兩個 provisioning script。第一個建立 B2C、B2B、Admin、business_staff
測試 identity 並綁定 `Z232113`；第二個建立 `W483038` 跨公司 identity。
Fixture SQL 建立 `E853699` 停用公司與停用商品。

`pnpm test:contracts:real` 會自動啟動並關閉 Next 測試 server，並清理測試期間
建立的商品、圖片、訂單、RFQ、公司與事件。手動驗收產生的資料，請使用精準的
`supabase/cleanup.b2b-test-fixtures.sql`，或直接重建本機資料庫。

## 遠端操作安全界線

- `supabase migration list --linked` 只用於檢查遠端 history；先確認 project ref。
- `supabase db push --dry-run` 只用於審查將要部署的差異。
- 不可對遠端使用 `supabase db reset`；不可把 `--local` 省略後直接重跑。
- 只有在「精確 SQL 已套用、但 history row 缺失」時才能使用
  `migration repair`；本分支目前沒有這個情況。
- 兩支 local-only migration 尚未取得部署確認前，不宣稱遠端已支援 B2C 編輯頁
  的摘要欄位或 B2B 原子標籤替換。

## 驗證結果（2026-08-31）

- [x] 本機 migration chain 可由空資料庫完整 reset，12 支 active migration 全部成功。
- [x] seed 與 B2B 隔離 fixture 成功載入；4 個基礎測試 identity 與第二家公司
  identity 均在本機建立。
- [x] `pnpm test:contracts:real`：36 pass、0 fail、0 skipped。
- [x] 所有測試只連到本機 Supabase；本次沒有遠端 `db push`。

更新 migration 時，使用新的時間戳建立檔案，不修改已套用 migration。只有先確認
schema、RLS、Storage、seed 與可重建的隔離測試流程，才進入遠端部署審查。

# C API／資料庫契約測試

## 預設驗證

在 repository root 執行：

```bash
pnpm test:contracts
```

這會執行不需外部服務的 API guard、RFQ company scope、24 個事件白名單與
payload、customer prefix fallback、文件／seed 契約與 P2 index migration 檢查。

目前分支是從 GitHub `main` 建立；schema normalization PR 尚未合併時，RLS／SQL
migration 的延伸案例會顯示為 skipped，並明確標示等待 baseline/security migration
落到 main。

## 隔離整合驗證（可選）

先在隔離的 local/test Supabase 與 Next server 設定：

```bash
export CONTRACT_TEST_BASE_URL=http://127.0.0.1:3000
export CONTRACT_TEST_B2C_EMAIL='…'
export CONTRACT_TEST_B2C_PASSWORD='…'
export CONTRACT_TEST_B2B_IDENTIFIER='…'
export CONTRACT_TEST_B2B_PASSWORD='…'
export CONTRACT_TEST_ADMIN_EMAIL='…'
export CONTRACT_TEST_ADMIN_PASSWORD='…'
pnpm test:contracts
```

這組測試會透過 API 建立展示事件／RFQ／模擬訂單狀態驗證，因此不得指向正式
資料庫。若另提供第二家公司帳號
`CONTRACT_TEST_B2B_OTHER_IDENTIFIER`／`CONTRACT_TEST_B2B_OTHER_PASSWORD`，會再
驗證跨公司 RFQ 不可見。

Seed identity 測試另外需要隔離資料庫連線：

```bash
export CONTRACT_TEST_DATABASE_URL='postgresql://…'
pnpm test:contracts
```

它會連續執行兩次 `supabase/seed.sql`，確認 `companies.auth_user_id` 綁定不變。

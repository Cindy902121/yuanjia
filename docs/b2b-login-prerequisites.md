# 統一登入：Supabase 設定前置條件

本文件是 B 實作統一登入時，交由 C 建立與確認的資料設定清單。所有帳號皆為展示帳號；不可使用真實客戶資料或將密碼提交至 Git。

## 本機環境變數

每位需要執行登入 API 的開發者，在自己的 `.env.local` 填入：

```env
SUPABASE_SECRET_KEY=
```

此金鑰只可放在 `.env.local` 或部署平台的伺服器端環境變數。不得使用 `NEXT_PUBLIC_` 前綴、不得貼到聊天室、不得提交至 Git。

## C 需建立的展示帳號資料

1. 在 Supabase Auth 建立已確認的 B2C 展示 Email 帳號。
2. 在 Supabase Auth 建立已確認的 B2B 展示 Email 帳號。此 Email 為系統內部對應資料，不顯示在 B2B 登入畫面。
3. 在 `companies` 新增該 B2B 公司，設定：
   - `client_code`：例如 `B2B-TEST-001`
   - `auth_user_id`：對應第 2 步的 Auth user UUID
   - `is_active`：`true`
4. 如要測試 Admin，將 Admin Auth user UUID 新增至 `app_admins`，並設定 `is_active = true`。

## B 的實作規則

- B2C／Admin 使用 Email + 密碼登入。
- B2B 使用客戶代碼 + 公司共用密碼登入。
- 客戶代碼只在伺服器端查詢 `companies`，前端不會取得或指定 `company_id`。
- 停用公司的登入請求不建立 session，並顯示停用提示。
- Email 帳號若存在且為啟用的 `app_admins`，導向 `/admin`；其他 Email 帳號導向 `/`。
- 有效 B2B 帳號導向 `/business/catalog`。

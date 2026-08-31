# 統一登入：Supabase 設定前置條件

本文件是 B 實作統一登入時，交由 C 建立與確認的資料設定清單。所有帳號皆為展示帳號；不可使用真實客戶資料或將密碼提交至 Git。

## 本機環境變數

每位需要執行登入 API 的開發者，在自己的 `.env.local` 填入：

```env
SUPABASE_SECRET_KEY=
```

此金鑰只可放在 `.env.local` 或部署平台的伺服器端環境變數。不得使用 `NEXT_PUBLIC_` 前綴、不得貼到聊天室、不得提交至 Git。

## 建立展示／驗收帳號資料

1. B2C／Admin 仍可在 Supabase Auth 建立已確認的 Email 帳號；Admin user UUID 需存在於 `app_admins` 且 `is_active = true`。
2. B2B 一般流程使用網站 `/admin` →「企業會員」→「新增企業會員」。Admin 輸入企業名稱、外部公司系統提供的完整客戶代碼與 8–72 字元初始密碼後，由伺服器建立 Auth user 與 `companies` 綁定。
3. B2B 對外只使用客戶代碼＋公司共用密碼；Auth Email 是內部技術 identity，不顯示在 B2B 登入畫面。
4. 目前驗收代碼為 `Z232113`、`E853699`、`W483038`；三筆都必須有唯一且已確認的 `auth_user_id`，並設定 `is_active = true` 才能登入。

### Supabase Dashboard 手動建帳例外

如因資料修復必須手動操作：

1. 在 Authentication 建立新的 Auth user，設定唯一內部 Email、密碼並確認 Email。
2. 複製該 user 的新 UUID。
3. 若 `companies` 已有該客戶代碼，使用 `update` 更新 `auth_user_id`；若沒有才使用 `insert`。
4. 不可將已綁定其他公司的 `auth_user_id` 再次插入；否則會觸發 `companies_auth_user_id_key`。

## B 的實作規則

- B2C／Admin 使用 Email + 密碼登入。
- B2B 使用客戶代碼 + 公司共用密碼登入；客戶代碼由外部公司系統產生，Admin 建立企業會員時輸入完整代碼，格式為 Z／E／W 加 6 碼數字，建立後不可修改。
- 客戶代碼只在伺服器端查詢 `companies`，前端不會取得或指定 `company_id`。
- 停用公司的登入請求不建立 session，並顯示停用提示。
- Email 帳號若存在且為啟用的 `app_admins`，依 `role` 導向 `/admin` 或 `/admin/business`；其他 Email 帳號導向 `/`。
- 有效 B2B 帳號導向 `/business/catalog`。

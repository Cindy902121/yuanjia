# B2C Auth 設定

## 已完成的流程

- B2C Header 的「登入」會開啟浮動視窗，不離開目前頁面。
- Email 登入視窗包含「註冊會員」與「忘記密碼」。註冊只建立 Supabase Auth identity，不建立額外會員 profile。
- 註冊後必須先完成 Email 驗證；本機信件可在 Mailpit 查看。
- Google 登入只出現在 B2C Email 登入模式。OAuth callback 會拒絕已綁定 `app_admins` 或 `companies` 的帳號。
- `/login` 保留給 B2B 客戶代碼、Admin 與 business_staff 的直接登入。

## 本機 Google OAuth

### 1. 建立 Google OAuth client

在 [Google Cloud Console](https://console.cloud.google.com/) 建立或選擇專案，完成 Google Auth Platform 的 Branding／Audience 設定，並在 Data Access 加入這三個 scopes：

- `openid`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

建立 OAuth client，類型選 **Web application**。本機 Authorized JavaScript origins 加入：

```text
http://127.0.0.1:3000
http://127.0.0.1:3100
```

本機 Authorized redirect URI 加入 Supabase Auth 的 callback：

```text
http://127.0.0.1:54321/auth/v1/callback
```

如果 `supabase status` 顯示不同的 API URL，請以該 URL 加上 `/auth/v1/callback` 為準。建立後保存 Client ID 與 Client Secret；secret 不要貼到對話或提交 Git。

### 2. 設定本機環境

把值放在未納入 Git 的 `.env.local`：

```env
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=1
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=你的-Google-Client-ID
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=你的-Google-Client-Secret
```

在 `supabase/config.toml` 將 `[auth.external.google]` 的 `enabled` 改成 `true`，再重啟本機 Supabase 與 Next server。這份 repository 設定已預先加入以下 callback allowlist：

```text
http://127.0.0.1:3000/auth/callback
http://127.0.0.1:3100/auth/callback
http://localhost:3000/auth/callback
http://localhost:3100/auth/callback
```

啟動後到 B2C 首頁或商品頁，點 Header「登入」；Google 按鈕只會在 provider 已開啟且 `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=1` 時顯示。

Email 驗證與密碼重設信件可在本機 [Inbucket](http://127.0.0.1:54324/) 查看。

## Hosted Supabase／正式環境

1. 在 Supabase Dashboard 的 **Authentication → Providers → Google** 開啟 Google，貼上同一組 Client ID／Secret。
2. 在 **Authentication → URL Configuration** 將網站的 callback 加入 Redirect URLs，例如 `https://your-domain.example/auth/callback`。
3. 回到 Google OAuth client，將正式網站 origin 加入 Authorized JavaScript origins，並把 Supabase Dashboard 顯示的正式 Auth callback（通常是 `https://<project-ref>.supabase.co/auth/v1/callback`）加入 Authorized redirect URIs。
4. 正式環境設定 `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=1`；secret 只放在 hosting／Supabase 的 secrets，不放 `.env.example` 以外的版本控制檔案。
5. 確認 Supabase Email provider 的 **Confirm email** 已開啟，並使用正式 SMTP；本機 Mailpit 不會寄出真實信件。

## 已知決策

- 「忘記密碼」對不存在的 Email 回傳「Email 不存在。」；這會洩漏帳號是否存在，是本次展示需求明確選擇的 UX，若上線前改重視安全性，應改成所有 Email 都顯示相同的寄送結果。
- Supabase 可能自動把相同 Email 的 Google identity 連結到既有 Auth user；callback 仍會以 `app_admins`／`companies` 綁定檢查阻擋 Google 使用 Admin 或 B2B 權限。

## 官方文件

- [Supabase Google login](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [Supabase password reset](https://supabase.com/docs/guides/auth/passwords)

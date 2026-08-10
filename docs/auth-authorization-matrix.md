# 登入與權限矩陣

> 狀態：已於 2026-08-10 由團隊確認。B 負責實作；A、C 依此進行前端與後台整合。

## 登入方式

| 身分 | 登入資料 | 登入成功後 |
| --- | --- | --- |
| B2C 會員 | Email + 密碼 | 留在 B2C 流程 |
| B2B 公司使用者 | 客戶代碼 + 公司共用密碼 | `/business/catalog` |
| Admin | Email + 密碼 | `/admin` |
| 未登入訪客 | 不需登入 | 可瀏覽公開 B2C 網站 |

## 路由權限

| 身分 | `/`、`/products` | `/cart`、`/checkout` | `/business/*` | `/admin` |
| --- | --- | --- | --- | --- |
| 未登入訪客 | 允許 | 允許展示流程 | 導向 `/login` | 導向 `/login` |
| B2C 會員 | 允許 | 允許 | 拒絕並導回 `/` | 拒絕並導回 `/` |
| 有效 B2B 公司 | 導向 `/business` | 拒絕並提示先登出企業帳號 | 允許 | 拒絕並導向 `/business` |
| 停用 B2B 公司 | 無法登入，提示帳號未啟用 | 不適用 | 不適用 | 不適用 |
| 有效 Admin | 可查看展示流程 | 可查看展示流程 | 不使用 B2B 客戶功能 | 允許 |

## Admin 入口規則

- 前台導覽不顯示 Admin、後台或管理者登入入口。
- Admin 透過同一個 `/login` 使用 Email + 密碼登入。
- 伺服器確認使用者存在於啟用的 `app_admins` 後，才導向 `/admin`。
- `/admin` 設定 `noindex`；直接輸入網址的未授權使用者必須被拒絕。

## B2B 資料歸屬規則

```text
B2B 登入成功
→ 伺服器依 Supabase Auth identity 找到 companies 資料
→ 取得 company_id、client_code、is_active
→ 依客戶代碼前綴規則推導 tier、channel
→ 寫入詢價與事件的當下快照
```

- 前端不得提交或決定 `company_id`、`client_code`、`tier`、`channel`。
- 伺服器必須忽略前端同名欄位，僅採用登入 session 與資料庫推導結果。
- B2B 使用者只能讀取自己公司的詢價與公司範圍資料。
- 不保存 B2B 個人採購、門市或分店識別資訊。

## 驗收案例

- [ ] 未登入者進入 `/business/catalog` 時被導向 `/login`。
- [ ] B2C 會員進入 B2B 路由時被拒絕並導回 `/`。
- [ ] B2B 使用者進入 `/cart` 或 `/checkout` 時被拒絕並收到提示。
- [ ] 停用公司無法登入。
- [ ] 未列入 `app_admins` 的使用者無法進入 `/admin`。
- [ ] 前端無法偽造其他公司的 `company_id`、tier 或 channel。

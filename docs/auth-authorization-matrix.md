# 登入與權限矩陣

> 狀態：基礎矩陣已於 2026-08-10 確認；Admin 本週 P1 於 2026-08-25 定稿。B 負責實作；A、C 依此進行前端與後台整合。

## 登入方式

| 身分 | 登入資料 | 登入成功後 |
| --- | --- | --- |
| B2C 會員 | Email + 密碼 | 留在 B2C 流程 |
| B2B 公司使用者 | 外部系統提供的客戶代碼（Z/E/W＋6 碼數字）+ 公司共用密碼 | `/business/catalog`；查看自己的詢價紀錄、修改自己的密碼 |
| Admin | Email + 密碼 | `/admin` |
| Business staff | Email + 密碼 | `/admin/business` |
| 未登入訪客 | 不需登入 | 可瀏覽公開 B2C 網站 |

## 路由權限

| 身分 | `/`、`/products` | `/cart`、`/checkout` | `/business/*` | `/admin` |
| --- | --- | --- | --- | --- |
| 未登入訪客 | 允許 | 允許展示流程 | 導向 `/login` | 導向 `/login` |
| B2C 會員 | 允許 | 允許 | 拒絕並導回 `/` | 拒絕並導回 `/` |
| 有效 B2B 公司 | 導向 `/business` | 拒絕並提示先登出企業帳號 | 允許 | 拒絕並導向 `/business` |
| 停用 B2B 公司 | 無法登入，提示帳號未啟用 | 不適用 | 不適用 | 不適用 |
| 有效 Admin | 可查看展示流程 | 可查看展示流程 | 不使用 B2B 客戶功能 | `/admin` 與 `/admin/business` 皆允許 |
| 有效 business_staff | 可查看展示流程 | 可查看展示流程 | 不使用 B2B 客戶功能 | 僅允許 `/admin/business` |

## Admin 入口規則

- 前台導覽不顯示 Admin、後台或管理者登入入口。
- Admin 透過同一個 `/login` 使用 Email + 密碼登入。
- 伺服器確認使用者存在於啟用的 `app_admins` 後，依 `role` 將 `admin` 導向 `/admin`、`business_staff` 導向 `/admin/business`。
- `/admin` 設定 `noindex`；直接輸入網址的未授權使用者必須被拒絕。
- P1 只驗證 `business_staff` 可進入 `/admin/business`、可操作 B2B 商品狀態與 RFQ，且不得進入 `/admin` 或其他 Admin API；管理帳號新增、角色調整與停用列為 P2。

## B2B 資料歸屬規則

```text
B2B 登入成功
→ 伺服器依 Supabase Auth identity 找到 companies 資料
→ 取得 company_id、client_code、is_active
→ 依客戶代碼前綴規則推導 tier、channel
→ 寫入詢價與事件的當下快照
```

- B2B 會員前端不得提交或決定 `company_id`、`tier`、`channel`；Admin 建立企業會員時可提交外部系統提供的完整 `client_code`，伺服器必須驗證 `^[ZEW][0-9]{6}$` 與唯一性。
- `client_code` 建立後不可修改；系統不得自動產生、補號或替換外部客戶代碼。
- 伺服器必須忽略前端同名欄位，僅採用登入 session 與資料庫推導結果。
- B2B 使用者只能讀取自己公司的詢價與公司範圍資料。
- B2B 使用者只能修改自己的登入密碼，不能修改或刪除企業資料；密碼修改需驗證目前密碼。
- 不保存 B2B 個人採購、門市或分店識別資訊。

## 驗收案例

- [ ] 未登入者進入 `/business/catalog` 時被導向 `/login`。
- [ ] B2C 會員進入 B2B 路由時被拒絕並導回 `/`。
- [ ] B2B 使用者進入 `/cart` 或 `/checkout` 時被拒絕並收到提示。
- [ ] 停用公司無法登入。
- [ ] 未列入 `app_admins` 的使用者無法進入 `/admin`。
- [ ] `business_staff` 可進入 `/admin/business`，但無法進入 `/admin` 或其他 admin API。
- [ ] 前端無法偽造其他公司的 `company_id`、tier 或 channel。
- [ ] Admin 建立企業會員時可輸入唯一客戶代碼，建立後無法修改。
- [ ] B2B 使用者只能查看自己的詢價紀錄，並可驗證目前密碼後修改密碼。

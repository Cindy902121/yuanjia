# Supabase Auth 與 RLS 安全契約

最後核對：2026-08-30
Supabase project ref：`ixggooilggtesdrmjeon`

本文件把 hosted Auth 的手動設定、資料庫 RLS 邊界與驗證方式放在同一處。Hosted
Auth 設定不屬於 SQL migration；因此 repository 能提供操作流程與驗證契約，但
不能把 Dashboard 的開關誤當成已部署的 migration。

## 1. Leaked-password protection

### 目前狀態

- [x] 本專題目前使用 Supabase 免費方案；已接受該方案不提供
  leaked-password protection 的限制。2026-08-29 的 Supabase security advisor
  仍回報 `auth_leaked_password_protection` warning：
  `Leaked Password Protection Disabled`，這是本階段預期的已知限制，不列為
  MVP release blocker。
- [x] Repository 已提供 [手動設定 wizard](../scripts/enable-leaked-password-protection.sh)
  與本節操作／驗證 runbook，供未來升級到支援此功能的方案時使用。
- [x] 本期不執行 Dashboard 開關，也不以一次登入成功取代安全設定驗證；RLS
  no-policy 的 5 個 `INFO` 仍是本專案刻意的 server-only 設計，見第 2 節。

Supabase Auth 會使用 Have I Been Pwned 的 Pwned Passwords API，拒絕已知外洩的
密碼；此功能在 Pro plan 以上提供。參考 [Supabase Password security
documentation](https://supabase.com/docs/guides/auth/password-security)。

### Hosted project 操作（方案升級後的選用步驟）

> 目前免費方案的 MVP 不執行以下步驟；只有升級到支援 leaked-password
> protection 的方案後，才需要依此流程啟用並重新驗證。

1. 執行 `bash scripts/enable-leaked-password-protection.sh`，或直接開啟
   [project Auth settings](https://supabase.com/dashboard/project/ixggooilggtesdrmjeon/auth/providers)。
2. 在 Auth settings 的 password security 區塊，啟用 **Leaked password
   protection**（文件中的名稱是 Prevent the use of leaked passwords）。
3. 不要把任何 password、publishable key、secret key 或 token 貼入 wizard；
   這個流程不會要求或儲存任何 credential。
4. 回到本 task，要求重新執行 Supabase security advisor。完成條件是
   `auth_leaked_password_protection` warning 消失；不要用一次登入成功代替此項
   設定驗證。

### Self-hosted GoTrue

若部署的是 self-hosted GoTrue，而不是本文件上方的 hosted project，使用 GoTrue
環境變數：

```env
GOTRUE_PASSWORD_HIBP_ENABLED=true
GOTRUE_PASSWORD_HIBP_FAIL_CLOSED=true
```

`GOTRUE_PASSWORD_HIBP_FAIL_CLOSED=true` 代表 HIBP 查詢失敗時也拒絕密碼；若營運
政策允許服務暫時降級，可依風險決策改成 `false`。目前 repository 使用 hosted
project，`supabase/config.toml` 沒有 documented 的 HIBP CLI 欄位，因此不新增
猜測性的 local config key。

## 2. RLS no-policy 的 server-only 決策

下列 5 張表不是漏寫 policy，而是刻意不提供 `anon`／`authenticated` 的 Data API
table privilege。它們保留 RLS 作為 database-side deny-by-default 邊界，經過
route 的身份／角色驗證後，才由 server-side `createAdminClient()` 使用
`SUPABASE_SECRET_KEY` 存取。

| table | 用途 | server-side access seam |
| --- | --- | --- |
| `customer_prefix_rules` | 客戶代碼前綴、級距與通路規則 | `src/lib/customer-rules.ts`、Admin prefix-rule routes |
| `app_admins` | admin／business_staff 角色與啟用狀態 | `src/lib/auth-context.ts`、login／staff routes |
| `b2c_orders` | B2C 展示用模擬訂單 | `src/app/api/b2c/mock-orders/route.ts` |
| `b2c_order_items` | 模擬訂單品項 | `src/app/api/b2c/mock-orders/route.ts` |
| `analytics_events` | 伺服器產生的行為事件與快照 | analytics event route、Admin summary route |

Migration `20260812150001_establish_mvp_security_contract.sql` 同時做到：

- 對所有 public tables 啟用 RLS。
- 對上述表撤銷 `anon`／`authenticated` 的所有 table privileges。
- 明確授予 `service_role` table privileges；該 key 只可在 server-side 使用。
- 只對真正需要前台／企業讀取的表授予最小 `SELECT` 並建立對應 policy。

這符合 Supabase 的 RLS 與 API privilege 分層：GRANT 決定 role 能否碰到 object，
RLS policy 再限制 row；啟用 RLS 且沒有 policy 時，publishable／`anon`／
`authenticated` 不能讀到資料。參考 [RLS
documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
與 [Securing your API](https://supabase.com/docs/guides/api/securing-your-api)。

## 3. 可驗證的維護規則

新增 server-only table 時，必須同時完成：

1. migration 的 `enable row level security`。
2. `revoke all ... from anon, authenticated`。
3. 只授予 `service_role`，並在 server route 先驗證身份／角色。
4. 更新 `tests/contracts/database-contract.test.mjs` 的 access seam 契約。
5. 重新跑 `pnpm lint`、`pnpm test:contracts:static`，需要環境時再跑
   `pnpm test:contracts:real`，最後重查 Supabase security advisor。

如果未來某張表需要 client 讀取，必須另開明確的最小 `SELECT` policy、更新此矩陣
與文件，再以 advisor 與契約測試確認；不能只刪除 no-policy INFO。

## 4. 本次驗證紀錄

- Remote schema audit：17 張 public tables 均 `RLS enabled`；上述 5 張的
  policy count 為 0，`anon`／`authenticated` 的 table `SELECT` privilege 為
  false，`service_role` 具完整 table privilege。
- Static contract：server-only tables 的 RLS、revoke、service grant、無 client
  policy／grant 與實際 `createAdminClient()` seam 均已鎖定。
- Hosted Auth：免費方案限制已接受；`auth_leaked_password_protection` WARN
  預期存在，不列為本階段 release blocker。若未來升級方案，再依本文件啟用
  Dashboard 設定並重新記錄 advisor 結果與日期。

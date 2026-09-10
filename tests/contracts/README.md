# C API／資料庫契約測試

## 預設驗證

在 repository root 執行：

```bash
pnpm test:contracts
```

目前 `main` 驗收基準執行 `pnpm test:contracts` 可重現
52 pass、0 fail、9 skipped（共 61 項）。這個預設指令不會載入測試 server、Auth
identity 或隔離資料庫，因此 9 個真實整合案例會在此指令中維持 skipped；這不代表案例
尚未完成。
測試 server、Auth identity 與 fixture 均限於本機隔離環境。

2026-09-09 最新一次在本機 Supabase 與既有 Next test server 執行
`pnpm test:contracts:real`：44 pass、0 fail、0 skipped；補回 Auth 重啟後的停用公司／
第二公司 fixture identity 後，所有 real runner 案例通過，包含預設指令會 skipped 的 9 個
真實整合案例。測試使用隔離資料，動態建立的資料會清理。

2026-09-09 Admin 缺口回歸與人工驗收：

- `node --test tests/contracts/admin-auth.test.mjs tests/contracts/admin-interactions.test.mjs`：14 pass。
- `business_staff` 開啟 `/admin?tab=analytics` 後導向 `/admin/business?tab=b2b-products`，只顯示合法 B2B 模組。
- 停止本機 Supabase Auth 後開啟 `/admin/business`，顯示 `503` 與「重試」；恢復 Auth 後按重試回到 B2B 商品頁。
- 詳細案例、環境與受阻項目見 [Admin 共用互動規則與驗收案例](../../docs/admin-interaction-rules-and-acceptance.md)。

### 歷史驗收紀錄（不作為目前環境狀態）

另依 2026-08-30 團隊驗收回報，曾在安全的 hosted／staging 環境完成並通過真實
整合測試：匿名、B2C、B2B、Admin 權限矩陣、B2B 停用公司不能登入、停用商品不出現
在型錄、`W483038`／`E853699` 公司資料隔離、RFQ 公司隔離、24 個事件名稱與
payload、customer prefix fallback，以及 seed 重跑不覆蓋 Auth identity。這筆紀錄
不保存測試 URL、密碼、publishable key、secret key 或 token。

這會執行不需外部服務的 API guard、RFQ company scope、24 個事件白名單與
payload、customer prefix fallback、文件／seed 契約、RLS server-only 邊界與 P2 index migration 檢查。

目前分支已包含 baseline／security migration，因此 RLS／SQL migration 的延伸案例
已納入靜態驗證。若未載入 real runner 的測試環境，整合案例仍會依缺少的帳號、
fixture 或隔離資料庫條件顯示為 skipped；`pnpm test:contracts:real` 會載入被 Git
ignore 的 `.env.local`／`.env.test.local` 後實際執行這些案例。

預設指令未提供本機整合環境時，會有 9 個 skipped：Admin 權限矩陣／管理流程 2 個，
加上 24 個事件、停用公司、正式路由範圍、B2B Analytics 五家公司遮罩、多規格 RFQ、
跨公司隔離與 seed rerun 各 1 個。這些案例已於 2026-09-09 的本機 real runner
全部通過；完成下方 setup 後可重現該驗證，不應把預設指令的 skipped 視為待開發項目。

## CI 品質閘門

`.github/workflows/ci.yml` 會在每次 push 與 pull request 執行 `pnpm lint` 與
`pnpm test:contracts:static`。靜態契約只讀取 repository 內的 migration、route、
seed 與文件，不需要 Supabase URL、key、Auth identity 或測試 fixture；需要隔離環境
的 `pnpm test:contracts:real` 保留給本機明確執行，不在 CI 連接資料庫。

`database-contract.test.mjs` 會鎖定五張 server-only table 必須維持 RLS、不得有
`anon`／`authenticated` policy 或 table grant，並且所有現有 access seam 都透過
`createAdminClient()`。

## 隔離整合驗證（已完成；重跑時適用）

### 重建本機隔離環境

本機 Supabase 的 Postgres 在 `127.0.0.1:54322`，API 在
`127.0.0.1:54321`，Next 測試 server 預設在 `127.0.0.1:3100`。`db reset
--local` 會清除本機資料與 Auth identity；每次 reset 後請依序執行：

```bash
supabase start --yes
supabase db reset --local --yes
docker exec -i supabase_db_supabase psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/seed.b2b-test-fixtures.sql
node scripts/provision-contract-test-identities.mjs
node scripts/provision-b2b-isolation-fixture.mjs
pnpm test:contracts:real
```

兩個 provisioning script 只接受本機 Supabase URL；seed rerun 也只接受
`localhost`／`127.0.0.1` 的 Postgres URL。測試帳密與 B2B Auth 內部
Email 留在被 Git ignore 的 `.env.test.local`，不會寫入 seed 或 repository。必要欄位
另加：

```env
CONTRACT_TEST_B2B_EMAIL=b2b-contract-test@example.invalid
```

### 真實 Supabase 的本機執行

本機 Supabase 的 URL／publishable key 放在 `.env.local`；測試用的 server secret
與展示帳號放在不入 Git 的 `.env.test.local`。必要欄位如下（Admin 使用實際
Email，例如 `admin@example.com`，不是登入頁上的角色名稱）：

```env
SUPABASE_SECRET_KEY=…
CONTRACT_TEST_B2C_EMAIL=demo@yens.com.tw
CONTRACT_TEST_B2C_PASSWORD=…
CONTRACT_TEST_B2B_IDENTIFIER=Z232113
CONTRACT_TEST_B2B_EMAIL=b2b-z232113@local.test
CONTRACT_TEST_B2B_PASSWORD=…
CONTRACT_TEST_ADMIN_EMAIL=admin@example.com
CONTRACT_TEST_ADMIN_PASSWORD=…
```

執行：

```bash
pnpm test:contracts:real
```

這會啟動隔離的 Next server（預設 `127.0.0.1:3100`）、執行靜態與 API
整合契約，並清理本次建立的展示訂單、RFQ 與分析事件。若已有可用的測試
server，可設定 `CONTRACT_TEST_USE_EXISTING_SERVER=1` 與
`CONTRACT_TEST_BASE_URL` 後再執行。跨公司案例與 seed rerun 仍是可選測試，
分別需要第二家公司帳號與隔離 Postgres URL。

### Admin 管理頁與 API 驗收範圍

同一個 `pnpm test:contracts:real` 也會執行管理者驗收流程：

- 管理者可開啟 `/admin` 與 `/admin/business`；未登入會導向登入頁。
- B2C／B2B 已登入使用者進入管理頁時，會依權限分別導回 `/`／`/business`；兩個管理頁只載入並顯示各自範圍的模組。
- B2C 商品與 B2B 型錄可分別下架、確認不出現在 active 清單，再恢復上架。
- 管理者可讀取 B2C 展示訂單並更新為 `processing`。
- 管理者可新增企業會員；Admin 輸入外部公司系統提供的客戶代碼，建立後不可修改，回應不包含明文密碼。
- 新企業可用「客戶代碼＋密碼」登入；停用後登入回傳 403，恢復後可再次登入。
- 管理者可讀取企業詢價並更新為 `processing`。
- `business_staff` 可進入 `/admin/business`，管理 B2B 商品、圖片、標籤、規格選項、CSV 匯入與 RFQ；不可進入 `/admin` 或 B2C 管理 API。
- B2B 商品狀態只允許 `draft → review → published → offline` 與既定回退／重新上架轉換；CSV 任一錯誤都整批拒絕並回傳列號。

手動驗收時，建議依序操作：

1. 以 Admin Email 登入 `/login`，確認導向 `/admin`。
2. 在 `/admin` 的「B2C 商品」與 `/admin/business` 的「B2B 型錄」各選一筆商品下架，重新整理確認狀態，再上架。
3. 在「B2C 訂單」把一筆展示訂單改為「處理中」，確認重新整理後仍保留狀態。
4. 在「企業會員」新增帳號，記錄一次性顯示的客戶代碼與初始密碼；以該代碼登入驗證。
5. 停用該企業並重新登入確認被拒絕，再啟用確認恢復。
6. 在「企業詢價」將一筆詢價改為「處理中」，確認清單更新。

測試會自動刪除本次新增的企業、Auth identity、訂單、RFQ、分析事件與匯出稽核紀錄；手動
驗收建立的資料則請依環境政策自行清理，不要直接對正式資料庫執行測試指令。

### B2B Analytics 五家公司遮罩驗收

`analytics-report.integration.test.mjs` 會在本機動態建立五家 active companies，寫入
漏斗、商品瀏覽／詢價、Finder 答案與 RFQ 明細，透過 Admin summary／export API 驗證：五家公司
可見的排名、四家公司資料聚合為 `其他（已遮罩）`，以及原始商品／Finder 選項不外洩。
測試結束會刪除本次建立的企業、Auth identity、RFQ、分析事件與 `analytics_export_audits` 紀錄。

完整執行（需先確認 Supabase URL 指向 `127.0.0.1`／`localhost`）：

```bash
pnpm test:contracts:real
```

runner 會檢查 Supabase 與 Next 測試 server 都是本機網址；若設定仍指向 hosted
project，會直接停止，不會寫入遠端資料。

### 手動指定測試 server

也可以在隔離的 local/test Supabase 與 Next server 設定：

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

### B2B 停用／跨公司隔離 fixture

正常展示 seed 不會包含停用資料。需要驗收 B2B 權限時，請只在本機或隔離測試
資料庫明確執行：

```bash
psql "$CONTRACT_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/seed.b2b-test-fixtures.sql
```

這會建立三筆彼此獨立的測試情境：

- `B2B-TEST-INACTIVE-001`：`status = offline` 的 B2B 商品，沒有展示標籤。
- `E853699`：`is_active = false` 的公司，登入 API 應回傳 403，且不建立 session。
- `W483038`：`is_active = true` 的第二家公司；需由 Supabase Auth／管理 API
  建立另一個測試 user 後，才把該 user UUID 綁到這家公司。Seed 不會寫入
  `auth.users`，也不會改動既有公司的 `auth_user_id`。

若要在本機建立第二家公司登入 identity，先把測試 Email／密碼放在不入 Git 的
`.env.test.local`，再執行：

```env
CONTRACT_TEST_B2B_OTHER_EMAIL=b2b-isolation-002@local.test
CONTRACT_TEST_B2B_OTHER_PASSWORD=自行設定的本機測試密碼
```

```bash
node scripts/provision-b2b-isolation-fixture.mjs
```

helper 只接受 `127.0.0.1`／`localhost` 的 Supabase URL，會保留已存在的 Auth
identity 綁定；不會對遠端建立帳號，也不會把密碼寫入 Git。

要移除 fixture，使用精準且有 FK／Auth 保護的清理檔：

```bash
psql "$CONTRACT_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/cleanup.b2b-test-fixtures.sql
```

如果測試 RFQ 仍參照商品／公司，或公司已綁 Auth identity，清理檔會保留該列，
不會為了清理 fixture 破壞測試資料或登入身分。

套用 fixture 後，可將下列變數放在不入 Git 的 `.env.test.local`，啟用停用公司與
跨公司整合案例：

```env
CONTRACT_TEST_B2B_INACTIVE_IDENTIFIER=E853699
CONTRACT_TEST_B2B_OTHER_IDENTIFIER=W483038
CONTRACT_TEST_B2B_OTHER_PASSWORD=由隔離測試 Auth user 自行設定
```

### B2B Analytics 測試資料

一般契約測試建立的事件與 RFQ 會在測試結束時清理；若要驗收 Admin Analytics 報表，
請在同一個本機／隔離資料庫依序套用 B2B fixture、建立 `W483038` 的 Auth identity，
再套用專用 Analytics fixture：

以下命令必須在 `NEXT_PUBLIC_SUPABASE_URL` 已指向
`http://127.0.0.1:54321` 的 shell 執行；若 `.env.local` 指向遠端，請先切換到本機
Supabase 的 URL 與 secret，不要將 fixture 套用到正式專案。

```bash
psql "$CONTRACT_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/seed.b2b-test-fixtures.sql
node scripts/provision-b2b-isolation-fixture.mjs
psql "$CONTRACT_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/seed.b2b-analytics-test-fixtures.sql
```

這組資料包含兩個 session、十種 B2B 事件、兩筆 RFQ 與三筆 RFQ 明細，且可重跑；
不會由預設 `supabase/seed.sql` 自動套用，也不建立 Auth user。驗收完成後使用：

```bash
psql "$CONTRACT_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/cleanup.b2b-analytics-test-fixtures.sql
```

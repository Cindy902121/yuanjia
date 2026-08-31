# C API／資料庫契約測試

## 預設驗證

在 repository root 執行：

```bash
pnpm test:contracts
```

這會執行不需外部服務的 API guard、RFQ company scope、24 個事件白名單與
payload、customer prefix fallback、文件／seed 契約與 P2 index migration 檢查。

目前 active migration chain 已包含 baseline／security migration；RLS／SQL migration
的靜態延伸案例會直接驗證 repository 內的版本。需要實際 Supabase、Auth 或
隔離資料庫的案例，才會依環境設定顯示為 skipped。

B2C Auth 的註冊、Email 驗證、密碼重設與 Google OAuth 設定請參考
[`docs/b2c-auth-setup.md`](../../docs/b2c-auth-setup.md)。

## 隔離整合驗證（可選）

### 重建本機隔離環境

本機 Supabase 的 Postgres 在 `127.0.0.1:54322`，Next 測試 server 預設在
`127.0.0.1:3100`。`db reset --local` 會清除本機資料與 Auth identity；每次
reset 後請依序執行：

```bash
supabase start --yes
supabase db reset --local --yes
docker exec -i supabase_db_supabase psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/seed.b2b-test-fixtures.sql
node scripts/provision-contract-test-identities.mjs
node scripts/provision-b2b-isolation-fixture.mjs
pnpm test:contracts:real
```

兩個 provisioning script 只接受本機 Supabase URL；測試帳密留在被 Git ignore 的
`.env.test.local`，不會寫入 seed 或 repository。

### 真實 Supabase 的本機執行

本機 Supabase 的 URL／publishable key 放在 `.env.local`；測試用的 server secret
與展示帳號放在不入 Git 的 `.env.test.local`。必要欄位如下（Admin 使用
實際 Email，例如 `admin@example.com`，不是登入頁上的角色名稱；本機測試可使用
任意已建立的本機 Email）：

```env
SUPABASE_SECRET_KEY=…
CONTRACT_TEST_B2C_EMAIL=demo@yens.com.tw
CONTRACT_TEST_B2C_PASSWORD=…
CONTRACT_TEST_B2B_IDENTIFIER=Z232113
CONTRACT_TEST_B2B_EMAIL=b2b-z232113@local.test
CONTRACT_TEST_B2B_PASSWORD=…
CONTRACT_TEST_B2B_E_IDENTIFIER=E232114
CONTRACT_TEST_B2B_E_EMAIL=b2b-e232114@local.test
CONTRACT_TEST_B2B_E_PASSWORD=…
CONTRACT_TEST_B2B_W_IDENTIFIER=W232115
CONTRACT_TEST_B2B_W_EMAIL=b2b-w232115@local.test
CONTRACT_TEST_B2B_W_PASSWORD=…
CONTRACT_TEST_ADMIN_EMAIL=admin@example.com
CONTRACT_TEST_ADMIN_PASSWORD=…
CONTRACT_TEST_BUSINESS_STAFF_EMAIL=business-staff@example.com
CONTRACT_TEST_BUSINESS_STAFF_PASSWORD=…
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
- B2C 新商品預設下架；未設定封面圖不能上架，啟用商品不能直接刪除唯一封面圖。
- B2B 型錄可依 `draft`／`review`／`published`／`offline` 狀態轉換，並確認 active 清單篩選。
- 管理者可讀取 B2C 展示訂單並更新為 `processing`。
- 管理者可新增企業會員；後端產生 `Z`／`E`／`W`＋6 碼客戶代碼，回應不包含明文密碼。
- 新企業可用「客戶代碼＋密碼」登入；停用後登入回傳 403，恢復後可再次登入。
- 管理者可讀取企業詢價並更新為 `processing`。

手動驗收時，建議依序操作：

1. 以 Admin Email 登入 `/login`，確認導向 `/admin`。
2. 在 `/admin` 的「B2C 商品」新增一筆商品，確認預設下架；上傳封面後再上架。在 `/admin/business` 的「B2B 型錄」操作狀態轉換，重新整理確認狀態。
3. 在「B2C 訂單」把一筆展示訂單改為「處理中」，確認重新整理後仍保留狀態。
4. 在「企業會員」新增帳號，記錄一次性顯示的客戶代碼與初始密碼；以該代碼登入驗證。
5. 停用該企業並重新登入確認被拒絕，再啟用確認恢復。
6. 在「企業詢價」將一筆詢價改為「處理中」，確認清單更新。

測試會自動刪除本次新增的企業、Auth identity、訂單、RFQ 與分析事件；手動
驗收建立的資料則請依環境政策自行清理，不要直接對正式資料庫執行測試指令。

### 手動指定測試 server

也可以在隔離的 local/test Supabase 與 Next server 設定：

```bash
export CONTRACT_TEST_BASE_URL=http://127.0.0.1:3000
export CONTRACT_TEST_B2C_EMAIL='…'
export CONTRACT_TEST_B2C_PASSWORD='…'
export CONTRACT_TEST_B2B_IDENTIFIER='…'
export CONTRACT_TEST_B2B_EMAIL='…'
export CONTRACT_TEST_B2B_PASSWORD='…'
export CONTRACT_TEST_B2B_E_IDENTIFIER='E232114'
export CONTRACT_TEST_B2B_E_EMAIL='…'
export CONTRACT_TEST_B2B_E_PASSWORD='…'
export CONTRACT_TEST_B2B_W_IDENTIFIER='W232115'
export CONTRACT_TEST_B2B_W_EMAIL='…'
export CONTRACT_TEST_B2B_W_PASSWORD='…'
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

- `B2B-TEST-INACTIVE-001`：`is_active = false` 的 B2B 商品，沒有展示標籤。
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

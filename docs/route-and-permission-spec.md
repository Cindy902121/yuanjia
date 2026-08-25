# 元家企業／宅鮮配整合網站 MVP v3.0

## 最終路由與權限規格

- 文件日期：2026-08-10
- 依據：PRD v3.0 與逐題確認結果
- 適用：產品、開發、測試與驗收

## 文件目的

本文件固定 MVP 的頁面路由、角色權限、登入分流、SEO 索引、管理後台與 API 權限。未列出的成功狀態、商品詳情狀態與浮動工具均依 PRD 整合於既有頁面，不額外建立路由。

## Admin 本週 P1 定稿（2026-08-25）

本節固定本週 Admin 的交付邊界；完整 MVP 規格仍保留在下方，未列入 P1 的能力排入 P2。

### P1

- `admin` 可進入 `/admin`；`business_staff` 僅可進入 `/admin/business`，不得查看 `/admin` 或越權 API。
- B2C 商品使用 `is_active` 上架／下架；B2B 商品使用 `draft`、`review`、`published`、`offline`，只允許合法轉換，`offline` 取代硬刪除。
- Admin 可讀取與更新 B2C 展示訂單狀態，以及讀取與更新 B2B 詢價狀態。
- 建立企業會員時由 Admin 輸入完整客戶代碼（`^[ZEW][0-9]{6}$`）；伺服器驗證唯一性，建立後不可修改，不自動產生或補號。
- Admin 可修改企業名稱與啟用狀態；不提供刪除。企業會員只能查看自己的詢價紀錄、修改自己的密碼，不能修改或刪除企業資料。
- 企業會員修改密碼時必須驗證目前密碼；新密碼為 8–72 字元並確認兩次，成功後既有 session 失效並重新登入。
- `pnpm test:contracts:real` 與手動 smoke test 必須通過；驗收只使用本機或隔離測試環境。

### P2

- 商品基本資料、標籤、規格選項、圖片／Storage 與 CSV 批次匯入。
- 分析儀表板。
- 管理帳號新增、角色調整、停用與 Admin 密碼重設。

目前待補實作：企業建立 API 仍需改為接受 Admin 輸入的完整客戶代碼；B2B 會員修改密碼 API／介面尚未建立。

## 1. 角色定義

| 角色 | 定義 |
|---|---|
| 未登入 | 公開訪客，可使用 B2C 商品、購物車與展示結帳。 |
| B2C 會員 | 使用展示 Email 與密碼登入，可進入 `/user`。 |
| B2B 公司使用者 | 使用外部系統提供的 `Z/E/W`＋6 碼數字客戶代碼與公司共用密碼登入；只能查看自己公司的詢價紀錄並修改自己的密碼，詢價與行為資料以 `company_id` 歸屬。 |
| admin | 使用專屬帳號密碼從 `/login` 登入，可進入全部管理範圍；登入頁不顯示管理員選項。 |
| business_staff | 使用專屬帳號密碼從 `/login` 登入，只能進入 B2B 商品與 RFQ 管理範圍。 |

> 身分及權限必須由伺服器判斷；前端不得自行指定角色、`company_id`、客戶級距或通路。

## 2. 最終頁面路由與權限表

| 路由 | 用途 | 未登入 | B2C 會員 | B2B 公司使用者 | 管理者 | SEO／Sitemap |
|---|---|---|---|---|---|---|
| `/` | B2C 首頁 | 允許 | 允許 | 導向 `/business`，再進入型錄 | 允許瀏覽 | 可索引／加入 |
| `/about` | 品牌、企業、食安、品質與產地 | 允許 | 允許 | 允許 | 允許 | 可索引／加入 |
| `/products` | B2C 商品列表、搜尋與篩選 | 允許 | 允許 | 登出確認[^1] | 允許瀏覽 | 可索引／加入 |
| `/products/categories/[slug]` | B2C 獨立分類頁 | 允許 | 允許 | 登出確認[^1] | 允許瀏覽 | 可索引／加入 |
| `/products/tags/[slug]` | B2C 標籤商品列表 | 允許 | 允許 | 登出確認[^1] | 允許瀏覽 | 可索引；符合條件才加入[^2] |
| `/products/[slug]` | B2C 商品詳情 | 允許 | 允許 | 登出確認[^1] | 允許瀏覽 | 可索引／加入 |
| `/cart` | B2C 購物車 | 完整操作 | 完整操作 | 登出確認[^1] | 僅查看，不可修改 | `noindex`／不加入 |
| `/checkout` | 建立展示用模擬訂單 | 可建立 | 可建立 | 登出確認[^1] | 僅查看，不可建立 | `noindex`／不加入 |
| `/business/lead` | B2C 新客企業合作展示表單 | 允許 | 允許 | 可直接進入；導覽不顯示入口 | 允許 | 可索引／加入 |
| `/login` | B2C、B2B、管理者統一登入 | 顯示登入表單 | 導向 `/` | 導向 `/business/catalog` | 導向 `/admin` | `noindex`／不加入 |
| `/user` | B2C 會員中心 | 導向 `/login` | 允許 | 登出確認[^1] | 導向 `/admin` | `noindex`／不加入 |
| `/business` | B2B 自動分流入口 | 導向 `/login` | 提示後導向 `/` | 導向 `/business/catalog` | 導向 `/admin/business` | `noindex`／不加入 |
| `/business/catalog` | B2B 私有型錄 | 導向 `/login` | 提示後導向 `/` | 允許 | 導向 `/admin/business` 商品頁籤 | `noindex`／不加入 |
| `/business/product-finder` | B2B 固定需求篩選器 | 導向 `/login` | 提示後導向 `/` | 允許 | 導向 `/admin/business` 篩選器頁籤 | `noindex`／不加入 |
| `/business/rfq` | 詢價籃與過往詢價紀錄 | 導向 `/login` | 提示後導向 `/` | 僅同公司資料 | 導向 `/admin/business` 詢價頁籤 | `noindex`／不加入 |
| `/admin` | 管理後台 | 導向 `/login` | 導向 `/` | 導向 `/business` | 允許 | `noindex`／不加入 |
| `/admin/business` | B2B 管理功能 | 導向 `/login` | 導向 `/` | 導向 `/business` | 允許 | `noindex`／不加入 |
| `/admin/business/products/new` | 新增 B2B 商品 | 導向 `/login` | 導向 `/` | 導向 `/business` | admin／business_staff | `noindex`／不加入 |
| `/admin/business/products/[productId]` | 編輯 B2B 商品、標籤、規格選項與圖片 | 導向 `/login` | 導向 `/` | 導向 `/business` | admin／business_staff | `noindex`／不加入 |

[^1]: B2B 誤入 B2C 購物路由：顯示「請先登出企業帳號」。選擇登出時清除 session 並回首頁；取消時保留 session，導向 `/business` 後再進入 `/business/catalog`。
[^2]: B2C 標籤頁只有在具備內容且至少有一項有效商品時，才加入 sitemap。

## 3. 特殊路由內容

### `/user`

- 顯示 B2C 展示會員 Email 與登入狀態。
- 提供返回 B2C 首頁與登出。
- 不提供個資編輯、地址簿、密碼修改、訂單紀錄或 B2C 詢價紀錄。

### `/business/rfq`

- 同一路由以「目前詢價籃／過往詢價紀錄」頁籤切換。
- B2B 公司只能查看相同 `company_id` 的詢價紀錄。
- 同公司在不同瀏覽器使用共用帳密時，看到相同公司資料。
- 不得查看其他公司資料；不建立獨立詢價紀錄路由。

### B2B 企業會員資料

- 密碼修改沿用既有受保護的 B2B 頁面，不新增獨立路由。
- 企業會員只能查看自己的公司資料與詢價紀錄；不可修改或刪除企業資料。
- 客戶代碼由外部公司系統產生，建立時由 Admin 輸入；伺服器驗證格式與唯一性，建立後不可修改。

### `/admin`

- P1 提供企業會員、B2C 商品、B2C 模擬訂單、B2B 詢價與 B2B 商品狀態管理；分析儀表板、標籤／規格／圖片／CSV 與管理帳號管理列為 P2。
- 提供前往 `/admin/business` 的入口。

### `/admin/business`

- B2B 商品清單支援搜尋、狀態篩選、合法批次狀態轉換、圖片數量與「尚無圖片」提示。
- B2B 商品狀態為 `draft`、`review`、`published`、`offline`；只有 `published` 出現在企業型錄，`offline` 取代硬刪除。
- 商品編輯頁集中維護基本欄位、既有標籤、規格選項與圖片（P2）；商品代碼建立後不可修改。
- 圖片限制為 1 張封面、最多 5 張細節圖、JPEG／PNG／WebP、單張 5 MB 以內且必填替代文字；B2B 圖片使用短效 signed URL（P2）。
- `admin` 可管理 `business_staff` 帳號／角色（P2）；`business_staff` 不可進入其他 Admin 範圍。

## 4. 登入、導覽與登出

| 帳號類型 | 登入成功後 | 已登入時直接開啟 `/login` |
|---|---|---|
| B2C 會員 | 導向 B2C 首頁 `/` | 導向 `/` |
| B2B 公司使用者 | 導向 `/business/catalog` | 導向 `/business/catalog` |
| admin | 導向 `/admin` | 導向 `/admin` |
| business_staff | 導向 `/admin/business` | 導向 `/admin/business` |
| 停用的 B2B 公司 | 不建立 session；留在 `/login` 並顯示停用提示 | 不適用 |

停用提示：

> 公司帳號已停用，請聯絡管理人員。

### 登入後導覽

| 角色 | 登入後導覽 |
|---|---|
| B2C 會員 | 會員中心、登出 |
| B2B 公司使用者 | 企業型錄、詢價籃／詢價紀錄、登出 |
| admin | 管理後台、登出 |
| business_staff | B2B 管理後台、登出 |

所有已登入角色均不再顯示「登入」。所有角色登出後一律清除 session，並回到 B2C 首頁 `/`。

## 5. API 權限表

| API | 操作 | 未登入 | B2C 會員 | B2B 公司使用者 | 管理者 |
|---|---|---|---|---|---|
| `/api/b2c/mock-orders` | 建立展示用模擬訂單 | 允許 | 允許 | 拒絕 | 拒絕 |
| `/api/b2c/mock-orders` | 讀取模擬訂單 | 拒絕 | 拒絕 | 拒絕 | 允許 |
| `/api/b2c/mock-orders` | 更新訂單狀態 | 拒絕 | 拒絕 | 拒絕 | 允許 |

- 建立時由伺服器驗證收件人、手機、Email、配送地址與隱私權同意。
- 只能建立展示用模擬訂單，不得產生真實交易。
- 狀態限於已建立、處理中或已完成。
- 管理者透過 `/admin` 的 B2C 模擬訂單頁籤讀取及更新狀態。
- PRD 未指定 HTTP 方法；本文件只固定操作權限，不自行增加 API 端點。

## 6. 不建立獨立路由的功能

| 功能 | 呈現位置 |
|---|---|
| B2B 商品詳情 | `/business/catalog` 內的詳情狀態 |
| 結帳成功 | `/checkout` 的成功狀態 |
| 詢價成功 | `/business/rfq` 的成功狀態 |
| B2C 浮動需求工具 | 所有 B2C 頁面上的對話框 |
| B2B 過往詢價 | `/business/rfq` 的頁籤 |
| B2B 管理商品、篩選器與詢價 | `/admin/business` 的頁籤 |
| 其他管理後台模組 | `/admin` 的頁籤 |

## 7. 相較 PRD 的確認調整

- 新增獨立 B2C 分類路由 `/products/categories/[slug]`。
- 新增最小版 B2C 會員中心 `/user`。
- 管理者使用統一 `/login` 與專屬帳密，登入頁不顯示管理員選項。
- 新增 `/admin/business`，集中處理 B2B 管理功能。
- `/business/rfq` 增加過往詢價紀錄頁籤。
- 管理者不能實際操作購物車或建立模擬訂單。
- B2B 誤入 B2C 購物路由時先提供登出選擇。
- `/login`、`/cart`、`/checkout`、`/user` 均為 `noindex`，且不加入 sitemap。

> 本文件已涵蓋 PRD Sitemap、路由權限、登入分流、管理後台、B2B 詢價、B2C 結帳、SEO 索引及逐題確認結果，可作為後續開發、測試與驗收基準。

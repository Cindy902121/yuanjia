# 資料庫設計與契約

> 狀態：schema 已建立；C API、契約驗證與遠端 RFQ 公司隔離已完成，完整 HTTP
> 整合測試仍待補上測試環境 URL。
> 遠端 Supabase 已套用 `20260812150000_baseline_remote_schema` 與
> `20260812150001_establish_mvp_security_contract`；展示資料由可重跑的
> `supabase/seed.sql` 管理。這份文件是目前欄位、資料歸屬與權限的索引，
> 不是尚未建立的草案。

## 不可違反的規則

1. B2B 資料歸屬公司，不記錄公司內的個人採購或分店身分。
2. 網站不保存 ERP 客戶名單、成本、底價、成交資料或明文密碼。
3. B2B 的 `company_id` 必須從登入 session 取得，前端不得自行指定。
4. B2C 與 B2B 商品、標籤與篩選條件必須分開。
5. 每張對外資料表都要同時有：最小必要授權、RLS、明確政策與測試案例。

## 第一版資料表

| 資料表 | 用途 | 主要負責人 | 網站是否直接讀寫 |
| --- | --- | --- | --- |
| `companies` | B2B 公司、登入 identity、客戶代碼、啟用狀態 | B | 僅登入後依權限讀取 |
| `customer_prefix_rules` | 客戶代碼前綴對應級距與通路 | C | 僅管理者 |
| `b2c_products` | B2C 展示商品與公開內容欄位 | A | 公開讀取；管理者維護 |
| `b2b_products` | B2B 私有型錄，不含價格 | B | 只限 B2B／管理者讀取 |
| `b2b_product_spec_options` | B2B 商品可供詢價的規格／包裝選項 | B | B2B 讀取；管理者／seed 維護 |
| `b2c_tags`、`b2b_tags` | 兩套固定標籤清單 | A／B | 對應商品範圍讀取 |
| `b2c_product_tags`、`b2b_product_tags` | 商品與標籤的多對多關聯 | A／B | 依商品權限讀取 |
| `b2b_rfqs` | B2B 詢價單主檔與公司快照 | B | 同公司與管理者 |
| `b2b_rfq_items` | 詢價單品項、數量、單位與備註 | B | 同公司與管理者 |
| `b2c_orders` | B2C 展示用模擬訂單主檔 | A | 只限伺服器與管理者 |
| `b2c_order_items` | 模擬訂單品項 | A | 只限伺服器與管理者 |
| `analytics_events` | 不含個資的 B2C／B2B 行為事件 | C | 伺服器寫入；管理者讀取 |

## 主要關係

```text
companies 1 ── * b2b_rfqs 1 ── * b2b_rfq_items
b2b_products 1 ── * b2b_rfq_items
b2b_products 1 ── * b2b_product_spec_options 1 ── * b2b_rfq_items

b2c_products * ── * b2c_tags
b2b_products * ── * b2b_tags

b2c_orders 1 ── * b2c_order_items
b2c_products 1 ── * b2c_order_items
```

## 三人各自確認的項目

### A：B2C／體驗

- [ ] B2C 商品必填欄位：名稱、品牌、分類、規格、價格、來源／產地、保存方式、描述。
- [ ] B2C 額外欄位：食品安全、認證／品質、模擬庫存與展示提醒。
- [ ] B2C 標籤群組：食材、料理方式、需求特性、加工方式。
- [ ] 結帳所需欄位：收件人、手機、Email、配送地址與隱私同意。

### B：B2B／權限

- [ ] 一家公司只對應一個 Supabase Auth identity。
- [ ] 公司欄位包含客戶代碼、名稱、啟用狀態與 identity；不保存共用密碼明文。
- [ ] B2B 商品不含任何價格欄位。
- [ ] 詢價送出時由伺服器填入 `company_id`、客戶級距與通路快照。

### B2B 多規格詢價

- `b2b_products.specification`／`packaging` 保留作為既有商品摘要；可選的詢價規格存於 `b2b_product_spec_options`。
- 每個規格選項包含 `specification_text`、`packaging_text`、`is_active` 與 `display_order`，並以 `option_code` 作為 seed 的穩定業務鍵。
- `b2b_rfq_items` 保留 `product_id`、`quantity`、`unit`、`item_note`，另以 `specification_option_id` 或 `other_specification`／`other_packaging` 識別客戶選擇。
- `specification_text_snapshot`／`packaging_text_snapshot` 保存送出當下文字；價格、庫存、供應能力與客製結果仍由業務確認，不進入前台 API。

API contract：B2B 商品與商品篩選 API 的每個商品會附上
`specification_options: [{ id, product_id, option_code, specification_text, packaging_text, is_active, display_order }]`；
RFQ `POST` 的 `items` 可在同一個 `product_id` 下送出多筆不同的
`specification_option_id`，也可送出不帶 option id、但帶
`other_specification`／`other_packaging` 的其他規格明細。RFQ `GET` 會回傳
`specification_text_snapshot`／`packaging_text_snapshot` 與其他文字欄位，讓歷史詢價不受選項後續修改影響。

### C：後台／分析／整合

- [x] 前綴規則包含前綴、級距、通路與啟用狀態。
- [x] 後台可維護代表性商品、套用既有標籤、查看詢價與模擬訂單。
- [x] 事件資料不包含姓名、電話、Email、完整客戶代碼或 company_id。
- [x] 分析篩選項：日期、級距、通路、產品、分類與品牌。

#### C1. 前綴規則與客戶分類

- `customer_prefix_rules` 的 `prefix`、`tier_label`、`channel_label`、`is_active` 均為必要業務欄位；`prefix` 唯一且建立後不可修改。
- 規則只負責將既有 `client_code` 分類，不控制客戶代碼產生、登入或帳號啟用；代碼格式仍為 `^[ZEW][0-9]{6}$`，登入權限仍由 `companies.is_active` 控制。
- 比對只使用啟用中的規則，採最長前綴優先；較長規則停用時回退到下一個較短的啟用中規則；全部失配時，級距與通路皆為 `unclassified`。
- 管理者可新增規則、編輯級距／通路／啟用狀態與停用規則；不硬刪除、不修改既有前綴。級距／通路標籤修改後，舊事件與詢價保留舊快照，新資料才使用新標籤。

#### C2. 後台維護與商品內容

- 所有後台 API 都必須在伺服器重新驗證 `app_admins` 管理者權限。
- B2C 商品可新增、編輯所有業務欄位：`slug`、名稱、品牌、分類、規格、價格、產地、保存方式、描述、食安資訊、品質／認證資訊、模擬庫存與圖片；B2B 商品可新增、編輯 `product_code`、名稱、品牌、分類、規格、包裝、產地、保存方式、描述與圖片，永不加入價格欄位。
- B2C `slug`、B2B `product_code` 建立後不可修改；新增時必須驗證格式與唯一性。所有 `NOT NULL` 欄位必填並去除前後空白，價格與模擬庫存不得為負數，模擬庫存必須為整數。
- 後台的商品刪除為軟刪除（`is_active = false`），保留訂單／詢價歷史參照；後台可查詢已停用商品，前台不讀取停用商品。
- 商品描述、食安資訊與品質／認證資訊均可由後台編輯；產品特色先使用既有 `description` 欄位，不新增 `short_description` 或 `features` 欄位。
- 商品新增／編輯表單可用 `tag_ids` 整批取代標籤關聯；只能套用同一通路且已啟用的既有標籤，空陣列代表清除全部標籤，不提供後台建立新標籤。
- B2B 商品編輯頁可新增、編輯、停用與排序多規格詢價選項；`option_code` 唯一且建立後不可修改，不包含價格、庫存或供應能力。選項文字修改不得回寫既有 RFQ 的文字快照。

#### C3. 商品圖片與 B2B 批量新增

- 每項商品最多 1 張封面圖與 5 張細節圖；每張圖有 `cover`／`detail` 角色、`alt` 文字與排序。後台可上傳、替換、刪除、排序與編輯 `alt`；刪除時同步刪除資料列與 Storage 物件，商品可暫時沒有圖片並顯示佔位圖。
- 上傳只接受 JPEG、PNG、WebP，每張最多 5 MB；伺服器驗證 MIME type、副檔名與 `alt`，不接受 SVG。
- B2C 圖片可公開讀取；B2B 圖片必須私有儲存，由有效企業 session 或管理者取得短效 signed URL，不提供永久公開 URL。
- B2B 批量新增使用 UTF-8 CSV，單次最多 500 列、10 MB；一列代表一個商品，只匯入 `b2b_products` 基本欄位，不含價格、圖片、標籤或規格選項。
- CSV 必須先完整驗證，任一列有格式錯誤、必填欄位錯誤或既有／檔內 `product_code` 重複時整批拒絕並回傳列號錯誤；全部通過後以單一 transaction 建立，不覆寫或跳過既有商品。

#### C4. 詢價與模擬訂單後台

- 管理者可查看所有公司的 RFQ 主檔、公司名稱／客戶代碼、級距／通路快照、品項、規格快照、數量與備註；可依 `new`／`processing`／`closed` 篩選並只更新狀態，不刪除或改寫客戶送出的內容，也不處理價格。
- 管理者可查看模擬訂單的收件資訊、品項、數量、下單金額與隱私同意時間；可依 `created`／`processing`／`completed` 篩選並只更新狀態，不編輯收件資料、品項或金額。
- 模擬訂單始終是展示資料，不涉及真實付款、出貨或正式訂單。

#### C5. 事件隱私與行為分析

- 分析事件只接受白名單內的 `event_name` 與選填 `product_id`；`surface`、`occurred_at`、`product_reference`、`product_category`、`product_brand`、`customer_tier_snapshot`、`channel_snapshot` 均由伺服器產生。
- B2B 事件的級距／通路由登入 session 的客戶代碼前綴解析；B2C 事件的級距／通路為 `NULL`。不保存 `customer_prefix_snapshot`。
- 事件不得保存姓名、電話、Email、完整客戶代碼、客戶代碼前綴、`company_id`、使用者 ID、IP、Cookie 或 session token；`product_reference` 僅為商品 UUID。
- 級距／通路與商品分類／品牌均為事件發生當下的快照；規則或商品內容日後修改時，舊事件不重分類，新事件才使用新值。
- 分析篩選只作用於 `analytics_events` 的網站行為統計，不延伸套用到 RFQ 數量／商品排名；`surface`（`b2c`／`b2b`）與 `channel_snapshot`（客戶通路）是不同維度。
- 篩選條件為日期、級距、通路、產品、分類與品牌；每個條件先接受單一值，跨欄位採 `AND`。產品以 `product_reference` UUID 篩選；分類／品牌以事件快照完全相等比對，歷史上曾出現的值仍可選取。
- 日期以 `Asia/Taipei` 日曆日解讀，`date_from` 與 `date_to` 均包含整日，伺服器轉換為 UTC 查詢 `timestamptz`。無符合資料回傳 `200`、零值與空集合；格式錯誤或不存在的篩選值回傳 `400`。

> 本節的 `[x]` 代表需求與驗收規格已確認，不代表本次已完成所有新增 API、UI、Storage 與 migration。商品 CRUD、圖片、CSV 批量匯入與前綴規則管理仍須依本節另行實作與測試。

## 建立狀態與下一步

- [x] 資料表欄位、資料型別、外鍵與 trigger 已建立。
- [x] 所有 public table 已啟用 RLS；公開 B2C 讀取、B2B 公司讀取、同公司 RFQ 讀取與 server-only 寫入邊界已建立。
- [x] 展示資料改由 `supabase/seed.sql` 以穩定業務鍵重跑；seed 不建立或覆寫 Supabase Auth identity。
- [x] B2B 多規格選項由獨立 migration 建表，展示選項由 `supabase/seed.sql` 可重跑建立。
- [x] C API 與 B 的登入／前端整合已完成目前可驗證範圍；契約測試涵蓋權限矩陣、事件、隔離、fallback 與 seed 靜態契約，遠端 RFQ 公司隔離測試亦已通過。完整 HTTP 整合測試仍待設定 `CONTRACT_TEST_BASE_URL`。

### B2B 客戶代碼規則

- `client_code` 由後端產生，格式固定為 `^[ZEW][0-9]{6}$`。
- `Z` 代表月營業額 20 萬以下、`E` 代表月營業額 50 萬以下、`W` 代表其他。
- 登入畫面只要求客戶代碼與公司共用密碼；Supabase Auth 的內部 Email identity 不對企業客戶公開。
- [x] P2 外鍵索引 migration 已套用：`20260814032551_add_missing_foreign_key_indexes`；不阻塞功能整合。

### 後續整合備註

- PR #1 的 B2C 擴充 schema 已合併至 GitHub，但目前不直接套用至遠端；其中新增的分類、圖片與認證資料表超出目前 PRD／FDD 的 MVP 資料模型，待 A／B 確認需求後另行拆分。
- `CONTRACT_TEST_BASE_URL` 與隔離測試資料庫尚未設定前，不宣稱 6 個 HTTP／seed 整合測試全部完成。

在此之前，不建立 ERP 串接、CRM、團購、真實金流、正式訂單或個人 B2B 帳號。

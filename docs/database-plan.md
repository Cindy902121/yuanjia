# 資料庫設計與契約

> 狀態：schema 已建立，功能整合與契約驗證進行中。
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
| `companies` | B2B 公司、登入 identity、啟用狀態 | B | 僅登入後依權限讀取 |
| `customer_prefix_rules` | 客戶代碼前綴對應級距與通路 | C | 僅管理者 |
| `b2c_products` | B2C 展示商品與公開內容欄位 | A | 公開讀取；管理者維護 |
| `b2b_products` | B2B 私有型錄，不含價格 | B | 只限 B2B／管理者讀取 |
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

### C：後台／分析／整合

- [ ] 前綴規則包含前綴、級距、通路與啟用狀態。
- [ ] 後台可維護代表性商品、套用既有標籤、查看詢價與模擬訂單。
- [ ] 事件資料不包含姓名、電話、Email、完整客戶代碼或 company_id。
- [ ] 分析篩選項：日期、級距、通路、產品、分類與品牌。

## 建立狀態與下一步

- [x] 資料表欄位、資料型別、外鍵與 trigger 已建立。
- [x] 所有 public table 已啟用 RLS；公開 B2C 讀取、B2B 公司讀取、同公司 RFQ 讀取與 server-only 寫入邊界已建立。
- [x] 展示資料改由 `supabase/seed.sql` 以穩定業務鍵重跑；seed 不建立或覆寫 Supabase Auth identity。
- [ ] C API 與 B 的登入／前端整合測試完成（本分支的契約測試涵蓋矩陣、事件、隔離、fallback 與 seed 靜態契約）。
- [ ] P2 外鍵索引 migration 審核後再套用；不阻塞功能整合。

在此之前，不建立 ERP 串接、CRM、團購、真實金流、正式訂單或個人 B2B 帳號。

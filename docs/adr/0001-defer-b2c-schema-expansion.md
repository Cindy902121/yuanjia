# ADR-0001：B2C schema 擴充延後至 MVP 之後

- Status：Accepted for current MVP
- Date：2026-08-29
- Scope：B2C catalog schema、展示 seed 與 analytics metadata；不改動已落地的
  B2B schema、現有 B2C RLS 或已建立的 B2C image table。

## Context

目前 linked remote project 的 `b2c_products` 有 5 筆 MVP 展示資料，active migration
已建立 `b2c_product_images` 與 `b2c-media` Storage；但尚未建立
`b2c_categories`、`b2c_certifications`、featured 關聯或
`analytics_events.metadata`。`b2c_products.category` 仍是自由文字，`specification`
仍是單一文字欄位，`quality_info` 仍是可為空的自由文字。

`docs/B2C商品展示資料.md` 第 2～5 章描述 12 筆較完整的展示資料、獨立 unit、分類
slug、結構化認證與較豐富的事件參數。那些內容是候選產品／元件驗收規格，不等於
目前 remote schema 或已部署 seed。

## Decision

在目前 MVP 週期維持 remote active schema 為 source of truth，延後 B2C schema
擴充，不新增另一支 migration 來追 12 筆文件資料。具體決定如下：

- 保留現有 `b2c_products` 欄位與 5 筆 remote 展示資料，不在本期做 12 筆完整
  backfill 或改寫現有 slug／標籤。
- 不新增 `b2c_categories`、`b2c_product_categories`、`b2c_certifications`、
  `b2c_product_certifications`、featured 欄位或其他同等 normalized tables。
- 不新增獨立 `unit`、`analytics_events.metadata` 或個別事件參數欄位；沿用目前
  API 可保存的欄位與文件中已標示的限制。
- 已存在的 `b2c_product_images` 與 Storage 不回退；圖片資料接線可在既有 schema
  內另行處理，不代表本 ADR 同意新增分類／認證 schema。
- 公開 B2C 仍只讀取 `is_active = true`；不為了區分「不存在／已下架」而放寬
  現有 public RLS。若要在前台顯示 inactive，另開 server-only API 並另行評估。
- 12 筆文件案例保留為未來需求與驗收參考；本期執行案例以 remote 現有 5 筆替換
  示範品項，並在文件中明確標示。

## Why now

- 現有 API／seed／real contract 已對齊 active schema；立即擴充會同時改變資料模型、
  seed、mapper、RLS 與驗收資料，風險與範圍不成比例。
- 分類與認證的 canonical vocabulary、資料 backfill 與 owner 尚未確定；先凍結
  schema 可避免把暫定的展示文字變成難以回溯的正式資料。
- 保留現有 image extension 與明確的 future triggers，讓之後可用獨立 migration
  審查，不阻塞目前 MVP。

## Consequences

正面：

- current MVP 的 remote schema、seed、API 與契約測試維持一致。
- 12 筆內容不會被誤報成已部署，且新的 schema migration 不會在需求未定前進入
  remote。
- 之後可把分類／認證／事件 metadata 當成一個有 backfill、rollback、RLS 與
  contract test 的獨立 change set。

代價：

- 前台分類先依現有自由文字與既有固定 mapping／backend slug 處理。
- public client 無法區分不存在與 inactive；只有 server-side privileged seam 能
  查到 inactive row。
- 目前 analytics 不能保存所有文件列出的搜尋／位置參數，只保存既有欄位。

## Revisit triggers

重新開 schema 變更前，至少要有：

1. A／B 確認 canonical category、tag、certification vocabulary 與 12 筆資料
   的 owner。
2. 明確的 relational model、backfill mapping、rollback 與 production rollout。
3. 對 public／authenticated／server-only 讀寫邊界的 RLS、GRANT、API contract
   與 real fixture 驗收。
4. 有實際產品搜尋、報表、內容治理或媒體 metadata 需求，證明自由文字欄位已
   成為瓶頸。

## Evidence

- [B2C 商品展示資料](../B2C商品展示資料.md)
- [資料庫設計與契約](../database-plan.md)
- [Supabase migration 歷史整理](../supabase-schema-alignment.md)
- Active source：`supabase/migrations/20260812150000_baseline_remote_schema.sql`、
  `supabase/migrations/20260825024950_add_admin_catalog_media_and_management.sql`

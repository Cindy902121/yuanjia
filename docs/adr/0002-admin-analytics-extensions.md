# ADR-0002：Admin Analytics 採共用聚合匯出與受限客戶下鑽

- Status：Accepted
- Date：2026-09-11
- Scope：B2B Admin Analytics 的常用篩選、排程匯出、異常告警與客戶明細下鑽。

本次確認覆寫既有「不提供單一公司下鑽」的 Analytics 邊界，但不開放原始事件。
只有 `admin` 可以查看單一企業的最小可用明細；`business_staff` 維持只能管理 B2B
商品與 RFQ。排程與手動 CSV 一律只輸出聚合資料，客戶明細只在後台畫面分頁顯示，
不含 Auth email、user ID、session ID 或原始 `event_data`。

## Decision

- 常用篩選由所有 Admin 共用，保存日期與查詢條件；快捷日期保存為動態規則，自訂日期保存固定日期，名稱不得重複。
- 客戶下鑽從未遮罩的報表結果進入，保留目前日期與篩選；伺服器分頁每頁 50 筆，依最後活動時間新到舊，支援企業名稱與客戶代碼搜尋。
- 排程提供每日／每週／每月與台北時間設定，預設 08:00；條件保存為獨立快照。Vercel Cron 每 5 分鐘呼叫受保護的 server job，錯過不補跑，失敗每 5 分鐘重試最多 3 次。
- 排程 CSV 只含聚合資料，放在私有 Supabase Storage 30 天；稽核 metadata 保留，所有 Admin 共用排程管理。
- 異常告警只顯示在共用 Admin 告警中心。告警去重至恢復，狀態為未讀／已確認／已恢復；任何 Admin 可確認。

## Considered Options

- 保留原本不提供下鑽：拒絕，因已確認 Admin 需要單一企業的可識別營運明細。
- 將可識別明細放入排程 CSV：拒絕，會擴大檔案外流與保存風險；排程維持聚合輸出。
- Supabase `pg_cron` 加 Edge Function：暫不採用；目前應用已有 Next.js server-side Analytics seam，先以 Vercel Cron 延伸，避免新增另一個 runtime。

## Consequences

這項決策需要新增 server-only 的篩選、排程、匯出檔案與告警資料邊界，以及 Admin UI、Storage 生命週期、排程鎖與驗收案例。既有少於 5 家企業遮罩、24 個月原始事件保留與 Admin API 授權仍然有效。

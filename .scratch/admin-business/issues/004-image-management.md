# Ticket 004：B2B 商品圖片上傳與管理

- Status: done
- Depends on: 002
- Blocks: 005

## Goal

在商品編輯頁提供完整的 B2B 圖片管理，讓使用者能立即上傳、替換、刪除、排序並補齊替代文字。

## Scope

- 顯示 1 張封面大圖與最多 5 張細節縮圖。
- 支援拖曳／選檔上傳；新上傳預設為細節圖，設定封面需明確操作。
- 圖片操作立即寫入，不與商品欄位的主儲存按鈕綁在一起。
- 支援替換、刪除、排序與 inline 編輯替代文字。
- 前端先提示 JPEG／PNG／WebP、單張 5 MB、替代文字必填與數量上限；伺服器回應仍是最終驗證。
- B2B 圖片只使用短效 signed URL；Storage 清理失敗時保留警告與重試入口。

## Acceptance criteria

- 無圖片時直接顯示可操作的上傳空狀態，不只顯示「尚無圖片」。
- 上傳、替換、刪除、排序成功後畫面與圖片數立即一致。
- 檔案格式、大小、替代文字、封面重複與細節圖上限錯誤都能在對應位置說明。
- 刪除有確認步驟；上傳失敗不留下孤兒資料列或 Storage 物件。
- 拖曳排序之外，仍提供鍵盤可操作的上下移動方式。

## Non-goals

- B2C 圖片管理、圖片裁切／編輯器、永久公開 URL 與 CSV 匯入。

## Validation

- 圖片限制、signed URL、替換清理、孤兒檔案回復、排序與權限整合測試。

## Implementation notes

- `ProductImageManager` 提供 B2B 封面／細節圖片的選檔與拖曳上傳、替換、刪除確認、inline 替代文字、拖曳排序與鍵盤上下移動。
- 圖片操作走獨立 API，B2B 使用 `requireBusinessAdmin`；B2B Storage 維持 private bucket 與 600 秒 signed URL。
- 上傳、替換與刪除的 Storage 清理失敗會回傳 path，畫面提供重試清理；清理端點拒絕刪除仍被資料列引用的物件。
- `pnpm test:contracts`：23 pass、10 skipped；`pnpm exec tsc --noEmit`、`pnpm lint`（0 errors）、`pnpm build` 通過。
- `pnpm test:contracts:real` 可啟動本機 Next.js，但現有測試帳密造成 8 項登入 401；seed rerun 仍受既有 `b2c_products.short_description` not-null 資料問題阻塞。

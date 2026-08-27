# Ticket 005：B2B 商品維護整體 hardening 與驗收

- Status: partial（UI hardening 完成；E2E／real integration 待環境可用後補驗）
- Depends on: 001、002、003、004
- Blocks: none

## Goal

把商品清單、編輯表單、規格與圖片流程收斂成可交付的 `/admin/business` 工作介面。

## Scope

- 桌面優先；窄螢幕將資料表轉為堆疊列、編輯頁轉單欄、圖片改為兩欄縮圖。
- 所有互動元件補齊 default、hover、focus、disabled、loading、error 與成功狀態。
- 補 skeleton、空狀態、aria-live 回饋、鍵盤流程、focus 管理與離開 dirty form 提示。
- 確認暖白／深色／海洋藍的對比度、44px 操作區與 reduced-motion 行為。
- 以現有 B2B 頁面與共用 token 做視覺一致性檢查，不另造新品牌元件。
- 執行權限、HTTP、圖片與 responsive 驗收，整理剩餘問題。

## Acceptance criteria

- 從清單到新增／編輯／圖片管理的完整流程可用，且不需要進入 B2C 頁面。
- `admin` 與 `business_staff` 的可操作範圍符合權限規格；未登入與 B2C 使用者被正確導回。
- 桌面與手機窄版均可完成核心操作，沒有水平溢出或被遮住的固定操作列。
- 鍵盤與螢幕閱讀器可完成搜尋、編輯、儲存、圖片操作與錯誤重試。
- lint、型別檢查、契約測試與 real local Supabase 整合測試通過。

## Non-goals

- CSV 批量匯入、B2C 管理介面、RFQ 管理介面與新的資料模型。

## Validation

- 撰寫 `/admin/business` 端到端驗收案例與必要的 API／元件測試。
- 以既有 B2B 視覺風格做一次 UI review，確認清單密度、表單層級與圖片狀態一致。

## Implementation notes

- B2B 商品清單在窄螢幕改用可搜尋、可選取的堆疊列；桌面保留資料表，並維持新增、編輯、批次狀態與重新整理入口。
- 編輯表單與圖片管理補上窄版防溢位、44px 操作區、可見 focus、reduced-motion skeleton、錯誤焦點管理與商品／圖片載入重試。
- 圖片細節縮圖在手機維持兩欄；成功、失敗、空狀態與 dirty form 回饋沿用現有 B2B 色彩與元件語彙。
- `pnpm test:contracts`：24 pass、10 skipped；目前以既有 static contract smoke 覆蓋 responsive／keyboard conventions；專案未配置瀏覽器 E2E runner。
- `pnpm exec tsc --noEmit`、`pnpm lint`（0 errors）、`pnpm build` 通過。
- real local Supabase suite 仍受既有測試帳密回 401 與 seed 的 `b2c_products.short_description` not-null 資料問題阻塞，未宣稱整合測試通過。

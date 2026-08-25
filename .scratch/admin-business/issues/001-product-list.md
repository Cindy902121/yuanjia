# Ticket 001：B2B 商品清單與狀態批次操作

- Status: done
- Depends on: none
- Blocks: 002、003、004

## Goal

把 `/admin/business` 從目前的共用 dashboard tab 整理成 B2B 商品工作台，讓 `admin`／`business_staff` 能快速找到商品並進行狀態管理。

## Scope

- 沿用現有 B2B 視覺語彙：暖白底、深色文字、海洋藍操作色、細邊框與穩定的資料密度。
- 建立搜尋、狀態篩選、結果數量與批次操作工具列。
- 使用資料表呈現縮圖、商品編號、名稱／品牌、分類、狀態、圖片數與更新時間。
- 點擊商品列進入 `/admin/business/products/[productId]`；新增商品進入 `/admin/business/products/new`。
- 批次操作只提供合法狀態轉換；`offline` 取代硬刪除。
- 先確認商品清單 API、狀態欄位、批次狀態 API 與 `business_staff` 權限邊界一致；缺少的最小契約在本 ticket 補齊。

## Acceptance criteria

- `business_staff` 只能看到 B2B 商品與 B2B 操作；`admin` 可正常進入相同頁面。
- 搜尋與狀態篩選能更新清單，且不會載入 B2C 商品。
- 沒有勾選商品時，批次操作不可用；執行後顯示成功或失敗結果。
- 清單具備 skeleton、空資料、搜尋無結果、API 錯誤與重新整理狀態。
- 每列有清楚的鍵盤可操作入口，不依賴整列的 hover 才能發現。

## Non-goals

- 商品詳細編輯、規格選項、圖片管理與 CSV 匯入。

## Validation

- API／權限契約測試覆蓋 admin、business_staff、未登入與錯誤狀態。
- 桌面與窄螢幕檢查表格轉換後仍可完成搜尋與狀態操作。
- 本機 real suite 需先套用本 ticket 的兩個 migration；本次只提交檔案，未執行 db push。

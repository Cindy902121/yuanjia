# Ticket 002：B2B 商品新增與編輯表單

- Status: done
- Depends on: 001
- Blocks: 003、004

## Goal

建立 `/admin/business/products/new` 與 `/admin/business/products/[productId]`，讓業務人員以單頁分區方式維護 B2B 商品資料。

## Scope

- 編輯頁分成基本資料、狀態／標籤、規格選項、圖片管理四個區段；本 ticket 先完成基本資料與頁面骨架。
- B2B 欄位包含商品編號、名稱、品牌、分類、規格、包裝、產地、保存方式與描述；不顯示價格。
- 新增商品預設 `draft`；`product_code` 建立後不可修改。
- 商品欄位使用明確「儲存變更」，不採 autosave。
- 顯示 dirty state、儲存中、儲存成功、欄位錯誤、重複商品編號與權限錯誤。
- 離開有未儲存變更時提示；儲存成功後保留在編輯頁並更新最後修改資訊。

## Acceptance criteria

- 新增與編輯共用同一套欄位元件與驗證規則。
- 所有必填欄位、長度、格式與 B2B 不含價格的規則在 UI 顯示清楚，伺服器錯誤能回填到表單。
- `business_staff` 可維護 B2B 商品；未登入、B2C 使用者與無權限角色不能操作。
- 使用瀏覽器返回或離開連結時，dirty form 會先提醒使用者。
- 儲存失敗不清除使用者輸入，且可重試。

## Non-goals

- 標籤／規格選項的完整 CRUD、圖片操作與 CSV 匯入。

## Validation

- 新增、編輯、重複 code、驗證錯誤、權限拒絕與重新整理後資料保留的整合測試。

## Implementation note

- 已完成新增／編輯共用表單、四區段骨架、dirty state、離開提示、伺服器錯誤回填與 B2B 管理角色頁面授權。
- 靜態契約、TypeScript、lint、production build 通過；真實整合測試目前因 `.env.test.local` 示範帳密回 401，尚未進入 ticket 002 斷言。

# B2B 商品圖片上傳清單

狀態：內容權利人已於 2026-09-08 確認可作正式展示素材；22 張圖片已上傳至 private `b2b-media` 並完成商品關聯。每個商品皆有 1 張封面，排序自 `0` 起。

## 上傳規則

- 儲存位置：private bucket `b2b-media`。
- 路徑由後台產生：`products/{product_id}/{uuid}.{ext}`，不可自行拼接或覆寫既有檔案。
- 每個商品先上傳 1 張 `cover`，排序 `0`；其餘圖為 `detail`，依序從 `1` 起。
- 圖片格式限 JPEG、PNG、WebP；單張不得超過 5 MB。
- `alt_text` 必填，描述商品與畫面；不可只填商品名稱或檔名。

## 現有素材與建議替代文字

| 商品編號 | 商品名稱 | 封面檔案 | 建議封面 alt | 細節圖 |
| --- | --- | --- | --- | --- |
| B2B-FISH-001 | 智利鮭魚切片 | `public/products/b2b/B2B-FISH-001/main.jpg` | 元家智利鮭魚切片商品主圖 | `detail-01.jpg`、`detail-02.jpg` |
| B2B-FISH-002 | 午仔魚整尾 | `public/products/b2b/B2B-FISH-002/main.jpg` | 元家午仔魚整尾商品主圖 | `detail-01.jpg`、`detail-02.jpg` |
| B2B-FISH-003 | 鯖魚菲力 | `public/products/b2b/B2B-FISH-003/main.jpg` | 元家鯖魚菲力商品主圖 | `detail-01.jpg`、`detail-02.jpg`、`detail-03.jpg` |
| B2B-SHRIMP-001 | 白蝦原料 | `public/products/b2b/B2B-SHRIMP-001/main.jpg` | 元家白蝦原料商品主圖 | `detail-01.jpg`、`detail-02.jpg`、`detail-03.jpg` |
| B2B-SHELL-001 | 熟凍扇貝 | `public/products/b2b/B2B-SHELL-001/main.jpg` | 元家熟凍扇貝商品主圖 | `detail-01.jpg`、`detail-02.jpg`、`detail-03.jpg` |
| B2B-SOFT-001 | 透抽圈 | `public/products/b2b/B2B-SOFT-001/main.jpg` | 元家透抽圈商品主圖 | 無 |
| B2B-MEAT-001 | 去骨雞腿肉切塊 | `public/products/b2b/B2B-MEAT-001/main.jpg` | 元家去骨雞腿肉切塊商品主圖 | `detail-01.jpg` |
| B2B-PREP-001 | 調理海鮮丸 | `public/products/b2b/B2B-PREP-001/main.jpg` | 元家調理海鮮丸商品主圖 | 無 |

## 執行驗收

1. 已完成：內容權利人確認每項圖片可正式使用、畫面與商品規格相符。
2. 已完成：透過受保護的管理流程上傳 8 張封面與 14 張細節圖。
3. 待前台驗收：於企業型錄、Finder 結果、商品詳情各確認封面、細節圖、alt 與排序正確。
4. 已確認：`b2b-media` bucket 維持 private，未登入使用者無法取得原始檔案網址。

# 元家 B2C 商品展示資料

- 文件版本：v1.1
- 更新日期：2026-08-11
- 適用範圍：首頁、商品列表、商品詳情、分類頁、標籤頁
- 文件狀態：展示資料草案；尚未寫入正式 Supabase
- 主要來源：[元家企業官網](https://www.yens.com.tw/)、[產品分類](https://www.yens.com.tw/product.html)、[官網目前提供的業務產品型錄](https://www.yens.com.tw/proimages/catalogue.pdf)

> **過期項目（2026-09-02）**：本文件原定的 12 筆 B2C 展示商品需求已過期，不再作為 MVP seed 或驗收商品數量；現行展示資料以 `supabase/seed.sql` 的 6 筆為準。本文件保留 12 筆內容，僅供歷史案例與 UI 測試參考。

> 本文件把「官網可確認的商品事實」與「MVP 展示值」分開。售價、庫存、首頁精選順序、發布日期及零售包裝若無官網依據，均屬展示設定，不代表元家正式售價、即時庫存或實際銷售規格。

## 1. 本版修正重點

1. 產品卡片回到已確認範圍：圖片、名稱、價格、庫存狀態與最多 3 個標籤；品牌、規格、產地、保存與食安放在詳情頁。
2. 正式分類改為多對多；調味或即食商品可同時屬於食材分類與「調理食品」。
3. 統一分類名稱為「調理食品」，slug 使用 `prepared-food`。
4. 補上 `currency`、`short_description`、首頁精選、發布日期與啟用狀態等展示欄位。
5. 依官網修正商品名稱、產地與規格；找不到足夠官網證據的內容不再寫成確定事實。
6. 食安與認證改成「產品／加工廠／企業層級」分開表述，不把企業認證自動套用到每項商品。
7. 圖片與證書尚未取得正式素材，只定義路徑、alt 與排序規則，不假裝已有檔案。

## 2. 資料狀態與使用限制

| 欄位類型 | 狀態 | 使用規則 |
|---|---|---|
| 商品名稱、官方產地、官網規格、官網料理方式 | 官網核對 | 可作為內容草稿；上線前仍應由商品／業務負責人覆核。 |
| 售價、模擬庫存、精選排序、發布日期 | MVP 展示值 | 不可作為正式商城價格或庫存。 |
| B2C 零售包裝 | 部分為展示轉換 | 官網多為 B2B 箱容；與官網不同時須標示「展示包裝」。 |
| 食安、品質、認證 | 依來源層級記錄 | 只有官網明確指向該商品時，才能在商品詳情顯示為產品資訊。 |
| 圖片、證書圖片 | 待素材 | 正式檔案與使用授權確認前使用無資訊佔位圖。 |
| 12 筆 seed（已過期） | 不採用 | 本文件不是可直接執行的 SQL migration；現行 seed 以 6 筆展示資料為準。 |

## 3. 正式分類

| slug | 顯示名稱 | 說明 |
|---|---|---|
| `shrimp-and-crab` | 蝦蟹類 | 蝦、蟹及相關原料商品。 |
| `fish` | 魚類 | 鮭魚、雪鰈等魚類商品。 |
| `shellfish` | 貝類 | 干貝、帆立貝等商品。 |
| `cephalopods` | 軟體類 | 花枝、烏賊、魷魚等商品。 |
| `meat` | 肉類 | 雞肉等非水產肉品。 |
| `prepared-food` | 調理食品 | 調味、熟製、即食或已加工商品。 |

每項商品最多一個主要分類，但可有多個次要分類。例如「柚子鹽麴鮭魚」主要分類為魚類，並同時加入調理食品。

## 4. 標籤字典

標籤是篩選條件，不取代正式分類。下列 slug 為本批資料的目標值；正式寫入前需與既有 `b2c_tags` 合併及去重。

| 群組 | slug | 顯示名稱 |
|---|---|---|
| 食材 | `salmon`、`halibut`、`shrimp`、`scallop`、`cuttlefish`、`chicken`、`crawfish` | 鮭魚、雪鰈、蝦、干貝、花枝、雞肉、小龍蝦 |
| 料理方式 | `pan-grill`、`air-fry`、`steam`、`hot-pot`、`soup`、`ready-to-eat` | 煎／烤、氣炸、清蒸、火鍋、煮湯、解凍即食 |
| 需求特性 | `easy-cook`、`boneless`、`high-protein`、`kid-friendly`、`portion-sized` | 方便料理、少刺／無刺、高蛋白、親子友善、份量剛好 |
| 加工方式 | `original`、`seasoned`、`cooked`、`ready-to-cook` | 原味、調味、熟製、即煮 |

## 5. 商品總表（12 筆，已過期歷史設計）

所有價格均為 `TWD` 展示值；所有商品預設 `is_active = true`。

| # | slug | 商品名稱 | 正式分類（主要；次要） | 品牌 | 展示價 | 庫存 | 前台狀態 | 精選／順序 |
|---|---|---|---|---|---:|---:|---|---|
| 1 | `salmon-fillet-portion` | 鮭魚菲力切塊 | 魚類 | 待確認 | 320 | 50 | 有庫存 | 是／10 |
| 2 | `salted-salmon-steak` | 鹽漬鮭魚（輕鹽鮭魚片） | 魚類；調理食品 | 漁太郎 | 280 | 40 | 有庫存 | 否 |
| 3 | `yuzu-koji-salmon` | 柚子鹽麴鮭魚 | 魚類；調理食品 | 待確認 | 250 | 35 | 有庫存 | 是／20 |
| 4 | `greenland-halibut-fillet` | 寶寶雪鰈菲力 | 魚類 | 待確認 | 450 | 20 | 有庫存 | 否 |
| 5 | `blue-diamond-shrimp-peeled` | 藍鑽蝦仁 | 蝦蟹類 | 藍鑽 | 380 | 60 | 有庫存 | 是／30 |
| 6 | `cooked-blue-diamond-shrimp` | 熟藍鑽蝦 | 蝦蟹類；調理食品 | 藍鑽 | 420 | 25 | 有庫存 | 否 |
| 7 | `hokkaido-scallop-sashimi` | 元家×北光 北海道生食級干貝 | 貝類 | 元家×北光 | 680 | 15 | 有庫存 | 是／40 |
| 8 | `cooked-scallop` | 熟帆立貝 | 貝類；調理食品 | 待確認 | 550 | 18 | 有庫存 | 否 |
| 9 | `torched-salmon-trout-slice` | 炙燒鮭鱒切片 | 魚類；調理食品 | 待確認 | 320 | 30 | 有庫存 | 否 |
| 10 | `cuttlefish-ball` | 品元堂 花枝丸 | 軟體類；調理食品 | 品元堂 | 150 | 80 | 有庫存 | 否 |
| 11 | `salt-marinated-chicken-leg` | 品元堂 油雞腿 | 肉類；調理食品 | 品元堂 | 180 | 45 | 有庫存 | 否 |
| 12 | `crawfish-salad` | 顏師傅 龍蝦風味沙拉 | 調理食品 | 顏師傅 | 129 | 0 | 售完 | 否 |

> 原 v1.0 的「顏師傅唐揚雞塊」未在本次官網查詢中找到足夠第一方商品頁，因此改用官網可確認的「品元堂 油雞腿」。若團隊另有官方型錄或內部產品資料，可再恢復原品項。

## 6. 官網資料與展示欄位

| # | 官網可確認的產地／規格 | B2C specification | short_description | published_at（展示） |
|---|---|---|---|---|
| 1 | 智利；100/150、150/200、200/250 g/片；官網箱容 10kg | 150/200g／片，單片真空包裝 | 去刺去鱗的鮭魚菲力切塊，適合乾煎、氣炸與烘烤。 | 2026-08-11 |
| 2 | 原料挪威／智利、台灣加工；300g／包、15包／件 | 300g／包，半月切片 | 北海道風味輕鹽調味，切片後方便煎、蒸或烤。 | 2026-08-10 |
| 3 | 台灣；180g±15g／包、20包／件 | 180g±15g／包 | 柚子清香搭配低鈉鹽麴醬，適合煎、烤與微波。 | 2026-08-09 |
| 4 | 格陵蘭；250g／包、20包／件 | 250g／包 | 帶皮去鱗去刺的雪鰈菲力，適合清蒸或乾煎。 | 2026-08-08 |
| 5 | 沙烏地阿拉伯；200g×3或250g×3／盒，31/40或41/50尾／磅 | 200g×3包／盒，31/40尾／磅 | 手工剝殼挑腸泥的小包裝藍鑽蝦仁。 | 2026-08-07 |
| 6 | 沙烏地阿拉伯；1kg×10盒／件 | 1kg／盒 | 熟製藍鑽蝦，表面去冰後仍須依官網指示加熱。 | 2026-08-06 |
| 7 | 北海道鄂霍次克海；官網文章未列零售重量 | 500g／盒（展示包裝，待確認） | 元家與漁連北光聯名的北海道生食級干貝。 | 2026-08-05 |
| 8 | 日本；1kg（淨重800g）×10包／箱，S／M／L／2L | 1kg／包（淨重800g） | 日本北海道原裝進口、去殼蒸煮後單顆凍結。 | 2026-08-04 |
| 9 | 越南；30片、240g／盒，50盒／件 | 240g／盒（30片） | 炙燒鮭鱒切片，可用於壽司、丼飯與沙拉。 | 2026-08-03 |
| 10 | 台灣；600g×30包／箱 | 600g／包 | 品元堂花枝丸，適合火鍋或油炸料理。 | 2026-08-02 |
| 11 | 台灣；375g×20包／箱 | 375g／包 | 台灣雞腿以調味方式製作，解凍後即可食用。 | 2026-08-01 |
| 12 | 台灣；100g杯裝、250g或500g袋裝 | 250g／包 | 小龍蝦肉、魚卵與鰇魚搭配日式沙拉醬，解凍即食。 | 2026-07-31 |

## 7. 保存、料理與品質資訊

保存溫度若官網商品頁沒有明列，前台不可自行補寫固定數字；應以實際包裝標示為準。

| # | 保存／料理顯示 | food_safety_info | quality_info／認證層級 |
|---|---|---|---|
| 1 | 冷凍保存；乾煎、氣炸、烤、蒸或煮粥 | 上線前依實際包裝補充 | 官網商品頁未列產品專屬證書，不顯示證書徽章 |
| 2 | 冷凍保存；煎、蒸、烤 | 官網稱無藥劑殘留並有產銷履歷 | 官網稱加工廠具 HACCP、ISO 22000；顯示時須註明是加工廠層級 |
| 3 | 冷凍保存；烤、煎、微波 | 低鈉低鹽鹽麴醬為官網產品描述 | 未找到產品專屬證書，不顯示證書徽章 |
| 4 | 冷凍保存；清蒸、乾煎 | 官網稱天然無添加、無膨發 | 官網商品頁列 HACCP、ISO 22000；上傳證明前先以文字呈現 |
| 5 | 冷凍保存；適合各式料理 | 官網稱純手工剝殼挑腸泥、100%無澎發 | ASC 為可預訂版本，不可讓所有庫存預設顯示 ASC |
| 6 | 冷凍保存；表面去冰後以沸水烹煮約 1 分鐘 | 批號產銷履歷完整 | 官網明列 BAP 最佳水產養殖規範驗證 |
| 7 | 冷凍保存；可生食或炙燒，仍以包裝指示為準 | 來源為北海道鄂霍次克海 | 官網稱日本認定最高品質；不是可直接等同的第三方證書名稱 |
| 8 | 冷凍保存；蒸、煮、炒、煎 | 活體入廠後去殼蒸煮、單顆凍結 | 未找到產品專屬證書，不顯示證書徽章 |
| 9 | 冷凍保存；官網標示可直接食用 | 上線前依實際包裝補充 | 未找到產品專屬證書，不顯示證書徽章 |
| 10 | 冷凍保存；火鍋或油炸 | 上線前依實際包裝補充 | 未找到產品專屬證書，不顯示證書徽章 |
| 11 | 冷凍保存；官網標示解凍即可食用 | 原料為 CAS 廠商提供雞隻的說法需以實際商品頁／包裝覆核 | 不把原料供應商 CAS 自動寫成成品 CAS 認證 |
| 12 | 冷凍保存；解凍即可食用 | 官網列 ISO 22000、HACCP、HALAL 與產品責任險 | 官網明列國際風味評鑑一星；證書圖仍須取得正式素材 |

## 8. 商品標籤配置

| # | 食材 | 料理方式 | 需求特性 | 加工方式 |
|---|---|---|---|---|
| 1 | 鮭魚 | 煎／烤、氣炸 | 少刺／無刺、高蛋白 | 原味 |
| 2 | 鮭魚 | 煎／烤 | 方便料理 | 調味 |
| 3 | 鮭魚 | 煎／烤 | 方便料理 | 調味 |
| 4 | 雪鰈 | 清蒸、煎／烤 | 少刺／無刺、親子友善 | 原味 |
| 5 | 蝦 | 煮湯、火鍋 | 方便料理、高蛋白 | 原味 |
| 6 | 蝦 | 火鍋 | 方便料理、高蛋白 | 熟製、即煮 |
| 7 | 干貝 | 解凍即食 | 份量剛好 | 原味 |
| 8 | 干貝 | 清蒸、煮湯 | 方便料理 | 熟製 |
| 9 | 鮭魚 | 解凍即食 | 方便料理 | 熟製 |
| 10 | 花枝 | 火鍋 | 方便料理 | 即煮 |
| 11 | 雞肉 | 解凍即食 | 方便料理 | 調味、熟製 |
| 12 | 小龍蝦 | 解凍即食 | 方便料理、份量剛好 | 調味、熟製 |

## 9. 圖片與證書素材規格

### 9.1 商品圖片

- 每項商品目標為 1 張封面圖及 3–5 張細節圖。
- 正式 Storage path：`products/{product-id}/{filename}`。
- `image_role` 使用 `cover` 或 `detail`；每項商品最多一張 cover。
- `alt_text` 應描述畫面，例如「藍鑽蝦仁盒裝正面」，不可只重複商品名稱。
- `sort_order` 從 0 開始；cover 預設 0。
- 未取得官網圖片授權或正式素材前，資料庫不要填入假路徑；前台顯示不承載資訊的佔位圖，使用空 alt。

### 9.2 證書圖片

- 檔案路徑：`certifications/{certification-slug}/{filename}`。
- 至少記錄證書名稱、發證單位、證書圖片、適用產品或工廠、有效期間與補充說明。
- 不得只憑企業介紹頁就把證書關聯到所有商品。

## 10. ProductCard／ProductDetail 資料介面

```ts
type StockStatus = "in_stock" | "out_of_stock";

interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: "TWD";
  stockStatus: StockStatus;
  coverImage: { url: string; alt: string } | null;
  tags: Array<{ slug: string; name: string }>;
  isFeatured: boolean;
}

interface ProductDetailData extends ProductCardData {
  brand: string;
  specification: string;
  origin: string;
  storageMethod: string;
  shortDescription: string;
  description: string;
  foodSafetyInfo: string | null;
  qualityInfo: string | null;
  categories: Array<{ slug: string; name: string; isPrimary: boolean }>;
  images: Array<{
    url: string;
    alt: string;
    role: "cover" | "detail";
    sortOrder: number;
  }>;
  certifications: Array<{
    slug: string;
    name: string;
    issuer: string | null;
    imageUrl: string | null;
    validUntil: string | null;
    note: string | null;
  }>;
}
```

ProductCard 不顯示品牌、分類與規格。商品名稱固定最多 2 行；標籤最多顯示 3 個，超出顯示 `+N`。卡片主連結與標籤連結必須可分別操作並有清楚的 `:focus-visible`。

## 11. 搜尋與 AND 篩選驗收

| 條件 | 預期結果 |
|---|---|
| 食材＝鮭魚 | #1、#2、#3、#9 |
| 食材＝鮭魚 AND 加工方式＝調味 | #2、#3 |
| 分類＝魚類 AND 分類＝調理食品 | #2、#3、#9 |
| 分類＝貝類 AND 加工方式＝熟製 | #8 |
| 食材＝蝦 AND 需求特性＝高蛋白 | #5、#6 |
| 食材＝雪鰈 AND 加工方式＝調味 | 0 筆，顯示「無符合商品」 |
| 關鍵字＝牛肉／起司／羊肉 | 0 筆，顯示搜尋無結果狀態 |

多標籤採 AND 邏輯：商品必須包含所有已選標籤。正式分類若允許複選，同樣採 AND；若 UI 只允許單一分類，則不顯示多分類同時勾選的案例。

## 12. 狀態與無障礙驗收

1. 庫存 0 只顯示「售完」，不顯示實際數量；卡片仍可進入詳情頁。
2. 無圖片顯示固定比例佔位，不出現破圖，不造成版面位移。
3. 無食安或證書資料時隱藏對應區塊，不顯示空標題。
4. 商品不存在與公開查不到的停用商品都進入 404／`not_found`。
5. loading 使用骨架屏；error 顯示通用訊息與重試，不暴露原始錯誤。
6. 卡片主連結與標籤皆可用 Tab 聚焦；Enter 採連結原生導覽。
7. 手機版互動目標至少 24×24 CSS px，focus 不只依靠顏色表示。
8. 本週不顯示假的購物車／結帳功能；待後續週期再加入真實互動。

## 13. 事件範圍

第一版只採既有白名單：

- `b2c_product_view`
- `b2c_search_category`
- `b2c_tag_click`
- `b2c_tag_view`

`b2c_product_card_impression`、`b2c_product_card_click`、`b2c_search_no_result`、`b2c_filter_no_result` 仍是候選事件；白名單與可保存 metadata 的資料結構完成前，不送到正式 API。

事件不得包含姓名、電話、Email、完整客戶代碼或其他個資。

## 14. 正式 seed 前的完成條件

- [x] 商品／業務負責人確認 12 筆需求已過期，不作為現行 MVP seed 或驗收數量。
- [x] 現行展示資料以 `supabase/seed.sql` 的 6 筆為準；本文件 12 筆保留為歷史設計。
- [ ] 確認分類與標籤 slug，完成多分類關聯。
- [ ] 確認售價、發布日期、精選順序及庫存都只用於展示。
- [ ] 取得每項商品的封面圖、3–5 張細節圖及使用授權。
- [ ] 取得可公開的證書圖片並確認適用層級與有效期間。
- [ ] schema migration 通過 review、備份及 dry-run。
- [ ] 產生可重複執行且不重複插入的 seed migration。
- [ ] 在測試環境驗證搜尋、AND 篩選、RLS 與無結果狀態。

## 15. 官網查證狀態

查證只使用元家企業官網與官網提供的型錄。狀態代表公開資料的對應程度，不代表正式上架審核已完成。

| # | 狀態 | 核對結果／直接來源 |
|---|---|---|
| 1 | 已確認 | [鮭魚菲力切塊](https://www.yens.com.tw/exec/product.php?kwd=%E9%AE%AD%E9%AD%9A%E8%8F%B2%E5%8A%9B&lg=T&mod=qsh)；品牌仍待內部確認。 |
| 2 | 已確認（名稱已校正） | [鹽漬鮭魚](https://www.yens.com.tw/product-%E9%B9%BD%E6%BC%AC%E9%AE%AD%E5%88%87-P-Salted-Salmon-Steak-yens-001-02-04.html)。 |
| 3 | 已確認（名稱已校正） | [柚子鹽麴鮭魚](https://www.yens.com.tw/product-%E6%9F%9A%E5%AD%90%E9%B9%BD%E9%BA%B4%E9%AE%AD%E9%AD%9A-P-Yuzu-salt-koji-salmon-A2020.html)；品牌仍待內部確認。 |
| 4 | 已確認（品項已選定） | [寶寶雪鰈菲力](https://www.yens.com.tw/product-%E7%9A%87%E5%86%A0%E7%86%8A-%E7%89%B9%E7%B4%9A%E5%A4%A7%E6%AF%94%E7%9B%AE%E9%AD%9A%E5%AF%B6%E5%AF%B6%E9%AD%9A%E7%89%87-P-Premium-Greenland-Halibut-Fillet-A1007.html)；不再混用「冰釣雪鰈」資料。 |
| 5 | 已確認 | [藍鑽蝦仁](https://www.yens.com.tw/product-%E8%97%8D%E9%91%BD%E8%9D%A6%E4%BB%81-P-Frozen-Blue-Diamond-Shrimp%2C-Peeled---Deveined-yens-002-07-04.html)。 |
| 6 | 已確認 | [熟藍鑽蝦](https://www.yens.com.tw/product-%E7%86%9F%E8%97%8D%E9%91%BD%E8%9D%A6-br--Cooked-Blue-Diamond-Shrimp-yens-013-08-01.html)。 |
| 7 | 部分確認 | [元家／北光聯名北海道生食級干貝](https://www.yens.com.tw/msg/msg220.html)；500g 展示包裝仍待業務確認。 |
| 8 | 已確認 | [帶卵熟帆立貝](https://www.yens.com.tw/product-%E5%B8%B6%E5%8D%B5%E7%86%9F%E5%B8%86%E7%AB%8B%E8%B2%9D-P-Cooked-Scallop%2C-Roe-on-yens-003-02-01.html)。 |
| 9 | 已確認（名稱已校正） | [炙燒鮭鱒切片](https://www.yens.com.tw/exec/product.php?kwd=%E7%82%99%E7%87%92%E9%AE%AD%E9%B1%92%E5%88%87%E7%89%87&lg=T&mod=qsh)；品牌仍待內部確認。 |
| 10 | 已確認（品項已替換） | [品元堂花枝丸所在官方分類](https://www.yens.com.tw/category-%E6%97%A5%E5%85%89%E5%9C%B0%E7%93%9C-yens-005-02.html)。 |
| 11 | 部分確認（品項已替換） | [元家官方肉類分類](https://www.yens.com.tw/category-%E8%82%89%E9%A1%9E-yens-006.html)可找到品元堂油雞腿；仍建議取得直接商品頁或內部主檔。 |
| 12 | 已確認 | [顏師傅龍蝦風味沙拉](https://www.yens.com.tw/product-%E9%BE%8D%E8%9D%A6%E9%A2%A8%E5%91%B3%E6%B2%99%E6%8B%89-P-Crawfish-Salad-yens-004-01-01.html)。 |

原 v1.0 的「顏師傅唐揚雞塊」在官網商品頁、站內搜尋與官方型錄中均未找到，因此沒有保留在本版。

## 16. 官方來源

- [鮭魚系列：鮭魚菲力切塊、柚子鹽麴鮭魚、炙燒鮭鱒切片](https://www.yens.com.tw/category-%E9%AE%AD%E9%AD%9A%E7%B3%BB%E5%88%97-yens-001-02.html)
- [鹽漬鮭魚](https://www.yens.com.tw/product-%E9%B9%BD%E6%BC%AC%E9%AE%AD%E5%88%87-P-Salted-Salmon-Steak-yens-001-02-04.html)
- [大比目魚系列：寶寶雪鰈菲力](https://www.yens.com.tw/category-%E5%A4%A7%E6%AF%94%E7%9B%AE%E9%AD%9A%E7%B3%BB%E5%88%97-yens-001-01.html)
- [藍鑽蝦系列：蝦仁與熟藍鑽蝦](https://www.yens.com.tw/category-%E8%97%8D%E9%91%BD%E8%9D%A6-yens-002-01.html)
- [北海道生食級干貝聯名介紹](https://www.yens.com.tw/msg/msg220.html)
- [熟帆立貝](https://www.yens.com.tw/category-%E7%86%9F%E5%B8%86%E7%AB%8B%E8%B2%9D-yens-003-02.html)
- [花枝漿／丸與品元堂花枝丸](https://www.yens.com.tw/category-%E6%97%A5%E5%85%89%E5%9C%B0%E7%93%9C-yens-005-02.html)
- [顏師傅龍蝦風味沙拉](https://www.yens.com.tw/product-%E9%BE%8D%E8%9D%A6%E9%A2%A8%E5%91%B3%E6%B2%99%E6%8B%89-P-Crawfish-Salad-yens-004-01-01.html)

若官網頁面只列 B2B 箱容，本文件的 B2C 包裝一律標示為展示值；正式上線以商品實際包裝與內部主檔為準。

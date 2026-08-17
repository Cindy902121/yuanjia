/**
 * B2C 展示商品的本機開發用假資料（fixture）。
 *
 * 2026-08-17：/products 系列頁面已經改接正式 Supabase（見
 * src/lib/supabase/products.ts），這個檔案**不再被任何頁面/元件引用**——C 本週
 * 排程明講「先以目前 Supabase 的 5 筆 seed 作 MVP 驗收資料，12（現在 14）筆
 * 展示資料留作後續擴充」，所以沒有刪掉，留著給之後真的要擴充正式 seed 資料時
 * 參考用（分類/標籤組合、邊界案例設計都還算完整）。如果之後確定不會再用到，
 * 可以整批刪除，屆時記得一併刪 categories.ts。
 *
 * 狀態：draft，僅供前端開發／UI 串接使用，**不是**正式 seed 或正式商品資料。
 *
 * 內容改寫自 docs/B2C商品展示資料.md 的 12 筆展示商品，但欄位形狀已改用
 * docs/b2c-product-field-spec-v1.md（已確認版本）定義的 ProductDetailData，
 * 並依 docs/b2c-product-display-data-review.md 的 P0 意見做了以下調整：
 *
 * 1. 分類改為多對多（categories 陣列＋isPrimary），slug 採用該文件 §4 的正式清單
 *    （shrimp-and-crab／fish／shellfish／cephalopods／meat／prepared-food）。
 *    有「調味」標籤的商品，額外掛上次要分類 prepared-food，示範多分類——
 *    這跟 GitHub PR #1 migration 裡「調味鯖魚同時屬於魚類與調理食品」的規則一致。
 * 2. coverImage／images 一律是 null／空陣列：目前 Supabase 沒有任何 Storage
 *    bucket、任何商品都沒有真實圖片，不捏造圖片網址；由元件顯示佔位圖。
 * 3. certifications 一律是空陣列：review 明確提醒「不能因企業具備某項認證，
 *    就推定每一項商品都具備同一證書」，逐項證書尚未核實前不編造結構化認證資料。
 *    食安／品質相關文字改寫自元家官網公開介紹內容，保留在 foodSafetyInfo／
 *    qualityInfo 兩個自由文字欄位。
 * 4. id 不是真的資料庫 uuid，只是穩定好讀的假 id，方便開發時追蹤。
 *
 * 團隊尚未決定「這 12 筆是否要正式成為 Supabase seed」（見 review 第 5 節
 * 建議處理順序第 1 點），在那之前這份檔案只在前端本機使用。
 *
 * 2026-08-17：新增 fx-13、fx-14 兩筆，共 14 筆。原本的 12 筆裡「軟體類」「肉類」
 * 兩個分類各只有 1 筆商品，標籤組合也偏窄，B2C 需求釐清浮動工具（見
 * src/lib/product-finder）的四步 AND 篩選遇到這兩個分類時很容易 0 筆結果，篩選器
 * 展示效果打折扣。使用者請 C 確認後同意可以自行補商品資料，只要有助於篩選器
 * 派上用場即可；這兩筆命名與規格參考元家自己的宅鮮配購物網（asf.com.tw）真實
 * 品項命名習慣改寫（例如「特選鮮甜活凍軟絲」「舒肥嫩雞胸」），不是逐字照抄
 * 定價／文案，一樣是展示用假資料，不是真的商品或真的價格。
 */

import type { ProductDetailData } from "@/lib/types/product";

export const products: ProductDetailData[] = [
  {
    id: "fx-01",
    slug: "salmon-fillet-portion",
    name: "鮭魚菲力切塊",
    price: 320,
    currency: "TWD",
    shortDescription: "鮭魚菲力去刺去鱗切塊，肉質細緻、油脂均勻，乾煎、氣炸皆可快速上桌。",
    inventoryStatus: "in_stock",
    // 2026-08-17：/products 頁面「當季主打商品」banner 用，見 src/lib/types/product.ts
    // 的 isFeatured 說明；挑 4 筆跨分類（魚/蝦蟹/貝/軟體）示範，不是隨機選。
    isFeatured: true,
    coverImage: null,
    tags: [
      { slug: "salmon", name: "鮭魚", groupName: "食材" },
      { slug: "pan-fry", name: "煎／烤", groupName: "料理方式" },
      { slug: "air-fry", name: "氣炸", groupName: "料理方式" },
      { slug: "boneless", name: "少刺／無刺", groupName: "需求特性" },
      { slug: "high-protein", name: "高蛋白", groupName: "需求特性" },
      { slug: "original", name: "原味", groupName: "加工方式" },
    ],
    brand: "元家",
    specification: "150/200g／片，單片真空包裝",
    origin: "智利",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "鮭魚菲力去刺去鱗切塊，肉質細緻、油脂均勻，乾煎、氣炸、烤箱皆可快速上桌，適合家庭與輕食料理。",
    foodSafetyInfo: "邁向零檢出，通過重金屬與藥物殘留檢驗。",
    qualityInfo: "HACCP、ISO 22000。",
    categories: [{ slug: "fish", name: "魚類", isPrimary: true }],
    images: [],
    certifications: [],
  },
  {
    id: "fx-02",
    slug: "salted-salmon-steak",
    name: "輕鹽鮭魚切片",
    price: 280,
    currency: "TWD",
    shortDescription: "北海道風味鹽漬手法，鹹香入味、半月切片方便料理，家庭與零售通路長銷款。",
    inventoryStatus: "in_stock",
    coverImage: null,
    tags: [
      { slug: "salmon", name: "鮭魚", groupName: "食材" },
      { slug: "pan-fry", name: "煎／烤", groupName: "料理方式" },
      { slug: "easy-to-cook", name: "方便料理", groupName: "需求特性" },
      { slug: "seasoned", name: "調味", groupName: "加工方式" },
    ],
    brand: "元家",
    specification: "300g／包，半月切片",
    origin: "原料挪威／智利，台灣加工分裝",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "北海道風味鹽漬手法，鹹香入味、半月切片方便料理，是家庭與零售通路的長銷款。",
    foodSafetyInfo: "無藥劑殘留，超越歐盟標準檢驗零檢出。",
    qualityInfo: "HACCP、ISO 22000。",
    // 有「調味」標籤 → 次要分類也掛調理食品，示範多分類（見檔頭說明）。
    categories: [
      { slug: "fish", name: "魚類", isPrimary: true },
      { slug: "prepared-food", name: "調理食品", isPrimary: false },
    ],
    images: [],
    certifications: [],
  },
  {
    id: "fx-03",
    slug: "yuzu-koji-salmon",
    name: "柚香鹽麴鮭魚",
    price: 250,
    currency: "TWD",
    shortDescription: "融合柚子清香與低鈉鹽麴醬調味，烤、煎、微波皆宜，兼顧美味與健康需求。",
    inventoryStatus: "in_stock",
    coverImage: null,
    tags: [
      { slug: "salmon", name: "鮭魚", groupName: "食材" },
      { slug: "pan-fry", name: "煎／烤", groupName: "料理方式" },
      { slug: "easy-to-cook", name: "方便料理", groupName: "需求特性" },
      { slug: "seasoned", name: "調味", groupName: "加工方式" },
    ],
    brand: "元家",
    specification: "180g±15g／包",
    origin: "台灣",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "融合柚子清香與低鈉鹽麴醬調味，烤、煎、微波皆宜，兼顧美味與健康需求。",
    foodSafetyInfo: "低鈉低鹽鹽麴醬調味。",
    qualityInfo: null,
    categories: [
      { slug: "fish", name: "魚類", isPrimary: true },
      { slug: "prepared-food", name: "調理食品", isPrimary: false },
    ],
    images: [],
    certifications: [],
  },
  {
    id: "fx-04",
    slug: "greenland-halibut-fillet",
    name: "冰釣格陵蘭雪鰈菲力",
    price: 450,
    currency: "TWD",
    shortDescription: "全球頂級格陵蘭手釣雪鰈，肉質細白、油脂豐富，煎烤清蒸皆能呈現原始鮮甜。",
    inventoryStatus: "in_stock",
    coverImage: null,
    tags: [
      { slug: "halibut", name: "比目魚", groupName: "食材" },
      { slug: "pan-fry", name: "煎／烤", groupName: "料理方式" },
      { slug: "steam", name: "清蒸", groupName: "料理方式" },
      { slug: "boneless", name: "少刺／無刺", groupName: "需求特性" },
    ],
    brand: "元家",
    specification: "依尾重分切，單片真空包裝",
    origin: "格陵蘭",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "全球頂級格陵蘭手釣雪鰈，肉質細白、油脂豐富，煎烤清蒸皆能呈現原始鮮甜。",
    foodSafetyInfo: null,
    qualityInfo: null,
    categories: [{ slug: "fish", name: "魚類", isPrimary: true }],
    images: [],
    certifications: [],
  },
  {
    id: "fx-05",
    slug: "blue-diamond-shrimp-peeled",
    name: "藍鑽蝦仁",
    price: 380,
    currency: "TWD",
    shortDescription: "紅海海域養殖藍鑽蝦，純手工剝殼挑腸泥，肉質Q彈鮮甜，小包裝衛生方便。",
    inventoryStatus: "in_stock",
    isFeatured: true,
    coverImage: null,
    tags: [
      { slug: "shrimp", name: "蝦", groupName: "食材" },
      { slug: "soup", name: "煮湯", groupName: "料理方式" },
      { slug: "hot-pot", name: "火鍋", groupName: "料理方式" },
      { slug: "easy-to-cook", name: "方便料理", groupName: "需求特性" },
      { slug: "high-protein", name: "高蛋白", groupName: "需求特性" },
      { slug: "original", name: "原味", groupName: "加工方式" },
    ],
    brand: "元家",
    specification: "真空包200g×3包／盒，31/40尾／磅",
    origin: "沙烏地阿拉伯",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "全世界鹽度最高的紅海海域養殖，純手工剝殼挑腸泥，肉質Q彈鮮甜，小包裝衛生方便。",
    foodSafetyInfo: "產銷履歷完整，批號可追溯。",
    qualityInfo: "可申請 ASC 認證（需提前預訂，尚未逐批核實，暫不列入結構化認證）。",
    categories: [{ slug: "shrimp-and-crab", name: "蝦蟹類", isPrimary: true }],
    images: [],
    certifications: [],
  },
  {
    id: "fx-06",
    slug: "cooked-blue-diamond-shrimp",
    name: "熟藍鑽蝦",
    price: 420,
    currency: "TWD",
    shortDescription: "已完成熟成處理，解凍即可食用或加入火鍋，液態氮急速單凍鎖住鮮甜。",
    inventoryStatus: "in_stock",
    coverImage: null,
    tags: [
      { slug: "shrimp", name: "蝦", groupName: "食材" },
      { slug: "hot-pot", name: "火鍋", groupName: "料理方式" },
      { slug: "easy-to-cook", name: "方便料理", groupName: "需求特性" },
      { slug: "high-protein", name: "高蛋白", groupName: "需求特性" },
      { slug: "ready-to-cook", name: "即食／即煮", groupName: "加工方式" },
    ],
    brand: "元家",
    specification: "1kg／盒（拆件販售）",
    origin: "沙烏地阿拉伯",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "已完成熟成處理，解凍即可食用或加入火鍋，液態氮急速單凍鎖住鮮甜。",
    foodSafetyInfo: "通過 BAP 最佳水產養殖規範驗證（尚未逐批核實，暫不列入結構化認證）。",
    qualityInfo: null,
    categories: [{ slug: "shrimp-and-crab", name: "蝦蟹類", isPrimary: true }],
    images: [],
    certifications: [],
  },
  {
    id: "fx-07",
    slug: "hokkaido-scallop-sashimi",
    name: "北海道生食級干貝",
    price: 680,
    currency: "TWD",
    shortDescription: "元家與北光聯名推出，生食等級規格，鮮甜多汁，適合生食或簡單炙燒。",
    inventoryStatus: "in_stock",
    isFeatured: true,
    coverImage: null,
    tags: [
      { slug: "scallop", name: "干貝", groupName: "食材" },
      { slug: "raw", name: "生食", groupName: "料理方式" },
      { slug: "right-portion", name: "份量剛好", groupName: "需求特性" },
      { slug: "original", name: "原味", groupName: "加工方式" },
    ],
    brand: "元家×北光 聯名",
    specification: "500g／盒，生食等級分級",
    origin: "日本北海道",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "元家與北光聯名推出，專屬台灣最高品質規格，鮮甜多汁，適合生食或簡單炙燒。",
    foodSafetyInfo: "生食級規格，日本原裝進口。",
    qualityInfo: "產地直送溯源認證。",
    categories: [{ slug: "shellfish", name: "貝類", isPrimary: true }],
    images: [],
    certifications: [],
  },
  {
    id: "fx-08",
    slug: "cooked-scallop",
    name: "熟帆立貝",
    price: 550,
    currency: "TWD",
    shortDescription: "已熟成處理的帆立貝，簡單加熱即可享用鮮甜貝肉，適合湯品與快炒料理。",
    inventoryStatus: "in_stock",
    coverImage: null,
    tags: [
      { slug: "scallop", name: "干貝", groupName: "食材" },
      { slug: "steam", name: "清蒸", groupName: "料理方式" },
      { slug: "soup", name: "煮湯", groupName: "料理方式" },
      { slug: "ready-to-cook", name: "即食／即煮", groupName: "加工方式" },
    ],
    // 刻意留空字串（不是 null）：測試「無品牌」顯示情境，見 docs/b2c-product-field-spec-v1.md
    // brand 欄位仍是必填 NOT NULL text，只是允許空字串。
    brand: "",
    specification: "1kg／包",
    origin: "日本",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "已熟成處理的帆立貝，簡單加熱即可享用鮮甜貝肉，適合湯品與快炒料理。",
    foodSafetyInfo: "加熱調理即食。",
    qualityInfo: null,
    categories: [{ slug: "shellfish", name: "貝類", isPrimary: true }],
    images: [],
    certifications: [],
  },
  {
    id: "fx-09",
    slug: "torched-salmon-trout-slice",
    name: "炙燒鮭鱒壽司切片",
    price: 320,
    currency: "TWD",
    shortDescription: "炙燒表面鎖住油脂香氣，可用於壽司、丼飯與沙拉點綴，即開即食。",
    inventoryStatus: "in_stock",
    coverImage: null,
    tags: [
      { slug: "salmon", name: "鮭魚", groupName: "食材" },
      { slug: "raw", name: "生食", groupName: "料理方式" },
      { slug: "easy-to-cook", name: "方便料理", groupName: "需求特性" },
      { slug: "ready-to-cook", name: "即食／即煮", groupName: "加工方式" },
    ],
    brand: "元家",
    specification: "240g／盒（30片）",
    origin: "越南",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "炙燒表面鎖住油脂香氣，可用於壽司、丼飯與沙拉點綴，即開即食。",
    foodSafetyInfo: "生食等級原料，可直接食用。",
    qualityInfo: "HACCP。",
    categories: [{ slug: "fish", name: "魚類", isPrimary: true }],
    images: [],
    certifications: [],
  },
  {
    id: "fx-10",
    slug: "squid-balls",
    name: "元家花枝丸",
    price: 150,
    currency: "TWD",
    shortDescription: "精選花枝漿手工製作，Q彈有嚼勁，適合火鍋、關東煮與湯品料理。",
    inventoryStatus: "in_stock",
    coverImage: null,
    tags: [
      { slug: "squid", name: "花枝", groupName: "食材" },
      { slug: "hot-pot", name: "火鍋", groupName: "料理方式" },
      { slug: "soup", name: "煮湯", groupName: "料理方式" },
      { slug: "kid-friendly", name: "適合小孩", groupName: "需求特性" },
      { slug: "ready-to-cook", name: "即食／即煮", groupName: "加工方式" },
    ],
    brand: "元家",
    specification: "300g／包",
    origin: "台灣",
    storageMethod: "冷凍 -18°C 以下保存",
    description: "精選花枝漿手工製作，Q彈有嚼勁，適合火鍋、關東煮與湯品料理。",
    foodSafetyInfo: "無添加防腐劑。",
    qualityInfo: null,
    categories: [{ slug: "cephalopods", name: "軟體類", isPrimary: true }],
    images: [],
    certifications: [],
  },
  {
    id: "fx-11",
    slug: "chicken-karaage",
    name: "顏師傅唐揚雞塊",
    price: 180,
    currency: "TWD",
    shortDescription: "醬香入味的日式唐揚雞塊，氣炸或煎烤即可上桌，全家共享的方便料理選擇。",
    inventoryStatus: "in_stock",
    coverImage: null,
    tags: [
      { slug: "chicken", name: "雞肉", groupName: "食材" },
      { slug: "air-fry", name: "氣炸", groupName: "料理方式" },
      { slug: "pan-fry", name: "煎／烤", groupName: "料理方式" },
      { slug: "kid-friendly", name: "適合小孩", groupName: "需求特性" },
      { slug: "easy-to-cook", name: "方便料理", groupName: "需求特性" },
      { slug: "seasoned", name: "調味", groupName: "加工方式" },
    ],
    brand: "顏師傅",
    specification: "500g／包",
    origin: "台灣（國產雞肉）",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "醬香入味的日式唐揚雞塊，氣炸或煎烤即可上桌，是全家共享的方便料理選擇。",
    foodSafetyInfo: "使用國產 CAS 認證雞肉。",
    qualityInfo: "CAS 台灣優良農產品。",
    // 有「調味」標籤 → 次要分類也掛調理食品，示範多分類。
    categories: [
      { slug: "meat", name: "肉類", isPrimary: true },
      { slug: "prepared-food", name: "調理食品", isPrimary: false },
    ],
    images: [],
    certifications: [],
  },
  {
    id: "fx-12",
    slug: "lobster-flavor-salad",
    name: "顏師傅龍蝦風味沙拉",
    price: 129,
    currency: "TWD",
    shortDescription: "元家顏師傅品牌推出的即食風味沙拉，開封即可食用，適合輕食與野餐場合。",
    // 缺貨情境（mockInventory = 0），見 docs/B2C商品展示資料.md §4.3。
    inventoryStatus: "out_of_stock",
    coverImage: null,
    tags: [
      { slug: "easy-to-cook", name: "方便料理", groupName: "需求特性" },
      { slug: "right-portion", name: "份量剛好", groupName: "需求特性" },
      { slug: "ready-to-cook", name: "即食／即煮", groupName: "加工方式" },
    ],
    brand: "顏師傅",
    specification: "150g×2盒",
    origin: "台灣",
    storageMethod: "冷藏 0–7°C 保存，即開即食",
    description:
      "元家顏師傅品牌推出的即食風味沙拉，開封即可食用，適合輕食與野餐場合。",
    foodSafetyInfo: null,
    qualityInfo: null,
    categories: [{ slug: "prepared-food", name: "調理食品", isPrimary: true }],
    images: [],
    certifications: [],
  },
  {
    id: "fx-13",
    slug: "fresh-frozen-cuttlefish",
    name: "特選鮮甜活凍軟絲",
    price: 320,
    currency: "TWD",
    shortDescription: "活凍鎖鮮處理，肉質細嫩鮮甜有嚼勁，適合快炒、氣炸或簡單汆燙。",
    inventoryStatus: "in_stock",
    isFeatured: true,
    coverImage: null,
    tags: [
      { slug: "cuttlefish", name: "軟絲", groupName: "食材" },
      { slug: "pan-fry", name: "煎／烤", groupName: "料理方式" },
      { slug: "air-fry", name: "氣炸", groupName: "料理方式" },
      { slug: "boneless", name: "少刺／無刺", groupName: "需求特性" },
      { slug: "high-protein", name: "高蛋白", groupName: "需求特性" },
      { slug: "original", name: "原味", groupName: "加工方式" },
    ],
    brand: "元家",
    specification: "275±25g／尾",
    origin: "台灣",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "台灣籍船活凍鎖鮮處理，肉質細嫩鮮甜有嚼勁，適合快炒、氣炸、汆燙或做涼拌料理。",
    foodSafetyInfo: "船凍急速鎖鮮，全程冷鏈配送。",
    qualityInfo: null,
    categories: [{ slug: "cephalopods", name: "軟體類", isPrimary: true }],
    images: [],
    certifications: [],
  },
  {
    id: "fx-14",
    slug: "sous-vide-chicken-breast",
    name: "舒肥嫩雞胸",
    price: 180,
    currency: "TWD",
    shortDescription: "低溫舒肥烹調鎖住肉汁，低脂高蛋白，健身餐與輕食料理首選。",
    inventoryStatus: "in_stock",
    coverImage: null,
    tags: [
      { slug: "chicken", name: "雞肉", groupName: "食材" },
      { slug: "steam", name: "清蒸", groupName: "料理方式" },
      { slug: "high-protein", name: "高蛋白", groupName: "需求特性" },
      { slug: "easy-to-cook", name: "方便料理", groupName: "需求特性" },
      { slug: "original", name: "原味", groupName: "加工方式" },
    ],
    brand: "元家",
    specification: "200g／包",
    origin: "台灣（國產雞肉）",
    storageMethod: "冷凍 -18°C 以下保存",
    description:
      "低溫舒肥烹調鎖住肉汁與口感，低脂高蛋白，健身餐、輕食便當與沙拉料理的方便選擇。",
    foodSafetyInfo: "使用國產雞肉，符合食品安全衛生管理規範。",
    qualityInfo: null,
    categories: [{ slug: "meat", name: "肉類", isPrimary: true }],
    images: [],
    certifications: [],
  },
];

export function getProductBySlug(slug: string): ProductDetailData | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductsByTagSlug(tagSlug: string): ProductDetailData[] {
  return products.filter((product) => product.tags.some((tag) => tag.slug === tagSlug));
}

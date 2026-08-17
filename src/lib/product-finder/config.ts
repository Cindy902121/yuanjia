/**
 * B2C 需求釐清浮動工具的固定四步篩選設定（PRD B2C-05、FDD §4.6.2、§6.6）。
 *
 * 2026-08-17：這裡刻意「不」呼叫 C 已經寫好的 GET /api/b2c/product-finder。原因：
 * 那支 API 查的是正式 Supabase 的 b2c_products（目前只有 5 筆種子資料，slug／
 * 分類都跟我們 /products 系列頁面用的 12 筆本機 fixture 是兩組完全不同的資料
 * ——這個落差在做購物車/結帳（8/17 稍早）時已經跟使用者確認過，整個網站現在
 * 都還是 fixture-based，「不會有真資料」）。
 *
 * 如果這裡改叫真的 API，篩選結果會是使用者在 /products、快速分類、標籤頁完全
 * 沒看過的另一組商品，導向 /products/[slug] 時十之八九會 404（真實 DB 的 slug
 * 不在我們的 fixture 陣列裡）。所以這裡用跟 ProductListWithFilters 一樣的本機
 * fixture 資料＋AND 篩選邏輯（見 match.ts），確保浮動工具找到的商品，一定跟
 * 網站其他地方看到的是同一批、點進去一定看得到詳情頁。等哪天整個網站真的接上
 * Supabase，才需要把這裡也換成打真的 API——屆時 /products 系列頁面也要一起換，
 * 不是這個檔案單獨的事。
 *
 * 選項的 key／文案對齊 C 在 src/lib/product-finder.ts 定義的 B2C_FINDER_CONDITIONS
 * （方便之後真的要接 API 時，key 可以直接沿用，不用重新設計一輪）；tagSlug／
 * categorySlug 則對齊我們自己 fixture 資料實際使用的 slug（見
 * src/lib/fixtures/products.ts、categories.ts）。
 */

export interface FinderOption {
  key: string;
  label: string;
  /** 對應 fixture 商品標籤的 slug；跟 categorySlug 只會有一個有值。 */
  tagSlug?: string;
  /** 對應 fixture 商品分類的 slug；跟 tagSlug 只會有一個有值。 */
  categorySlug?: string;
}

export interface FinderStep {
  key: string;
  question: string;
  /** 只有最後一步可略過（PRD：「固定四步...其他偏好（可選）」）。 */
  optional: boolean;
  options: FinderOption[];
}

export const FINDER_STEPS: FinderStep[] = [
  {
    key: "cooking",
    question: "今天想怎麼吃？",
    optional: false,
    options: [
      { key: "hot-pot", label: "火鍋", tagSlug: "hot-pot" },
      { key: "pan-fry", label: "煎／烤", tagSlug: "pan-fry" },
      { key: "air-fry", label: "氣炸", tagSlug: "air-fry" },
      { key: "steam", label: "清蒸", tagSlug: "steam" },
      { key: "soup", label: "煮湯", tagSlug: "soup" },
      { key: "raw", label: "生食", tagSlug: "raw" },
    ],
  },
  {
    key: "need",
    question: "你比較在意什麼？",
    optional: false,
    options: [
      { key: "easy-cook", label: "方便料理", tagSlug: "easy-to-cook" },
      { key: "boneless", label: "少刺／無刺", tagSlug: "boneless" },
      { key: "high-protein", label: "高蛋白", tagSlug: "high-protein" },
      { key: "kid-friendly", label: "適合小孩", tagSlug: "kid-friendly" },
      { key: "right-portion", label: "份量剛好", tagSlug: "right-portion" },
    ],
  },
  {
    key: "category",
    question: "想吃哪一類？",
    optional: false,
    options: [
      { key: "fish", label: "魚類", categorySlug: "fish" },
      { key: "shrimp", label: "蝦類", categorySlug: "shrimp-and-crab" },
      { key: "shellfish", label: "貝類", categorySlug: "shellfish" },
      { key: "other-seafood", label: "其他海鮮", categorySlug: "cephalopods" },
      { key: "any", label: "都可以" },
    ],
  },
  {
    key: "processing",
    question: "還有其他偏好嗎？",
    optional: true,
    options: [
      { key: "plain", label: "原味", tagSlug: "original" },
      { key: "seasoned", label: "調味", tagSlug: "seasoned" },
      { key: "ready-to-cook", label: "即食／即煮", tagSlug: "ready-to-cook" },
      { key: "any", label: "都可以" },
    ],
  },
];

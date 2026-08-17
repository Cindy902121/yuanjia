/**
 * B2C 需求釐清浮動工具的固定四步篩選設定（PRD B2C-05、FDD §4.6.2、§6.6）。
 *
 * 2026-08-17：一開始這裡刻意不呼叫 C 已經寫好的 GET /api/b2c/product-finder，
 * 因為那支 API 查的是正式 Supabase（跟當時 /products 系列頁面用的本機 fixture
 * 是兩組不同資料，串起來點進去會 404）。現在 /products 系列頁面已經改接同一個
 * 正式 Supabase（C 本週排程要求），這個落差不存在了，match.ts 已經改回打真的
 * API——這份設定檔一開始就是為了那天鋪路設計的（見下方 key 對齊 C 的
 * B2C_FINDER_CONDITIONS），不需要跟著大改，只拿掉了當時額外記錄「對應哪個
 * fixture slug」用的 tagSlug／categorySlug（match.ts 換掉查詢方式後不再需要）。
 *
 * 選項的 key／文案對齊 C 在 src/lib/product-finder.ts 定義的 B2C_FINDER_CONDITIONS，
 * 送出的 key 會直接當成 conditions 查詢字串的一部分，不用另外轉換。真實資料庫
 * 目前標籤／分類值還不多（10 個標籤、3 種分類值），部分選項現在合理地會 0 筆
 * 結果，等 C 之後擴充種子資料就會自然變好，不是這裡要處理的事。
 */

export interface FinderOption {
  key: string;
  label: string;
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
      { key: "hot-pot", label: "火鍋" },
      { key: "pan-fry", label: "煎／烤" },
      { key: "air-fry", label: "氣炸" },
      { key: "steam", label: "清蒸" },
      { key: "soup", label: "煮湯" },
      { key: "raw", label: "生食" },
    ],
  },
  {
    key: "need",
    question: "你比較在意什麼？",
    optional: false,
    options: [
      { key: "easy-cook", label: "方便料理" },
      { key: "boneless", label: "少刺／無刺" },
      { key: "high-protein", label: "高蛋白" },
      { key: "kid-friendly", label: "適合小孩" },
      { key: "right-portion", label: "份量剛好" },
    ],
  },
  {
    key: "category",
    question: "想吃哪一類？",
    optional: false,
    options: [
      { key: "fish", label: "魚類" },
      { key: "shrimp", label: "蝦類" },
      { key: "shellfish", label: "貝類" },
      { key: "other-seafood", label: "其他海鮮" },
      { key: "any", label: "都可以" },
    ],
  },
  {
    key: "processing",
    question: "還有其他偏好嗎？",
    optional: true,
    options: [
      { key: "plain", label: "原味" },
      { key: "seasoned", label: "調味" },
      { key: "ready-to-cook", label: "即食／即煮" },
      { key: "any", label: "都可以" },
    ],
  },
];

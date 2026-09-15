import { getAboutPage } from "@/app/business/about/about-data";

/**
 * /about 頁面的「呈現層」資料整理。
 *
 * 2026-09-11（原型先在 `/about-preview` 做，使用者審核通過設計後，這次
 * 正式取代 `(b2c)/about/page.tsx` 原本的精簡版內容——不是新網址，沿用
 * 既有的 `/about` 路徑，見 page.tsx 檔頭說明）。
 *
 * 這個檔案**不包含任何新的事實**——公司歷史、年份、認證、數字，全部從
 * `src/app/business/about/about-data.ts`（B 為 B2B 頁面建立、來源是
 * yens.com.tw 官網的既有真實資料）用 `getAboutPage()` 讀出來，這裡只負責
 * 「怎麼分段呈現」（哪幾句是 Lead Statement、哪幾筆年份要放大處理、配哪張
 * 照片），不重寫、不新增、不省略任何真實內容裡的數字或年份。
 *
 * 為什麼不直接複製一份新的資料，而是 import `getAboutPage`：避免跟 B2B
 * 版本各自維護一份「同一件事的兩種版本」，之後官網內容更新，B2B／B2C 兩邊
 * 只要改 about-data.ts 一個地方就會同步，不會有兩邊事實兜不起來的風險。
 */

const companyPage = getAboutPage("company")!;
const strengthsPage = getAboutPage("strengths")!;
const milestonesPage = getAboutPage("milestones")!;

export const heroContent = {
  kicker: "ABOUT YUANJIA",
  /**
   * 2026-09-14（main／B2C 分支合併後，使用者要求「把 Hero 標題改回自己
   * 維護一份文案」）：這裡原本直接綁 `companyPage.title`，用意是跟 B2B
   * 版本共用同一份事實、不用兩邊各自維護。但合併 main 之後才發現 B 為了
   * B2B 新版頁面把這個欄位改成「起源」——放在 B2B 那種大 Banner 底下當
   * 短標籤很合適，但這裡是這個頁面唯一的大型襯線字 Hero 標題，兩個字撐
   * 不起版面，而且這個欄位之後只要 B2B 又改版，B2C 這裡會跟著被動跑掉，
   * 不是我們自己決定的。
   *
   * 改成這裡自己固定維護一句——**不是新編的事實**，就是 `companyPage.title`
   * 原本（在 B 這次 B2B 改版之前）的值，來源同樣是 yens.com.tw／
   * about-data.ts，只是現在用字面常數的方式固定下來，不再跟著
   * `about-data.ts` 之後的異動自動變化。這個頁面其餘內容（大事紀、企業
   * 優勢、統計數字）維持原本做法，繼續直接讀 `getAboutPage()`，只有這一句
   * Hero 標題單獨拉出來。
   */
  title: "從澎湖出發，連結全球食品供應。",
};

/**
 * Brand Introduction 的「閱讀節奏」拆解：Lead Statement → Short Paragraph →
 * Key Quote → Numbers。Lead Statement 沿用 about-data 現成的 title／summary，
 * Short Paragraph 從 content[0]（企業源起那一段）擷取前三個年份的濃縮版，
 * 不是照搬 B2B 版的完整長段落，但濃縮後的每個年份/事實都能在
 * companyPage.content 原文裡找到出處。
 */
export const introContent = {
  lead: companyPage.summary,
  paragraph:
    "1968 年，元家前身「元進行」於澎湖草創；1979 年於台北正式設立元家企業股份有限公司，隔年於高雄設立冷凍草蝦外銷廠，以自有品牌將產品行銷日本與美國。此後逐步拓展至調理食品與國際市場，服務零售、餐飲與多元通路。",
  // 跟首頁品牌故事同一句使命語錄（來源見首頁 (b2c)/page.tsx 檔頭說明），
  // 這裡刻意沿用同一句而非改寫，維持全站品牌語氣一致。
  quote: "我們期望：透過食的流通，傳遞幸福給世界。",
  stats: companyPage.stats!,
};

export type TimelineEntry = {
  year: string;
  description: string;
  featured: boolean;
  photo?: { src: string; alt: string };
};

/**
 * 從 24 筆真實大事紀裡，標記對「品牌故事」敘事最關鍵的 9 筆為 `featured`
 * （成立、設廠、轉型、認證里程碑、50 週年、近年成果）——桌機水平時間軸只
 * 放這幾筆做大卡片；其餘筆標記 `featured: false`，桌機版收進大事紀後方的
 * 「完整歷程」清單，手機／直向版則不分大小、24 筆依年份順序全部直接
 * 呈現（只是 featured 的字級／照片稍大）。不管哪種呈現方式，24 筆真實
 * 事件都會出現在頁面上，沒有被省略，文字也逐字取自 milestonesPage.points，
 * 沒有改寫。
 */
const FEATURED_YEARS = new Set(["1968", "1979", "1983", "2000", "2007", "2010", "2014", "2018", "2025"]);

const PHOTO_BY_YEAR: Record<string, TimelineEntry["photo"]> = {
  "1983": { src: "/brand/history-origin.jpg", alt: "1980 年代元家高雄設廠時期的舊廠房實景照（環球牌）" },
  "2018": { src: "/brand/channel-global.jpg", alt: "元家企業 50 週年，員工空拍排字紀念活動" },
};

export const timeline: TimelineEntry[] = milestonesPage.points!.map((point) => ({
  year: point.title,
  description: point.description,
  featured: FEATURED_YEARS.has(point.title),
  photo: PHOTO_BY_YEAR[point.title],
}));

/**
 * 企業優勢 4 項，刻意標記 layout 讓頁面用 4 種不同構圖呈現（見
 * about-strengths.tsx），不是套同一個 Template 四次。文字逐字取自
 * strengthsPage.points，沒有改寫。
 */
export const strengthsContent = {
  lead: strengthsPage.title,
  summary: strengthsPage.summary,
  items: strengthsPage.points!.map((point, index) => ({
    ...point,
    index: index + 1,
  })),
};

export const closingContent = {
  // 跟 introContent.quote 呼應但不重複同一句，避免整頁只重複一句話。
  statement: "從 1968 年到現在，元家仍持續在水產與食品供應的路上，穩定前進。",
};

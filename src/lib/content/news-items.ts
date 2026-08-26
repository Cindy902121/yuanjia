/**
 * 「最新消息」內容資料（2026-08-25 新增，SEO／AEO／GEO 內容策略）。
 *
 * 2026-08-25（同日，重新分工）：這裡原本規劃放「元家企業年掌握2萬噸貨源」
 * 這篇改寫自今周刊報導的深度內容，跟使用者討論後決定重新分工：
 * - 那篇內容本質上是「別人報導我們」的深度延伸，搬去
 *   src/lib/content/media-detail.ts，掛在 `/media/[slug]` 底下，跟
 *   `/media`（媒體報導清單）放在同一個脈絡裡，不是這裡。
 * - 這裡（`/news`）改為專門留給**元家自己發布的第一手消息**：新品上市、
 *   優惠活動、拿到新認證、永續里程碑等公告——重點是這些內容天生就不會被
 *   媒體報導，也不是「別人怎麼分析我們」，是元家自己想跟顧客說的話。
 * - `/faq`（常見問題）維持原本的消費者使用面問題，不放公司消息。
 *
 * 目前還沒有真的可以發布的第一手消息（沒有真的新品上市、沒有真的優惠
 * 活動），所以 `NEWS_ARTICLES` 故意留空，`/news` 頁面會顯示「目前尚無最新
 * 消息」的誠實空狀態，而不是為了填內容硬湊一則假消息——這是這次內容產製
 * 守則裡「真實性最高原則」的延伸，不是忘記填資料。之後元家真的有新品／
 * 優惠／公告時，往這個陣列加一筆即可，`/news` 列表、`sitemap.ts`、
 * `generateStaticParams` 都會自動反映，不用改任何頁面元件。
 *
 * 資料結構沿用原本規劃（SEO 關鍵字、AEO 30秒懶人包與 FAQ、GEO 背景框與
 * 數據表格），新品／優惠公告一樣適用這套欄位，不需要重新設計。
 */

export interface NewsGlossaryTerm {
  term: string;
  definition: string;
}

export interface NewsPillar {
  title: string;
  description: string;
}

export interface NewsImpactRow {
  metric: string;
  value: string;
  meaning: string;
}

export interface NewsFaqItem {
  question: string;
  answer: string;
}

export interface NewsArticle {
  slug: string;
  /** 頁面 H1、清單卡片標題。 */
  title: string;
  /** SEO meta title，跟 H1 可以不同（更適合搜尋結果點擊），60 字內。 */
  metaTitle: string;
  /** meta description，150 字內。 */
  metaDescription: string;
  /** 我們自己發布的日期。 */
  publishDate: string;
  coreKeyword: string;
  longTailKeywords: string[];
  /** 快訊摘要／30 秒懶人包，AEO 精選摘要用。 */
  summaryBullets: string[];
  /** 事件核心還原，一段一個字串。 */
  eventCore: string[];
  backgroundIntro: string;
  pillars: NewsPillar[];
  glossary: NewsGlossaryTerm[];
  impactIntro: string;
  impactTable: NewsImpactRow[];
  impactAnalysis: string;
  focusParagraphs: string[];
  faq: NewsFaqItem[];
}

export const NEWS_ARTICLES: NewsArticle[] = [];

export function getNewsArticle(slug: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find((article) => article.slug === slug);
}

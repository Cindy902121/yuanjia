/**
 * `/media/[slug]` 詳情頁的深度內容（2026-08-25 新增）。
 *
 * 沿革：一開始這批內容是規劃成獨立的 `/news`（最新消息）頁面，使用者後來
 * 討論後決定重新分工（見這次改動附近的討論脈絡）：
 * - `/media`：別人報導我們的清單／詳情——**這裡**，包含深度分析類的報導。
 * - `/faq`：常見問題，含消費者使用面問題，也含「關於元家」的公司介紹型
 *   問答（跟這篇報導相關的那 4 題，現在唯一存放處是
 *   src/lib/content/faq-items.ts，這裡只用 `relatedFaqIds` 引用，不重複
 *   存一份文字）。
 * - `/news`：改為專門留給元家自己發布的第一手消息（新品、優惠、公告），
 *   跟「別人怎麼報導我們」是兩回事，見 src/lib/content/news-items.ts。
 *
 * 內容產製守則（真實性最高原則）跟原本規劃的一樣沒變：
 * 1. 核心事實（時間、地點、人物、數據、事件經過）必須跟原文完全一致，
 *    不能捏造假數據或虛構引言。
 * 2. 加深加廣僅限於：背景脈絡、產業影響、名詞解釋、FAQ、趨勢分析。
 *
 * 不是每篇 media-items.ts 的報導都需要在這裡有對應資料——只有原文資訊量
 * 夠豐富、值得展開的才做，見 media-items.ts 的 `slug` 欄位說明。
 * `getMediaDetail(slug)` 找不到就回傳 undefined，`/media/[slug]` 頁面會
 * 用 `notFound()` 處理（理論上不會發生，因為清單頁只有填了 `slug` 的項目
 * 才會連過來，這裡只是防禦性寫法）。
 */

export interface MediaGlossaryTerm {
  term: string;
  definition: string;
}

export interface MediaPillar {
  title: string;
  description: string;
}

export interface MediaImpactRow {
  metric: string;
  value: string;
  meaning: string;
}

export interface MediaDetail {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  coreKeyword: string;
  longTailKeywords: string[];
  summaryBullets: string[];
  eventCore: string[];
  backgroundIntro: string;
  pillars: MediaPillar[];
  glossary: MediaGlossaryTerm[];
  impactIntro: string;
  impactTable: MediaImpactRow[];
  impactAnalysis: string;
  focusParagraphs: string[];
  /** 引用 src/lib/content/faq-items.ts 裡的 FaqItem.id，不重複存文字。 */
  relatedFaqIds: string[];
}

export const MEDIA_DETAILS: MediaDetail[] = [
  {
    slug: "2wan-dun-supply-chain",
    metaTitle: "年掌握2萬噸海鮮貨源！元家企業如何成為台灣冷凍海鮮供應鏈龍頭",
    metaDescription:
      "元家企業年掌握 35 國、18,000 多公噸海鮮貨源，服務好市多、漢來美食等 4,000 多家客戶，大比目魚、白蝦、干貝進口量居台灣第一。從供應鏈管理、2 小時出貨效率到萬噸冷凍倉儲，解析這家冷凍水產龍頭如何撐起台灣餐桌上的海鮮供應。",
    coreKeyword: "冷凍海鮮供應商",
    longTailKeywords: [
      "元家企業 好市多 海鮮供應商",
      "台灣最大冷凍水產供應商",
      "大比目魚 白蝦 干貝 進口台灣第一",
      "海鮮供應鏈管理",
      "MSC 永續認證 冷凍海鮮",
    ],
    summaryBullets: [
      "規模：元家企業成立 40 多年，每年從 35 國進口超過 18,000 公噸、上百種海鮮，足夠 40 萬人吃一整年，服務好市多、家樂福、島語、饗賓、漢來美食等超過 4,000 家客戶。",
      "地位：大比目魚、白蝦、干貝、圓鱈、帝王蟹五項進口量皆為台灣第一，去年營收突破 50 億元。",
      "關鍵：執行長顏志杰指出，公司不靠價格取勝，而是靠「供應鏈管理、進出貨效率、倉儲服務」三大基石打造穩定、高效的供貨系統。",
    ],
    eventCore: [
      "元家企業是台灣規模最大的冷凍水產供應商，成立超過 40 年，主要供應對象涵蓋島語、饗賓、欣葉等知名 Buffet 集團，以及好市多、家樂福等大型量販通路。根據今周刊（2025/10/08，第 1503 期）報導，元家每年自 35 個國家進口逾 18,000 公噸、上百種海鮮，供貨量足夠 40 萬人吃一整年；服務客戶數超過 4,000 家，去年營收突破 50 億元。其中大比目魚、白蝦、干貝、圓鱈與帝王蟹五項品類的進口量，皆為全台第一。",
      "執行長顏志杰在受訪時表示：「我們不靠價格取勝，而是穩定、高效的供貨系統」，點出公司的核心競爭策略並非削價競爭，而是供應鏈本身的穩定性與效率。",
    ],
    backgroundIntro: "報導中點出元家維持供貨穩定與效率的三大營運基石：",
    pillars: [
      {
        title: "供應鏈管理",
        description:
          "累積數百家海外供應商，同一種海鮮備有多個產地來源，避免單一產區因天災、疫病或政治因素斷貨的風險。",
      },
      {
        title: "進出貨效率",
        description:
          "透過 ERP（企業資源規劃）系統協調，從接單到出貨僅需 2 小時，並配合 40 輛自有物流車隊配送。",
      },
      {
        title: "倉儲服務",
        description:
          "冷凍庫可容納 10,000 公噸海鮮，協助客戶存放 1-3 個月庫存，並以效期管理系統發出警報，避免過期損耗。",
      },
    ],
    glossary: [
      {
        term: "ERP 系統",
        definition:
          "企業資源規劃系統，把接單、庫存、出貨等流程串在同一套系統裡即時協調，是報導中「2 小時出貨」的技術基礎。",
      },
      {
        term: "MSC 永續認證",
        definition:
          "海洋管理委員會（Marine Stewardship Council）核發的國際海洋漁業永續認證，確保漁獲來自不會過度捕撈、對生態衝擊較低的漁場。",
      },
      {
        term: "一條龍服務",
        definition:
          "從採購、倉儲到配送全部自行掌握，不假手多層外包廠商，是報導中漢來美食評價元家的關鍵字。",
      },
    ],
    impactIntro:
      "這組數據呈現出台灣冷凍水產供應鏈的一個縮影：中下游通路（量販、餐飲）對「穩定＋快速」的需求，正逐漸取代單純比價，供應商的倉儲量能與物流反應速度變成關鍵競爭力；同時永續認證（如 MSC）也開始成為採購方的隱性門檻，不只是行銷話術。",
    impactTable: [
      { metric: "貨源國家數", value: "35 國", meaning: "供應來源高度分散，降低單一產地斷貨風險" },
      { metric: "年供貨量", value: "18,000 多公噸", meaning: "約可供應 40 萬人吃一整年" },
      { metric: "服務客戶數", value: "4,000 多家", meaning: "涵蓋量販、Buffet、餐飲通路" },
      {
        metric: "全台進口量第一品項",
        value: "大比目魚、白蝦、干貝、圓鱈、帝王蟹（5 項）",
        meaning: "在特定海鮮品類具市場主導地位",
      },
      { metric: "出貨效率", value: "接單到出貨 2 小時", meaning: "供應鏈反應速度是差異化競爭力，非單純比價" },
      { metric: "冷凍倉儲量能", value: "10,000 公噸", meaning: "可協助下游客戶降低自建倉儲成本、分攤 1-3 個月庫存" },
      { metric: "永續佈局", value: "申請中 MSC 認證", meaning: "回應客戶端對永續漁業日益提升的採購要求" },
    ],
    impactAnalysis:
      "報導也提到元家內部管理細節：海鮮料號分類達 2,000 多個，光是大比目魚就細分超過 200 個品項，倉儲依出貨頻率分類擺放以加快揀貨速度。這類精細化管理，是「2 小時出貨」承諾背後真正的營運基礎。",
    focusParagraphs: [
      "報導中引用元家最大客戶之一、漢來美食西餐品牌總經理劉子銘的採購方觀點：「元家是少數能做到量大且品質一致，還能提供一條龍服務的供應商」，平均每月供應數十公噸食材給漢來。這個第一線採購方的評價，呼應了執行長顏志杰「不靠價格取勝」的說法——對大型餐飲通路而言，供貨穩定性與品質一致性，比單價高低更影響長期採購決策。",
      "這類精細化管理，是外界較少關注、但支撐整篇報導核心論點（穩定＋效率）的實務細節。",
    ],
    relatedFaqIds: ["about-yuanjia", "top-import-volume", "2-hour-shipping", "supply-risk-mitigation"],
  },
];

export function getMediaDetail(slug: string): MediaDetail | undefined {
  return MEDIA_DETAILS.find((detail) => detail.slug === slug);
}

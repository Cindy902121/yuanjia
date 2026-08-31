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
  {
    slug: "sustainability-msc-asc-packaging",
    metaTitle: "元家企業永續轉型：一年減少保麗龍相當於兩座101高度",
    metaDescription:
      "元家企業推動保麗龍轉紙箱包材改革，首年減量相當於兩座台北101高度，並導入MSC/ASC永續認證、提前下架魩仔魚。執行長顏志杰直言海洋永續是「生存現實」，公開消費者辨識永續海鮮的方法。",
    coreKeyword: "海鮮永續認證",
    longTailKeywords: [
      "MSC永續認證海鮮",
      "ASC責任養殖認證",
      "保麗龍轉紙箱包材",
      "元家企業永續轉型",
      "海洋永續消費指南",
    ],
    summaryBullets: [
      "元家企業推動包材永續轉型，首年保麗龍轉紙箱的減量成果，疊起來相當於兩座台北101的高度。",
      "除了包材改革，元家也提前下架魩仔魚、導入MSC（野生捕撈）與ASC（養殖）雙認證，並斥資升級50年老廠房的電力與冷凍系統。",
      "執行長顏志杰指出，海洋永續不是口號而是「生存現實」，消費者只要多花約一成預算，就能透過選購支持永續海鮮。",
    ],
    eventCore: [
      "元家企業成立超過 50 年，是台灣冷凍海鮮供應商，全球採購網絡橫跨 50 個國家，供應島語、饗饗、旭集等餐飲品牌以及火鍋店與大型零售通路。根據欣傳媒報導，元家近年積極推動一系列永續行動，其中最具體的成果是包材改革：把過去慣用的保麗龍箱逐步轉換為紙箱，首年減少的保麗龍箱數量，堆疊起來的高度相當於兩座台北 101。",
      "執行長顏志杰表示，海洋永續對元家而言「不是口號，而是生存現實」，並指出如果忽視海洋永續，消費者將面臨四個層面的衝擊：選擇變少、價格上漲、食安風險增加，以及環境持續惡化。",
    ],
    backgroundIntro: "報導中拆解了元家包材改革的具體做法，以及背後的認證與名詞：",
    pillars: [
      {
        title: "差異化包材策略",
        description:
          "元家並非一次性全面淘汰保麗龍，而是採取差異化策略：對有專業冷藏設備的餐廳與批發商改用紙箱；保麗龍則保留給仍需要較佳保溫效果的傳統市場攤商使用，提高客戶端的接受度，避免一次到位反而造成保鮮品質下滑或客戶流失。",
      },
      {
        title: "提前下架幼魚品項",
        description: "在法規要求之前，主動下架魩仔魚（幼魚）品項，避免過度捕撈影響漁業資源永續。",
      },
      {
        title: "設備與管理升級",
        description: "投入數百萬升級近 50 年廠房的電力與冷凍系統，並建立嚴格的廢水管理規範。",
      },
    ],
    glossary: [
      {
        term: "MSC 永續認證",
        definition:
          "海洋管理委員會（Marine Stewardship Council）核發，藍色標章，代表野生捕撈來源符合永續漁業標準。",
      },
      {
        term: "ASC 責任養殖認證",
        definition:
          "水產養殖管理委員會（Aquaculture Stewardship Council）核發，綠色標章，代表養殖過程符合環境與社會責任標準。",
      },
      {
        term: "魩仔魚",
        definition: "多種魚類的幼魚統稱，過度捕撈幼魚會影響魚類族群的世代繁衍與漁業資源永續。",
      },
    ],
    impactIntro:
      "這些行動反映出台灣冷凍水產供應鏈的一個轉變：永續不再只是品牌形象裝飾，而是實際反映在包材採購、產品線調整與設備投資上的營運決策。對消費者而言，購買時留意 MSC／ASC 標章，等於用消費行為直接支持這整套供應鏈轉型。",
    impactTable: [
      { metric: "包材轉型", value: "差異化紙箱／保麗龍策略", meaning: "首年減量相當於兩座台北101高度" },
      { metric: "認證導入", value: "MSC（野生捕撈）／ASC（養殖）雙認證", meaning: "提供消費者可辨識的永續選購依據" },
      { metric: "幼魚保護", value: "提前下架魩仔魚品項", meaning: "減少對漁業資源的過度捕撈壓力" },
      { metric: "設備升級", value: "投入數百萬升級電力／冷凍系統", meaning: "降低老舊設備能耗與食安風險" },
      {
        metric: "社會參與",
        value: "顏志杰兼任海巡之友會北區會長",
        meaning: "支持海巡查緝非法捕撈、海洋生物救援、海洋污染防治",
      },
    ],
    impactAnalysis:
      "執行長顏志杰提出的「消費者只需多花約一成預算」的說法，把永續海鮮的選購門檻具體量化，降低了消費者對「永續等於昂貴」的疑慮。他也提供了具體的辨識方法：認明藍色 MSC（野生捕撈）與綠色 ASC（責任養殖）標章，或直接到 IKEA、家樂福、好市多的永續專區選購。",
    focusParagraphs: [
      "值得關注的是，顏志杰同時擔任「海巡之友會」北區會長，這個身份讓元家的永續承諾不只停留在自家供應鏈內部，也延伸支持第一線海洋執法（查緝非法捕獵、海洋生物救援、海洋污染防治），是報導中比較容易被忽略、但呼應整體永續論述的公眾參與面向。",
    ],
    relatedFaqIds: [
      "msc-vs-asc-label",
      "sustainable-seafood-cost",
      "yuanjia-sustainability-actions",
      "juvenile-fish-sustainability",
    ],
  },
  {
    slug: "food-safety-warehouse-management",
    metaTitle: "元家企業揭密食安管理：20位品保人員如何把關每一批海鮮",
    metaDescription:
      "元家企業執行長顏志杰公開食安與倉儲管理心法，20位專職品保人員把關進貨檢驗，取得HACCP、ISO22000、FSSC22000等多項國際認證。四星BAP認證藍鑽蝦來自沙烏地阿拉伯紅海，一次看懂元家如何守護海鮮供應鏈安全。",
    coreKeyword: "海鮮食品安全",
    longTailKeywords: [
      "HACCP認證海鮮供應商",
      "藍鑽蝦BAP認證",
      "冷凍海鮮效期管理",
      "元家企業品保團隊",
      "海鮮供應鏈溯源",
    ],
    summaryBullets: [
      "元家企業執行長顏志杰於2024台北國際食品展公開食安管理心法，強調「效期管理」比單純「先進先出」更關鍵，同批貨也要依捕撈時間分開控管。",
      "元家在工廠與物流中心配置約20位專職品保人員，規模大於同業，並取得HACCP、ISO22000、歐盟EEC、HALAL、FSSC22000等多項國際認證。",
      "主打商品藍鑽蝦來自沙烏地阿拉伯紅海，取得四星BAP認證、無添加養殖，是元家延伸出蝦餃等產品線的核心品項。",
    ],
    eventCore: [
      "元家企業成立於 1968 年，最早以台灣漁產批發起家，1983 年跨足水產外銷，1987 年開始為國內市場進口海鮮，累積超過 50 年產業經驗。根據食聞報導，執行長顏志杰於 2024 年台北國際食品展（6 月 26 日至 29 日）率隊參展，展出包含藍鑽蝦在內的多款冷凍水產與特色商品。",
      "顏志杰在受訪時提出「食品業要做對的事，也要把事情做對」的經營理念，說明公司長期投入大量人力與資源，建立完整的倉儲管理系統。",
    ],
    backgroundIntro: "報導中拆解了元家的倉儲管理心法與取得的國際認證：",
    pillars: [
      {
        title: "效期管理優先於先進先出",
        description:
          "一般倉儲系統多採用「先進先出」（First In First Out）原則出貨，但顏志杰指出，食品業更需要強調「效期管理」——即使是同一批進口或遠洋水產，也必須依照實際捕撈時間分別控管效期，不能只看入庫順序，否則可能讓效期較短的漁獲被延後出貨。",
      },
      {
        title: "藍鑽蝦與 BAP 認證",
        description:
          "藍鑽蝦來自沙烏地阿拉伯紅海，取得四星 BAP（Best Aquaculture Practices，最佳水產養殖規範）認證，強調無添加養殖，肉質與風味表現優於一般養殖蝦。元家以藍鑽蝦為核心，延伸出蝦餃等加工產品線。",
      },
    ],
    glossary: [
      { term: "HACCP", definition: "危害分析重要管制點，食品業界最基礎的食安管理系統。" },
      { term: "ISO 22000", definition: "國際食品安全管理系統標準。" },
      { term: "FSSC 22000", definition: "在 ISO 22000 基礎上加嚴的全球食品安全倡議認可標準。" },
      { term: "EU EEC 認證", definition: "歐盟認證核准，代表符合歐盟輸入水產品的衛生要求。" },
      { term: "HALAL", definition: "清真認證，符合伊斯蘭教規範的食品標準。" },
    ],
    impactIntro:
      "元家的品保人力規模（約 20 位專職人員）明顯高於同業，反映出食品供應商在食安投入上的差異，不只是「有沒有認證」的表面問題，更在於是否有足夠的人力與制度支撐每一個環節的實際執行。",
    impactTable: [
      { metric: "供應商源頭管理", value: "實地走訪供應商工廠，查核管理水準、規模與原料來源", meaning: "從源頭把關品質與合法性" },
      { metric: "進貨檢驗", value: "針對特定品項進行重金屬與菌數檢測", meaning: "確保符合法規食安標準" },
      { metric: "生產過程抽驗", value: "加工階段抽樣檢驗", meaning: "掌握製程中的品質變化" },
      { metric: "成品留樣", value: "保留成品樣本供追溯", meaning: "發生疑慮時可回溯查證" },
      { metric: "溫控監控", value: "24 小時溫度監控系統", meaning: "確保冷凍鏈全程維持適當溫度" },
      { metric: "人力配置", value: "工廠與物流中心約20位專職品保人員", meaning: "提高檢驗頻率、降低風險" },
    ],
    impactAnalysis:
      "顏志杰觀察到後疫情時代「剪刀經濟」（開封即食）趨勢帶動即食食品成長，元家因此開發「型男龍蝦沙拉」等產品；同時也留意到歐美健康飲食趨勢偏好白肉與植物性蛋白，發展出毛豆搭配海藻等商品，反映供應商如何依消費趨勢調整產品線，而不只是被動供貨。",
    focusParagraphs: [
      "報導也提到元家未來規劃在合作餐廳網站上公開食安認證文件與檢驗報告，讓消費者可以直接查核，這個透明化承諾如果落實，會是食安資訊揭露上比較少見的具體做法，值得後續觀察是否真的上線。",
    ],
    relatedFaqIds: [
      "yuanjia-certifications",
      "expiry-management-vs-fifo",
      "bap-certification-blue-diamond-shrimp",
      "quality-assurance-team-size",
    ],
  },
];

export function getMediaDetail(slug: string): MediaDetail | undefined {
  return MEDIA_DETAILS.find((detail) => detail.slug === slug);
}

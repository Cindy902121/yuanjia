/**
 * 媒體報導精選清單，2026-08-19 從 src/app/media/page.tsx 抽出來（使用者要求把
 * 「日系雜誌編排風」也套用到 /media，需要同一批真實資料餵給兩種不同排版的頁面
 * ——真正的 /media 頁面跟 /design-preview/media 預覽頁共用同一份資料，避免各自
 * 維護一份、之後其中一份漏改而跟另一份對不上）。
 *
 * 資料來源、挑選標準、圖片裁切原則見 src/app/media/page.tsx 保留的檔頭說明
 * （那裡是「真正上線」的頁面，culturally 更適合放完整的來源說明）。
 */
export interface MediaItem {
  date: string;
  outlet: string;
  title: string;
  summary: string;
  sourceUrl: string;
  /** 沒有 image 的項目維持純文字呈現。 */
  image?: { src: string; alt: string };
  /**
   * 2026-08-25 新增。有值代表這篇報導有另外做深度詳情頁
   * （/media/[slug]，內容見 src/lib/content/media-detail.ts），清單頁的
   * 連結會改成連到站內詳情頁，不是直接連到外部原文。**不是每篇都需要
   * 填**——原文本身資訊量夠豐富（有具體數據、引言、分析框架）才值得展開，
   * 像這篇以外的其他報導原文本身較單薄，展開反而會變成湊字數，維持連到
   * 外部原文即可，不用為了「全部一致」硬補一份薄弱的詳情內容。
   */
  slug?: string;
}

export const MEDIA_ITEMS: MediaItem[] = [
  {
    date: "2026-06-16",
    outlet: "風傳媒",
    title: "無懼全球波動！元家企業深化垂直整合 2026食品展大秀上百款頂級海鮮與即食解方",
    summary: "報導元家在全球貿易情勢波動下持續深化垂直整合策略，於 2026 食品展展出上百款頂級海鮮與即食料理解決方案。",
    sourceUrl: "https://www.storm.mg/article/11142018",
    image: { src: "/media-seafood-platter.jpg", alt: "元家展出的頂級海鮮拼盤照片" },
  },
  {
    date: "2026-02-12",
    outlet: "欣傳媒",
    title: "從兩座101高的減量奇蹟，看元家海鮮如何用「永續」捍衛你的餐桌？",
    summary: "報導元家推動「保麗龍轉紙箱」包材改革，首年減少的保麗龍箱堆疊起來相當於兩座台北 101 的高度，作為供應鏈永續行動的具體案例。",
    sourceUrl: "https://www.xinmedia.com/article/305125",
    slug: "sustainability-msc-asc-packaging",
  },
  {
    date: "2026-01-27",
    outlet: "工商時報",
    title: "啦啦隊女神「梓梓」應援頂級海味！元家攜手日本漁連 微風超市舉辦干貝盛宴！",
    summary: "報導元家攜手北海道漁業協同組合連合會於微風超市舉辦干貝料理活動，推廣主打鮮甜多汁、料理方便的日本頂級干貝。",
    sourceUrl: "https://www.ctee.com.tw/news/20260125700418-431207",
  },
  {
    date: "2025-12-31",
    outlet: "經濟日報",
    title: "元家企業推「瑪瑙之宴」年菜組 冷鏈科技打造五星級團圓饗宴",
    summary: "報導元家旗下電商平台「宅鮮配」推出的「瑪瑙之宴」年菜禮盒，強調以冷鏈技術打造接近現撈品質的團圓年菜。",
    sourceUrl: "https://money.udn.com/money/story/7843/9236571",
    image: { src: "/media-cny-feast.jpg", alt: "元家宅鮮配瑪瑙之宴年菜禮盒照片" },
  },
  {
    date: "2025-11-25",
    outlet: "東森財經新聞",
    title: "【趨勢造夢者】年進萬噸海鮮供全台 冷凍水產霸主營收衝60億",
    summary: "專題報導元家如何以全球採購網絡與快速出貨能力，成為撐起台灣海鮮供應鏈的重要角色，穩定服務超過四千家通路客戶。",
    sourceUrl: "https://www.youtube.com/watch?v=E68yIQtjq1g",
  },
  {
    date: "2025-10-09",
    outlet: "今周刊",
    title: "島語、饗賓、好市多...水產供應商－元家企業年掌握近2萬噸貨源，三大基石撐起冷凍海鮮龍頭",
    summary: "分析元家如何以供應鏈韌性、倉儲管理與出貨效率三大基石，穩居台灣冷凍海鮮供應商龍頭地位。",
    sourceUrl: "https://www.businesstoday.com.tw/article/category/183016/post/202510080004/",
    slug: "2wan-dun-supply-chain",
  },
  {
    date: "2025-08-07",
    outlet: "天下雜誌",
    title: "元家企業榮登2025《天下》兩千大調查「食品原料第13名」",
    summary: "元家在《天下》2000 大企業調查中，於食品原料類別排名第 13 名，展現穩健的市場規模與競爭力。",
    sourceUrl: "https://www.cw.com.tw/cw2000/database",
    image: { src: "/media-cw-award.jpg", alt: "元家企業榮登天下兩千大調查食品原料第13名宣傳圖" },
  },
  {
    date: "2025-01-11",
    outlet: "聯合報",
    title: "元家企業認證等級高品質海鮮 滿足全家人年節與健康需求",
    summary: "介紹元家旗下電商「元家宅鮮配」年節精選商品，包括取得國際 BAP 認證的白蝦與燉補雞湯商品。",
    sourceUrl: "https://www.yens.com.tw/msg/msg380.html",
    image: { src: "/media-udn-clipping.jpg", alt: "聯合報報導中元家海鮮商品照片" },
  },
  {
    date: "2024-07-02",
    outlet: "食聞",
    title: "進口水產領頭標竿元家企業 「做對的事」守護食品安全",
    summary: "報導元家在倉儲管理與檢驗團隊上的投入，以及取得的多項國際食品安全認證。",
    sourceUrl: "https://www.foodnext.net/news/newssafe/paper/5739965854",
    image: { src: "/media-certifications.jpg", alt: "元家取得的多項國際食品安全認證證書照片" },
    slug: "food-safety-warehouse-management",
  },
  {
    date: "2023-11-24",
    outlet: "華爾街日報",
    title: "The Wall Street Journal 相關報導",
    summary: "元家在《華爾街日報》一篇探討兩岸經貿情勢的報導中被提及，作為台灣供應鏈韌性的案例之一，報導中並附上元家在美國賣場舉辦產品試吃活動的照片。",
    sourceUrl:
      "https://www.wsj.com/world/asia/china-tried-using-economic-ties-to-bring-taiwan-closer-it-isnt-working-8a7d63dc",
    image: { src: "/media-wsj-booth.jpg", alt: "元家在美國賣場舉辦產品試吃活動的照片，華爾街日報報導原圖" },
  },
];

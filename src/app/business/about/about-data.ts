export type AboutPage = {
  slug: "company" | "strengths" | "milestones" | "supply-service" | "quality-safety" | "sustainability";
  label: string;
  kicker: string;
  title: string;
  summary: string;
  imagePath: string;
  imageAlt: string;
  imageCaption: string;
  content: string[];
  points?: { title: string; description: string }[];
  stats?: { value: string; label: string }[];
  gallery?: { path: string; alt: string; caption: string }[];
  resources?: { title: string; description: string; href: string; label: string; imagePath?: string; imageAlt?: string; imageFit?: "cover" | "contain" }[];
  externalHref?: string;
  externalLabel?: string;
};

export const aboutPages: AboutPage[] = [
  {
    slug: "company", label: "企業介紹", kicker: "ABOUT YUANJIA", title: "從澎湖出發，連結全球食品供應。",
    summary: "元家從水產運銷起步，持續發展為服務多元市場的食品供應夥伴。",
    imagePath: "/brand/company-origin.jpg", imageAlt: "元家源起的澎湖桶盤嶼", imageCaption: "元家源起於澎湖的水產運銷事業。",
    content: ["1968 年，元家前身「元進行」於澎湖草創；1979 年於台北正式設立元家企業股份有限公司，隔年於高雄設立冷凍草蝦外銷廠，以自有品牌將產品行銷日本與美國。", "從冷凍水產的進口、銷售與生產加工出發，元家逐步拓展至調理食品與國際市場，服務零售、餐飲、食品加工與多元通路。企業採購服務以清楚的規格、包裝與供應溝通，協助合作夥伴找到合適的產品方案。"],
    points: [["穩定供應", "以可靠的產品與服務，回應不同市場的食品需求。"], ["創新整合", "提供價值創新的商品與整合服務，支持合作夥伴持續成長。"], ["互信共贏", "建立長期、清楚且相互信賴的合作關係。"]].map(([title, description]) => ({ title, description })),
    stats: [{ value: "60+", label: "業務服務人員" }, { value: "4,000+", label: "服務客戶" }, { value: "5 大洲", label: "外銷市場" }, { value: "21 國", label: "國際貿易據點與客戶網絡" }],
    gallery: [{ path: "/brand/channel-dining.jpg", alt: "元家食品供應現場", caption: "食品供應與批發服務現場" }, { path: "/brand/channel-trade.jpg", alt: "元家零售通路活動", caption: "零售與量販通路" }, { path: "/brand/channel-service.jpg", alt: "元家國際展覽", caption: "國際展覽與合作洽談" }],
    externalHref: "https://www.yens.com.tw/proimages/download/Company_Intro_V202402.pdf", externalLabel: "下載元家企業簡介",
  },
  {
    slug: "strengths", label: "企業優勢", kicker: "OUR STRENGTHS", title: "讓合作被看見的，是每一段供應能力。",
    summary: "從國際選品到冷鏈交付，將食品專業轉化為企業合作的穩定基礎。",
    imagePath: "/brand/production-facility.jpg", imageAlt: "元家高雄冷凍食品加工廠", imageCaption: "從加工生產到產品服務，持續延伸食品供應的專業。",
    content: ["企業採購不只是選擇商品，更需要供應端能回應品類、品質、規格與交期的整體能力。元家將各環節整合，協助不同合作情境找到合適的方案。以下四項能力，整理自元家官方企業優勢公開資訊。"],
    points: [["國際採購", "掌握全球水產源頭，並以 MSC-COC、ASC-COC 等國際海鮮認證支持永續選品。"], ["研發生產", "高雄冷凍食品加工廠、台南調理食品廠與食品研發中心，支援標準化生產與產品開發。"], ["食品安全", "20 位以上專職品保人員、每批進貨檢測、自有實驗室與產品追溯制度。"], ["倉儲物流", "大型冷凍倉庫 24 小時監控、全年低於 -20°C，搭配 LMS 與批號效期管理。"]].map(([title, description]) => ({ title, description })),
    gallery: [{ path: "/brand/channel-global.jpg", alt: "元家國際採購與展覽", caption: "國際採購與全球合作" }, { path: "/brand/production-facility.jpg", alt: "元家冷凍食品加工廠", caption: "加工生產與研發能力" }, { path: "/brand/quality-team.jpg", alt: "元家食品品質檢測實驗室", caption: "品質檢驗與食品安全" }, { path: "/brand/cold-storage.jpg", alt: "元家食品檢測流程", caption: "冷鏈與流程管理" }],
  },
  {
    slug: "milestones", label: "發展歷程", kicker: "MILESTONES", title: "從水產事業，走向多元食品市場。",
    summary: "幾個關鍵節點，串起元家長期累積的水產與食品服務經驗。",
    imagePath: "", imageAlt: "", imageCaption: "",
    content: ["元家的發展，始終圍繞著水產專業、食品安全與市場需求的變化。從地方水產運銷、外銷加工，到調理食品與國際貿易，每一步都讓服務範圍更完整。"],
    points: [["1968", "於澎湖設立「元進行」，跨海發展至台南為行銷據點，批發漁貨運銷全台。"], ["1976", "成立台北營業據點。"], ["1977", "開始經營冷凍水產品。"], ["1979", "設立元家企業股份有限公司。"], ["1980", "開始冷凍草蝦外銷事業。"], ["1982", "自創品牌行銷日本、美國。"], ["1983", "於高雄設立台灣第一家冷凍水產工廠「元海鄉」。"], ["1987", "開始轉型經營冷凍水產品進口貿易，發展內銷市場。"], ["1989", "設立水產品研發室及實驗廚房。"], ["1990", "榮獲台灣 CAS 標章認證，導入 CIS 系統。"], ["1995", "成立餐飲食材供應事業部與產品策略中心。"], ["1997", "設立 Marine Biotech 海洋生技研究中心。"], ["2000", "成立「海鮮宅配網」。"], ["2004", "高雄廠榮獲 HACCP 及 ISO9001 認證。"], ["2007", "設立台南調理食品廠，成立物流事業部及北、中、南部物流中心。"], ["2010", "取得歐盟 EEC 登入許可、HALAL 認證，成立國際貿易事業部。"], ["2011", "導入 Oracle E-Business Suite，成立「上品流通股份有限公司」。"], ["2014", "成立元家博愛公益慈善基金會。"], ["2018", "通過 MSC-COC 及 ASC-COC 認證，推行企業 50 周年紀念活動。"], ["2022", "台南廠榮獲 FSSC 22000 認證，投入綠能與魚電共生。"], ["2023", "中部王田物流中心正式營運，推動 ESG。"], ["2024", "輔銷系統正式上線，持續推動數位轉型。"], ["2025", "榮登《天下》兩千大調查食品原料類第 13 名。"], ["2026", "顏師傅毛豆藜麥洋栖菜榮獲國際風味評鑑最高等級三星獎章。"]].map(([title, description]) => ({ title, description })),
  },
  {
    slug: "supply-service", label: "供應與服務", kicker: "SUPPLY & SERVICE", title: "從品項到交期，讓合作更有依據。",
    summary: "以食品供應、規格溝通與採購服務，回應不同通路與合作規模。",
    imagePath: "/brand/yuanjia-banner.jpg", imageAlt: "元家全球冷凍水產食材供應服務", imageCaption: "全球水產食材供應服務，是元家長期累積的專業。",
    content: ["元家服務零售與量販、餐飲、食品加工、電子商務及國際貿易等多元合作情境。採購方可從企業型錄查看品項、規格與包裝，透過詢價流程再確認實際供應條件與交期。"],
    points: [["服務通路", "零售與量販、餐飲、食品加工、電子商務與國際貿易。"], ["合作方式", "依品項、規格、包裝與預估用量，確認供應條件與交期。"], ["產品方向", "冷凍水產、調理食品與各式餐飲應用食材。"], ["採購入口", "登入後可從企業型錄瀏覽品項，並加入詢價單。"]].map(([title, description]) => ({ title, description })),
  },
  {
    slug: "quality-safety", label: "品質與食安", kicker: "QUALITY & SAFETY", title: "把食品安全，落在每個可驗證的環節。",
    summary: "從檢驗、溫度、倉儲到追溯，讓品質管理成為合作的共同基礎。",
    imagePath: "/brand/quality-team.jpg", imageAlt: "元家品質檢測實驗室", imageCaption: "元家官方品質檢測實驗室照片。",
    content: ["元家將品質管理落在採購、生產、檢驗、倉儲與追溯流程中。實際產品的認證與檢驗資訊，仍應以型錄、產品規格及正式合作文件為準。"],
    points: [["專業品保", "全台超過 20 位專職品保人員，從產品生產監督至出貨進行品質把關。"], ["自主檢測", "每批進貨皆進行自主性品質檢測與嚴格溫度管制。"], ["第三方驗證", "主要產品依食品安全計畫通過第三方檢驗證明。"], ["冷鏈與追溯", "以儲位、效期與追溯系統支援產品管理品質。"]].map(([title, description]) => ({ title, description })),
  },
  {
    slug: "sustainability", label: "永續責任", kicker: "SUSTAINABILITY", title: "與海洋、供應鏈和社會，共同走得更遠。",
    summary: "從永續供應、環境行動到社會公益，以長期承諾回應食品產業的責任。",
    imagePath: "/brand/sustainability-beach-cleanup.jpg", imageAlt: "元家博愛公益慈善基金會淨灘活動", imageCaption: "元家博愛公益慈善基金會淨灘活動。",
    content: ["從食品安全、供應商管理與冷鏈效率，到海洋環境與社會公益，元家以長期行動回應食品企業對環境與社會的責任。合作時，也能透過更清楚的供應資訊，讓產品選擇更貼近永續期待。"],
    resources: [
      { title: "2023 元家永續報告書", description: "了解元家在環境、社會與治理面向的永續行動與成果。", href: "https://www.yens.com.tw/proimages/2023-esg.pdf", label: "閱讀 2023 報告書", imagePath: "/brand/esg-2023-01.jpg", imageAlt: "2023 元家永續報告書封面" },
      { title: "2024 元家永續報告書", description: "查看最新年度的永續策略、管理成果與後續承諾。", href: "https://www.yens.com.tw/proimages/2024-esg.pdf", label: "閱讀 2024 報告書", imagePath: "/brand/esg-2024-01.jpg", imageAlt: "2024 元家永續報告書封面" },
      { title: "元家博愛公益慈善基金會", description: "認識元家投入捐血、淨灘與弱勢關懷等公益行動。", href: "https://charity.yens.com.tw/", label: "前往基金會官網", imagePath: "/brand/foundation-logo.png", imageAlt: "元家博愛公益慈善基金會官方識別", imageFit: "contain" },
    ],
  },
];

export function getAboutPage(slug: string) {
  return aboutPages.find((page) => page.slug === slug);
}

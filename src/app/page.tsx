import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDistinctCategories } from "@/lib/supabase/products";
import { buildOpenGraph, canonicalFor, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

const TITLE = "元家｜新鮮海鮮與調理食品";
const DESCRIPTION = "元家精選冷凍海鮮與調理食品，從商品列表開始探索。";

/**
 * 2026-08-18：Organization 結構化資料（使用者要求「SEO 技術基礎」），只放首頁
 * 一份（慣例做法，不是每一頁都重複放）。公司全名／地址／電話／社群連結都直接
 * 取自 Footer.tsx 已經在用的同一批真實資料（見 src/components/Footer.tsx，
 * 來源 yens.com.tw 公開聯絡資訊），不是另外編一份。
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "元家企業股份有限公司",
  alternateName: "YEN & Brothers Enterprise CO., LTD.",
  url: SITE_URL,
  logo: `${SITE_URL}/yens-logo.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "新北大道二段 217 號 14 樓",
    addressLocality: "新莊區",
    addressRegion: "新北市",
    postalCode: "242",
    addressCountry: "TW",
  },
  telephone: "+886-2-8521-1230",
  sameAs: [
    "https://www.youtube.com/@yensseafood",
    "https://www.facebook.com/yensseafood",
    "https://www.instagram.com/yensseafood",
    "https://www.tiktok.com/@yensseafood",
  ],
};

/**
 * 2026-08-18：openGraph.url 用絕對路徑 "/"——跟 root layout 的預設值幾乎一樣
 * （首頁本來就是全站分享時最常見的入口），仍然明講一次是為了讓這裡自己是
 * 一份完整、不用回頭看 layout.tsx 才看得懂的設定，跟其他頁面的寫法一致。
 */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonicalFor("/"),
  openGraph: buildOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/hero-seafood.jpg", width: 970, height: 980, alt: "元家精選海鮮" }],
  }),
};

/**
 * / 首頁。
 *
 * 2026-08-14：套用 design.md §6 Phase 1 的版面規格（見 §8「Phase 1：轉換與資訊
 * 架構」），把原本的中性骨架版面換成 design.md 描述的結構：
 * - §6.2 Hero：小標＋主標＋內文＋主要 CTA／次要 CTA，首屏下方三個信任短句。
 *   主標用 --font-serif（design.md §5.3：Hero 主標才用襯線字，不是全站），
 *   內文與按鈕維持 --font-sans。
 * - 快速分類（design.md §6.3「今天想吃什麼？」）：用真實的 6 個分類（見
 *   src/lib/fixtures/categories.ts），連到 /products?category=<slug>，
 *   /products 頁面會用這個 query string 預先選取對應分類篩選（見
 *   ProductListWithFilters、products/page.tsx）。
 * - ABOUT／QUALITY 區塊維持既有結構跟色彩（8/14 稍早已套用 design.md 色彩），
 *   只補上 id="about"／id="quality" 給 Header 的錨點導覽連結用。
 * - 卡片／圖片圓角依 design.md §5.4 統一改用 16px（rounded-2xl）。
 *
 * 2026-08-14（同日）：QUALITY 區塊提早套用 design.md §6.4（原本歸在 Phase 2），
 * 使用者明確要求先做這部分（純內容區塊，沒有假按鈕問題）：
 * - 5 步驟食安／冷鏈流程（全球採購→專業加工→品質檢驗→冷鏈倉儲→安心到家），
 *   文案直接取自 design.md §6.4。
 * - §6.4 原本要放「認證標章（名稱＋適用範圍＋詳情連結）」，但元家官網的食安頁
 *   （https://www.yens.com.tw/msg/message-FoodSafety.html）沒有列出具體的認證
 *   名稱（例如 ISO 22000、HACCP 這類），只列了具體做法／事實。不編造沒有依據的
 *   認證名稱，改用該頁列出的真實內容做成「食安亮點」卡片，一樣是取自該公開頁面、
 *   不是憑空杜撰。
 * - 移除原本的三欄 TrustPillar（食品安全把關／產地溯源／品質認證）——內容比較
 *   空泛，被上面這兩塊有實際內容支撐的區塊取代，避免旁邊放兩份意思重複、一份
 *   空泛一份具體的內容。
 * - 底部「查看完整食安說明」連到元家官網真實的食安頁（外部連結，新分頁開啟），
 *   不是假連結——我們自己還沒有食安詳情頁，與其做一個假的，不如連到真的、
 *   已經存在的來源頁面。
 *
 * 2026-08-14（同日）：Hero 改成用元家官網真實的首頁 Banner 照片（來源：
 * yens.com.tw／proimages/indexbanner001.jpg，經使用者確認同意才下載）。原圖左半
 * 邊燒進去「全球冷凍水產食材供應服務」這行字（圖片本身的像素，不是疊上去的 HTML
 * 文字），我們自己在同一個位置要放新的標題，兩段字疊在一起會很亂。
 *
 * 沒有用 AI／Photoshop 把原本的字「擦掉」——沒有這個工具，硬做只會留下明顯修補
 * 痕跡。改用的做法是：直接把有字的左半邊裁掉（public/hero-seafood.jpg，用 PIL
 * 從原圖 x=950 裁到最右邊，970×980，裁切線經過取樣確認完全避開文字像素），只留
 * 純海鮮擺拍、完全沒有文字的部分；左邊改用品牌深色（ink-900）色塊放我們自己的
 * 標題／CTA。左右用固定寬度分欄（不是用 object-position 在滿版寬度上裁，滿版寬度
 * 在很寬很扁的容器下用 cover 會整個重新縮放，沒辦法保證裁切結果，固定寬度分欄
 * 比較可預期）。手機版圖片疊到文字區塊上面，一樣是這張裁過的圖，構圖不含文字，
 * 疊在哪裡都安全。
 *
 * 版面參考 https://takamaru-fukuoka.com/ 的資訊架構（Hero banner → 品牌故事 ABOUT →
 * 三項信任訴求 QUALITY）已經被 design.md §6 的規格取代（design.md 是團隊確認要用的
 * 設計依據），這裡不再照那個外部參考站的結構。
 *
 * 依 PRD B2C-01（首屏品牌識別＋CTA＋商品探索入口）與 B2C-02（品牌故事、食品安全、
 * 品質、產地等公開信任內容）。目前沒有任何真實圖片或最終文案，全部是可替換的
 * 佔位文字／佔位圖片區塊，也不做輪播、視差或動畫（PRD B2C-01、design.md §7.3
 * 都明確排除／要求尊重 prefers-reduced-motion）。
 *
 * 會員登入、企業合作、購物車這三個 PRD 要求的入口放在全站 Header（見
 * src/components/Header.tsx），不在首頁重複顯示一次。
 */
export default async function HomePage() {
  // 2026-08-17：快速分類改查正式 Supabase 目前實際有的分類值（見
  // src/lib/supabase/products.ts），不是固定的 fixture 清單，C 本週排程要求。
  const supabase = await createClient();
  const categories = await getDistinctCategories(supabase);

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd data={organizationJsonLd} />

      {/* Hero：左邊深色品牌色塊放文字/CTA，右邊是元家官網真實照片（裁過，不含燒進圖片
          裡的文字，見上方檔案註解）。固定寬度分欄，不是滿版圖片配 object-position，
          原因同上。 */}
      <section className="relative flex min-h-[440px] flex-col border-b border-border-subtle bg-ink-900 lg:min-h-[560px] lg:flex-row">
        {/* 手機／平板：圖片在上，短一點的橫幅比例，一樣安全（整張裁過的圖都沒有文字）。 */}
        <div className="relative h-56 w-full sm:h-72 lg:hidden">
          <Image
            src="/hero-seafood.jpg"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right"
          />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-5 px-5 py-12 sm:px-8 lg:w-[46%] lg:flex-none lg:px-10 lg:py-16">
          <p className="text-sm font-bold tracking-[0.2em] text-white/80">
            從產地到餐桌的安心鮮味
          </p>
          <h1 className="max-w-md font-serif text-[clamp(2.25rem,4vw,3.5rem)] font-bold leading-[1.15] text-white">
            新鮮有來源，生活更有味
          </h1>
          <p className="max-w-md text-base leading-7 text-white/85">
            嚴選全球水產與即食料理，從採購、加工到冷鏈配送，替每一餐守住品質。
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-ocean-700 px-6 text-sm font-semibold text-white transition hover:bg-brand-ocean-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              開始挑選
            </Link>
            <a
              href="#quality"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              了解食安把關
            </a>
          </div>

          {/* 首屏下方三個信任短句，design.md §6.2。 */}
          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-4 text-sm font-medium text-white/80">
            <li>國際採購</li>
            <li>冷鏈配送</li>
            <li>食安認證</li>
          </ul>
        </div>

        {/* 桌面：圖片佔右側固定 54% 寬，跟左邊文字區塊左右並排。 */}
        <div className="relative hidden lg:block lg:w-[54%] lg:flex-none">
          <Image
            src="/hero-seafood.jpg"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="54vw"
            className="object-cover object-right"
          />
          {/* 圖片左邊緣跟文字色塊的接縫用漸層柔化，避免一條硬直線。 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink-900 to-transparent"
          />
        </div>
      </section>

      {/* 快速分類：design.md §6.3「今天想吃什麼？」。2026-08-17 改連到
          /products/categories/[slug]（這次新增的分類頁），不是 /products?category=；
          分類清單本身也改成查正式 Supabase 目前實際有的分類值，不是固定 fixture。 */}
      <section className="border-b border-border-subtle bg-surface-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-14 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-widest text-brand-ocean-700">
              今天想吃什麼？
            </p>
            <h2 className="text-2xl font-semibold text-ink-900">依分類快速挑選</h2>
          </div>

          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/products/categories/${encodeURIComponent(category.slug)}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-surface-warm p-4 text-center transition hover:border-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
                >
                  <div
                    aria-hidden="true"
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-ocean-050 text-xs text-brand-ocean-700"
                  >
                    圖示
                  </div>
                  <span className="text-sm font-medium text-ink-900 group-hover:text-brand-ocean-700">
                    {category.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ABOUT／品牌故事＋企業優勢：對應 PRD B2C-02 公開信任內容。
          2026-08-17：文字內容改寫自元家官網「企業介紹」「企業優勢」四個子頁（國際
          採購／研發生產／食品安全／倉儲物流），依使用者要求分析後套用，不是逐字
          照抄——原網頁段落較長，這裡濃縮成適合首頁閱讀的長度，事實（年份、認證
          名稱、地點）保留正確，文字重新組織過。來源：
          https://www.yens.com.tw/msg/message-CompanyIntroduction.html、
          https://www.yens.com.tw/msg/message-GlobalPurchasing.html、
          https://www.yens.com.tw/msg/message-R-DAndProduction.html、
          https://www.yens.com.tw/msg/message-LogisticManagement.html。
          「食品安全」卡片故意不重複展開內容，直接連到下面 QUALITY 區塊（已經有
          5 步驟流程＋食安亮點），避免同一頁兩處講同一件事。 */}
      <section id="about" className="scroll-mt-20 border-b border-border-subtle bg-surface-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-col gap-4">
              <p className="text-xs font-semibold tracking-widest text-brand-ocean-700">ABOUT</p>
              <h2 className="text-2xl font-semibold text-ink-900">關於元家</h2>
              <p className="text-sm leading-7 text-ink-600">
                元家企業的故事，最早可追溯到 1968
                年於澎湖草創的「元進行」商行；1979
                年於台北正式成立元家企業股份有限公司，隔年在高雄設立冷凍草蝦外銷廠，以自創品牌行銷日本、美國，奠定日後發展的基礎。此後陸續拓展冷凍水產的進口、銷售與生產加工，並跨足調理食品領域，2012
                年起積極開拓海外市場，成為橫跨零售、餐飲、電商與國際貿易的水產食品供應商。
              </p>
              <p className="text-sm leading-7 text-ink-600">
                我們期望透過食的流通，將幸福傳遞給世界——提供穩定、值得信賴的商品與服務，同時關懷生態環境的平衡，引領安心的飲食文化。
              </p>
            </div>
            <ImagePlaceholder label="品牌故事圖片預留位置" className="aspect-[4/3] flex-1" />
          </div>

          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-semibold text-ink-900">企業優勢</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdvantageCard
                title="國際採購"
                description="掌握全球水產源頭，通過 MSC、ASC 等國際永續漁業認證，兼顧美味與海洋永續。"
              />
              <AdvantageCard
                title="研發生產"
                description="自有食品研發中心與生產工廠，取得 FSSC 22000、HACCP 等多項國際品質認證。"
              />
              <AdvantageCard
                title="食品安全"
                description="專職品保團隊層層把關，詳見下方食安專區。"
                href="#quality"
              />
              <AdvantageCard
                title="倉儲物流"
                description="大型冷凍倉庫全年溫控 -20°C 以下，搭配專業物流管理系統，確保新鮮送達。"
              />
            </div>
          </div>
        </div>
      </section>

      {/* QUALITY／食安與冷鏈：design.md §6.4，5 步驟流程＋真實食安亮點（來源：
          yens.com.tw 食安頁，見上方檔案註解）。 */}
      <section id="quality" className="scroll-mt-20 bg-brand-fresh-050">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-xs font-semibold tracking-widest text-brand-fresh-700">QUALITY</p>
            <h2 className="text-2xl font-semibold text-ink-900">
              食品安全與品質，是我們的堅持
            </h2>
          </div>

          {/* 5 步驟流程，design.md §6.4：全球採購 → 專業加工 → 品質檢驗 → 冷鏈倉儲 → 安心到家。 */}
          <ol className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4 lg:flex-nowrap">
            {[
              "全球採購",
              "專業加工",
              "品質檢驗",
              "冷鏈倉儲",
              "安心到家",
            ].map((step, i, arr) => (
              <li key={step} className="flex flex-1 items-center gap-4 sm:flex-col sm:text-center">
                <div className="flex flex-col items-center gap-3 sm:flex-1">
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-fresh-700 text-sm font-bold text-white"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="text-sm font-semibold text-ink-900">{step}</p>
                </div>
                {i < arr.length - 1 ? (
                  <span aria-hidden="true" className="hidden text-brand-fresh-700/50 sm:block">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          {/* 食安亮點：取自元家官網食安頁的真實內容，不是編造的認證標章。 */}
          <div className="flex flex-col gap-6">
            <h3 className="text-center text-lg font-semibold text-ink-900">
              食安控管重點
            </h3>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "全台超過 20 位專職品保人員",
                "每批進貨自主性品質檢測與嚴格溫度管制",
                "主要產品皆依食品安全計畫通過第三方檢驗證明",
                "專業儲位與效期管理系統，100% 無過期產品",
                "大型專業冷凍倉庫、24hr 監控，全年溫度低於 -20℃",
                "自有專業品質檢驗實驗室，配置通過證照之檢測人員",
                "導入企業資源管理系統，產銷履歷記載完整、可追溯",
                "落實食品安全管制系統，配合政府食安推動政策",
              ].map((fact) => (
                <li
                  key={fact}
                  className="rounded-2xl border border-border-subtle bg-surface-white p-4 text-sm leading-6 text-ink-600"
                >
                  {fact}
                </li>
              ))}
            </ul>
            <a
              href="https://www.yens.com.tw/msg/message-FoodSafety.html"
              target="_blank"
              rel="noreferrer"
              className="mx-auto text-sm font-semibold text-brand-fresh-700 underline underline-offset-2 hover:text-brand-ocean-700"
            >
              查看元家官網完整食安說明 ↗
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * 企業優勢卡片。有 href 時整張卡是連結（目前只有「食品安全」連到 #quality 錨點，
 * 避免同一頁重複展開食安內容），沒有 href 時是純資訊卡片，不假裝可以點擊。
 */
function AdvantageCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href?: string;
}) {
  const content = (
    <>
      <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
      <p className="text-sm leading-6 text-ink-600">{description}</p>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-white p-4 transition hover:border-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-white p-4">
      {content}
    </div>
  );
}

/** 通用圖片佔位區塊：裝飾用，不承載資訊，aria-hidden 且不設 alt 文字（見 §7.3 alt 規則）。 */
function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-2xl border border-border-subtle bg-surface-warm px-4 text-center text-xs text-ink-600 ${className ?? ""}`}
    >
      {label}
    </div>
  );
}

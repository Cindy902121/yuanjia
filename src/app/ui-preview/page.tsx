import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveProducts } from "@/lib/supabase/products";
import { UiPreviewStyles } from "./ui-preview-styles";
import { Reveal } from "./reveal";
import { HeroParallax } from "./hero-parallax";

export const metadata: Metadata = {
  title: "UI 改版預覽｜元家",
  robots: { index: false, follow: false },
};

/**
 * `/ui-preview`：首頁 UI 改版提案，獨立路由、獨立樣式（見
 * ui-preview-styles.tsx／reveal.tsx／hero-parallax.tsx，全部 `up-` 前綴，
 * 不 import 也不影響任何正式頁面或 src/components/editorial/* 共用元件）。
 *
 * 沒有被任何導覽選單連結、`noindex`、不會出現在 sitemap，純供內部比較
 * 「改版前後」用。正式首頁 `src/app/(b2c)/page.tsx` 完全沒有被修改。
 *
 * 內容策略：品牌故事／企業優勢／食安品質／媒體報導的文案，逐字沿用正式
 * 首頁目前的真實內容（不重寫文案，只重新設計呈現方式）；新增一個正式首頁
 * 目前沒有的「商品精選」區塊，資料直接查詢真實 Supabase（跟 /products
 * 同一份 `getAllActiveProducts`），不是編造的假商品。
 *
 * 技術：沿用專案既有的 Next.js Server Component＋Tailwind＋
 * `var(--ep-font-*)` 字體變數，沒有引入 Framer Motion／GSAP（專案目前沒有
 * 這两個套件）——動畫全部是 CSS transition／keyframes＋IntersectionObserver
 * （`Reveal` 元件），跟正式站 `FadeInSection` 同一種技術路線，只是視覺參數
 * 不同。
 */
export default async function UiPreviewPage() {
  const supabase = await createClient();
  const products = await getAllActiveProducts(supabase);
  const featured = products.slice(0, 5);

  return (
    <div className="up-root">
      <UiPreviewStyles />

      {/* ============================== 提案標示列 ============================== */}
      <div className="sticky top-0 z-[70] bg-[#0B1620] px-5 py-2.5 text-center text-xs text-white/80">
        UI 改版預覽（`/ui-preview`）——未連結任何導覽選單、不影響正式網站，僅供內部比較。
      </div>

      {/* ============================== NAV ============================== */}
      <header className="sticky top-[34px] z-[60] border-b border-white/10 bg-[#071B2B]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="#top" className="flex items-center gap-2">
            <Image src="/yens-logo.png" alt="元家" width={104} height={36} style={{ width: "auto" }} className="h-7 brightness-0 invert" />
          </Link>
          <nav aria-label="主導覽" className="hidden items-center gap-8 font-[family-name:var(--ep-font-sans)] text-sm text-white/90 lg:flex">
            <Link href="#products" className="up-nav-link">商品精選</Link>
            <Link href="#quality" className="up-nav-link">食安與產地</Link>
            <Link href="#about" className="up-nav-link">關於元家</Link>
            <Link href="#media" className="up-nav-link">媒體報導</Link>
          </nav>
          <div className="flex items-center gap-4 text-xs text-white/80">
            <span className="hidden sm:inline">會員登入</span>
            <span className="border border-white/30 px-3 py-1.5">購物車</span>
          </div>
        </div>
      </header>

      {/* ============================== HERO ============================== */}
      <section id="top" className="relative min-h-[640px] overflow-hidden bg-[#071B2B] lg:min-h-[760px]">
        {/* 圖片非滿版置右，右側用 clip-path 切一道不對稱斜角，避免矩形滿版的模板感。
            這個斜角只在 lg（圖片只佔 64% 寬度、跟文字並存）才有意義——手機／平板
            版圖片本來就是滿版鋪底（w-full），斜角切在滿版圖片上只會變成左上角
            莫名缺一塊三角形，所以 clip-path 本身也要跟著 lg: 響應式套用，不是
            全尺寸都套同一個值（RWD 重新設計 Hero 構圖的一部分，不是偷懶疊加）。 */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%] lg:[clip-path:polygon(9%_0,100%_0,100%_100%,0%_100%)]">
          <HeroParallax src="/hero-seafood.jpg" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071B2B] via-[#071B2B]/10 to-transparent lg:bg-gradient-to-r lg:from-[#071B2B] lg:via-[#071B2B]/10 lg:to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[640px] w-full max-w-[1400px] items-end px-5 pb-24 pt-40 sm:px-8 lg:min-h-[760px] lg:items-center lg:px-10 lg:pb-32 lg:pt-32">
          <Reveal className="max-w-2xl lg:-mr-24">
            <span className="font-[family-name:var(--ep-font-en)] text-xs font-light tracking-[0.5em] text-[var(--up-salmon)]">
              YUANJIA · SINCE 1968
            </span>
            <h1 className="mt-6 font-[family-name:var(--ep-font-serif)] text-[clamp(3rem,7vw,6.5rem)] font-light leading-[0.98] tracking-[0.01em] text-white">
              海的
              <br />
              誠實
            </h1>
            <p className="mt-8 max-w-md font-[family-name:var(--ep-font-sans)] text-[15px] font-light leading-[1.9] text-white/75">
              產地直送、急速鎖鮮，全程低溫冷鏈——元家嚴選全球水產，讓每一口都是大海最新鮮的樣子。
            </p>
            <Link
              href="/products"
              className="up-cta mt-10 border border-[var(--up-coral)] bg-[var(--up-coral)] px-8 py-4 font-[family-name:var(--ep-font-en)] text-sm tracking-[0.15em] text-white"
            >
              探索嚴選商品
              <span className="up-cta-arrow" aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>

        {/* 浮動商品卡：壓在 Hero 圖片左下角，故意跟主視覺重疊，不是規矩排版。 */}
        {featured[0]?.coverImage ? (
          <Reveal delay={2} className="absolute bottom-10 left-5 z-20 hidden w-56 border border-white/15 bg-[#0B1620]/70 p-4 backdrop-blur sm:block lg:left-[38%]">
            <div className="up-media relative aspect-square">
              <Image src={featured[0].coverImage.url} alt={featured[0].coverImage.alt} fill sizes="220px" className="object-cover" />
            </div>
            <p className="mt-3 font-[family-name:var(--ep-font-serif)] text-sm text-white">{featured[0].name}</p>
            <p className="mt-1 font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[var(--up-salmon)]">
              NT$ {featured[0].price}
            </p>
          </Reveal>
        ) : null}

        <div className="up-wave absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 72" preserveAspectRatio="none">
            <path
              d="M0,30 C220,60 360,10 620,32 C860,54 1000,14 1220,34 C1330,44 1400,26 1440,32 L1440,72 L0,72 Z"
              fill="var(--up-glacier)"
            />
          </svg>
        </div>
      </section>

      {/* ============================== 商品精選（新增區塊） ============================== */}
      <section id="products" className="px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
        <div className="mx-auto max-w-[1400px]">
          <Reveal className="mb-16 flex flex-col gap-3 lg:mb-20 lg:max-w-xl">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.4em] text-[var(--up-coral)]">
              SELECTED · 今日嚴選
            </span>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-3xl font-light leading-[1.3] text-[var(--up-ink)] lg:text-5xl">
              新鮮直送的每一箱，
              <br />
              都經得起細看
            </h2>
          </Reveal>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-8 gap-y-20 sm:grid-cols-6">
              {featured.map((product, index) => {
                // 不對稱格線：第一筆佔 4 欄放大，其餘佔 2-3 欄，避免整批一樣大的制式卡片格。
                const spanClass =
                  index === 0
                    ? "sm:col-span-4"
                    : index === 1
                      ? "sm:col-span-2"
                      : index % 2 === 0
                        ? "sm:col-span-3"
                        : "sm:col-span-3";
                return (
                  <Reveal key={product.id} delay={((index % 5) + 1) as 1 | 2 | 3 | 4 | 5} className={spanClass}>
                    <Link href={`/products/${product.slug}`} className="group block">
                      <div className={`up-media relative ${index === 0 ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
                        {product.coverImage ? (
                          <Image
                            src={product.coverImage.url}
                            alt={product.coverImage.alt}
                            fill
                            sizes={index === 0 ? "60vw" : "30vw"}
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[var(--up-frost)] text-xs text-[var(--up-mist)]">
                            無商品圖片
                          </div>
                        )}
                        <span className="up-price-tag font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[var(--up-ink)]">
                          NT$ {product.price}
                        </span>
                      </div>
                      <div className="mt-8 flex items-baseline justify-between gap-4">
                        <h3 className="font-[family-name:var(--ep-font-serif)] text-lg text-[var(--up-ink)] transition-colors group-hover:text-[var(--up-coral)]">
                          {product.name}
                        </h3>
                        <span className="up-cta shrink-0 font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[var(--up-mist)]">
                          查看
                          <span className="up-cta-arrow" aria-hidden="true">→</span>
                        </span>
                      </div>
                      <p className="mt-2 max-w-sm text-sm font-light leading-[1.8] text-[var(--up-mist)]">
                        {product.shortDescription}
                      </p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--up-mist)]">目前沒有可顯示的商品（本頁直接查詢正式 Supabase 資料）。</p>
          )}
        </div>
      </section>

      {/* ============================== 品牌故事 ============================== */}
      <section id="about" className="relative overflow-hidden bg-[var(--up-frost)] px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-6 top-8 select-none font-[family-name:var(--ep-font-en)] text-[10rem] font-light leading-none text-[var(--up-ink)]/[0.05] lg:text-[16rem]"
        >
          01
        </span>
        <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1fr] lg:gap-24">
          <Reveal>
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.4em] text-[var(--up-coral)]">
              BRAND STORY
            </span>
            <h2 className="mt-4 font-[family-name:var(--ep-font-serif)] text-3xl font-light text-[var(--up-ink)] lg:text-4xl">
              品牌故事
            </h2>
          </Reveal>
          <Reveal delay={2} className="flex flex-col gap-6 lg:pt-14">
            <p className="text-[15px] font-light leading-[2] text-[var(--up-mist)]">
              元家企業的故事，最早可追溯到 1968 年於澎湖草創的「元進行」商行；1979
              年於台北正式成立元家企業股份有限公司，隔年在高雄設立冷凍草蝦外銷廠，以自創品牌行銷日本、美國，奠定日後發展的基礎。此後陸續拓展冷凍水產的進口、銷售與生產加工，並跨足調理食品領域，2012
              年起積極開拓海外市場，成為橫跨零售、餐飲、電商與國際貿易的水產食品供應商。
            </p>
            <p className="text-[15px] font-light leading-[2] text-[var(--up-mist)]">
              我們期望透過食的流通，將幸福傳遞給世界——提供穩定、值得信賴的商品與服務，同時關懷生態環境的平衡，引領安心的飲食文化。
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================== 企業優勢 ============================== */}
      <section className="px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
        <div className="mx-auto max-w-[1400px]">
          <Reveal className="mb-16">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.4em] text-[var(--up-coral)]">
              STRENGTHS
            </span>
            <h2 className="mt-4 font-[family-name:var(--ep-font-serif)] text-3xl font-light text-[var(--up-ink)] lg:text-4xl">
              企業優勢
            </h2>
          </Reveal>

          <div className="flex flex-col">
            {[
              { title: "國際採購", description: "掌握全球水產源頭，通過 MSC、ASC 等國際永續漁業認證，兼顧美味與海洋永續。" },
              { title: "研發生產", description: "自有食品研發中心與生產工廠，取得 FSSC 22000、HACCP 等多項國際品質認證。" },
              { title: "食品安全", description: "專職品保團隊層層把關，全台超過 20 位專職品保人員，每批進貨自主性品質檢測。" },
              { title: "倉儲物流", description: "大型冷凍倉庫全年溫控 -20°C 以下，搭配專業物流管理系統，確保新鮮送達。" },
            ].map((item, index) => (
              <Reveal key={item.title} delay={((index % 5) + 1) as 1 | 2 | 3 | 4 | 5}>
                <div
                  className="flex flex-col gap-3 border-t border-[var(--up-line)] py-10 sm:flex-row sm:items-baseline sm:gap-10 lg:py-12"
                  style={{ marginLeft: index % 2 === 1 ? "0" : "0", paddingLeft: index % 2 === 1 ? "0" : "clamp(0px, 6vw, 96px)" }}
                >
                  <span className="font-[family-name:var(--ep-font-en)] text-4xl font-thin text-[var(--up-coral)] sm:w-24 sm:shrink-0">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-[family-name:var(--ep-font-serif)] text-xl text-[var(--up-ink)] sm:w-48 sm:shrink-0">
                    {item.title}
                  </h3>
                  <p className="max-w-xl text-sm font-light leading-[1.9] text-[var(--up-mist)]">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== 食安與品質 ============================== */}
      <section id="quality" className="bg-[var(--up-frost)] px-5 py-24 text-center sm:px-8 lg:px-10 lg:py-36">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-16">
          <Reveal className="flex flex-col items-center gap-3">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.4em] text-[var(--up-coral)]">
              QUALITY
            </span>
            <h2 className="font-[family-name:var(--ep-font-serif)] text-3xl font-light text-[var(--up-ink)] lg:text-4xl">
              食品安全與品質，是我們的堅持
            </h2>
          </Reveal>

          <Reveal delay={2}>
            <ol className="mx-auto flex max-w-3xl flex-col items-center gap-8 sm:flex-row sm:justify-between">
              {["全球採購", "專業加工", "品質檢驗", "冷鏈倉儲", "安心到家"].map((step, index, arr) => (
                <li key={step} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--up-coral)]/40 font-[family-name:var(--ep-font-en)] text-lg text-[var(--up-coral)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm font-medium tracking-[0.05em] text-[var(--up-ink)]">{step}</p>
                  </div>
                  {index < arr.length - 1 ? (
                    <span aria-hidden="true" className="hidden h-px w-8 bg-[var(--up-line)] sm:block" />
                  ) : null}
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={3} className="mx-auto grid max-w-4xl grid-cols-1 gap-x-10 gap-y-4 text-left sm:grid-cols-2">
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
              <p key={fact} className="border-t border-[var(--up-line)] pt-4 text-sm font-light leading-[1.9] text-[var(--up-mist)]">
                {fact}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============================== 媒體報導 ============================== */}
      <section id="media" className="px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-14">
          <Reveal>
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.4em] text-[var(--up-coral)]">
              MEDIA
            </span>
            <h2 className="mt-4 font-[family-name:var(--ep-font-serif)] text-3xl font-light text-[var(--up-ink)] lg:text-4xl">
              媒體都在報導元家
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal delay={1} className="flex flex-col gap-4">
              <div className="up-media relative aspect-[4/3]">
                <Image src="/media-seafood-platter.jpg" alt="" aria-hidden="true" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="flex items-baseline gap-3">
                <time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[var(--up-mist)]">2026.06.16</time>
                <span className="text-xs tracking-widest text-[var(--up-mist)]">風傳媒</span>
              </div>
              <p className="font-[family-name:var(--ep-font-serif)] text-lg leading-[1.7] text-[var(--up-ink)]">
                無懼全球波動！元家企業深化垂直整合 2026食品展大秀上百款頂級海鮮與即食解方
              </p>
            </Reveal>

            <Reveal delay={2} className="flex flex-col gap-4 lg:mt-24">
              <div className="up-media relative aspect-[4/3]">
                <Image src="/media-cny-feast.jpg" alt="" aria-hidden="true" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="flex items-baseline gap-3">
                <time className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[var(--up-mist)]">2025.12.31</time>
                <span className="text-xs tracking-widest text-[var(--up-mist)]">經濟日報</span>
              </div>
              <p className="font-[family-name:var(--ep-font-serif)] text-lg leading-[1.7] text-[var(--up-ink)]">
                元家企業推「瑪瑙之宴」年菜組 冷鏈科技打造五星級團圓饗宴
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================== 收尾＋Footer（深色，呼應 Hero） ============================== */}
      <section className="relative overflow-hidden bg-[#071B2B] pt-24">
        <div className="up-wave absolute top-0 left-0 right-0 -translate-y-full">
          <svg viewBox="0 0 1440 72" preserveAspectRatio="none">
            <path
              d="M0,42 C200,14 340,58 600,36 C840,16 980,52 1220,34 C1330,26 1400,44 1440,40 L1440,0 L0,0 Z"
              fill="var(--up-glacier)"
            />
          </svg>
        </div>

        <Reveal className="mx-auto max-w-2xl px-5 pb-20 text-center sm:px-8">
          <p className="font-[family-name:var(--ep-font-serif)] text-2xl font-light leading-[1.8] text-white lg:text-3xl">
            我們期望透過食的流通，
            <br />
            將幸福傳遞給世界。
          </p>
        </Reveal>

        <div className="border-t border-white/10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Image src="/yens-logo.png" alt="元家" width={104} height={36} style={{ width: "auto" }} className="h-7 brightness-0 invert" />
              <p className="mt-4 text-sm font-light leading-[1.8] text-white/50">
                元家企業股份有限公司
                <br />
                YEN & Brothers Enterprise CO., LTD.
              </p>
            </div>
            <div>
              <h4 className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-white/40">EXPLORE</h4>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-white/60">
                <li>全部商品</li>
                <li>食安與產地</li>
                <li>關於元家</li>
              </ul>
            </div>
            <div>
              <h4 className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-white/40">SERVICE</h4>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-white/60">
                <li>常見問題</li>
                <li>客戶服務（即將推出）</li>
                <li>隱私權政策（即將推出）</li>
              </ul>
            </div>
            <div>
              <h4 className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-white/40">CONNECT</h4>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-white/60">
                <li>媒體報導</li>
                <li>企業合作</li>
                <li>YouTube · Facebook · Instagram · TikTok</li>
              </ul>
            </div>
          </div>
          <p className="mx-auto mt-14 max-w-[1400px] text-xs text-white/30">
            © 2026 YEN & BROTHERS ENTERPRISE CO., LTD. ALL RIGHTS RESERVED. — 本頁為 UI 改版預覽，非正式上線頁面。
          </p>
        </div>
      </section>
    </div>
  );
}

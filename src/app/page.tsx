import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { categories } from "@/lib/fixtures/categories";

export const metadata: Metadata = {
  title: "元家｜新鮮海鮮與調理食品",
  description: "元家精選冷凍海鮮與調理食品，從商品列表開始探索。",
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
 *   只補上 id="about"／id="quality" 給 Header 的錨點導覽連結用，重做食安流程／
 *   認證卡屬於 design.md §8 Phase 2（品牌信任），不在這次範圍。
 * - 卡片／圖片圓角依 design.md §5.4 統一改用 16px（rounded-2xl）。
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
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
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

      {/* 快速分類：design.md §6.3「今天想吃什麼？」，用真實分類資料連到篩選後的商品列表。 */}
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
                  href={`/products?category=${category.slug}`}
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

      {/* ABOUT／品牌故事：對應 PRD B2C-02 公開信任內容。文字為佔位草稿，非最終文案。 */}
      <section id="about" className="scroll-mt-20 border-b border-border-subtle bg-surface-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:px-10 lg:py-20">
          <div className="flex flex-1 flex-col gap-4">
            <p className="text-xs font-semibold tracking-widest text-brand-ocean-700">ABOUT</p>
            <h2 className="text-2xl font-semibold text-ink-900">關於元家</h2>
            <p className="text-sm leading-7 text-ink-600">
              元家企業長期投入冷凍水產與食材供應，累積豐富的品牌與產品經驗。這個網站將元家的品牌內容與產品資訊，和宅鮮配的線上購物體驗整合在一起，讓您能在同一個地方認識元家，也能安心選購。
            </p>
            <p className="text-sm leading-7 text-ink-600">
              我們相信好的食材需要用心對待——從產地挑選、低溫保存，到送到您手上的每一個環節，元家都希望能讓您安心。
            </p>
          </div>
          <ImagePlaceholder label="品牌故事圖片預留位置" className="aspect-[4/3] flex-1" />
        </div>
      </section>

      {/* QUALITY／信任訴求：三項對應 PRD 商品欄位的食品安全、產地、品質／認證。 */}
      <section id="quality" className="scroll-mt-20 bg-brand-fresh-050">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-xs font-semibold tracking-widest text-brand-fresh-700">QUALITY</p>
            <h2 className="text-2xl font-semibold text-ink-900">
              食品安全與品質，是我們的堅持
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <TrustPillar
              index="01"
              title="食品安全把關"
              description="每項商品皆標示食品安全與檢驗相關資訊，讓您安心選購。"
            />
            <TrustPillar
              index="02"
              title="產地溯源"
              description="清楚標示每項商品的產地來源，吃得清楚、買得安心。"
            />
            <TrustPillar
              index="03"
              title="品質認證"
              description="重視品質與認證資訊，持續把關每一項商品的標準。"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function TrustPillar({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <ImagePlaceholder label={`${title} 圖示預留位置`} className="h-32 w-32 rounded-full" />
      <p className="text-xs font-medium text-brand-fresh-700">{index}</p>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="text-sm leading-6 text-ink-600">{description}</p>
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

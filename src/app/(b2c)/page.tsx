import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "元家｜新鮮海鮮與調理食品",
  description: "元家精選冷凍海鮮與調理食品，從商品列表開始探索。",
};

/**
 * B2C / 首頁骨架。
 *
 * 版面參考 https://takamaru-fukuoka.com/ 的資訊架構（Hero banner → 品牌故事 ABOUT →
 * 三項信任訴求 QUALITY），但只取「首頁需要哪些區塊」這個結構層面的參考，內容改成
 * 元家實際會有的東西；該站的 MENU／STORE／FAQ／CONTACT 區塊不在這次範圍內，沒有照搬。
 *
 * 依 PRD B2C-01（首屏品牌識別＋CTA＋商品探索入口）與 B2C-02（品牌故事、食品安全、
 * 品質、產地等公開信任內容）。目前沒有任何真實圖片或最終文案，全部是可替換的
 * 佔位文字／佔位圖片區塊，也不做輪播、視差或動畫（PRD B2C-01 明確排除）。
 *
 * 會員登入、企業合作、購物車這三個 PRD 要求的入口改放在全站 Header（見
 * src/components/Header.tsx），不在首頁重複顯示一次。
 *
 * 視覺樣式維持中性灰階，跟 /products 一致；等團隊確定設計方向（design.md 是候選提案，
 * 尚未拍板）後統一套用，這裡先不上色。
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero banner：預留最大張的品牌／商品攝影用空間，目前先用佔位區塊，不放真實圖片。 */}
      <ImagePlaceholder
        label="Banner 圖片預留位置（首頁最大張的品牌／商品照片）"
        className="h-64 w-full sm:h-80 lg:h-[28rem]"
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-14 text-center">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wide text-zinc-500">元家企業</p>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            精選冷凍海鮮與調理食品
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            從商品列表開始，依分類與標籤找到想要的商品。
          </p>
        </div>

        <Link
          href="/products"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          開始挑選
        </Link>
      </div>

      {/* ABOUT／品牌故事：對應 PRD B2C-02 公開信任內容。文字為佔位草稿，非最終文案。 */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-col gap-4">
            <p className="text-xs font-semibold tracking-widest text-zinc-400">ABOUT</p>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">關於元家</h2>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              元家企業長期投入冷凍水產與食材供應，累積豐富的品牌與產品經驗。這個網站將元家的品牌內容與產品資訊，和宅鮮配的線上購物體驗整合在一起，讓您能在同一個地方認識元家，也能安心選購。
            </p>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              我們相信好的食材需要用心對待——從產地挑選、低溫保存，到送到您手上的每一個環節，元家都希望能讓您安心。
            </p>
          </div>
          <ImagePlaceholder label="品牌故事圖片預留位置" className="h-56 flex-1 lg:h-72" />
        </div>
      </section>

      {/* QUALITY／信任訴求：三項對應 PRD 商品欄位的食品安全、產地、品質／認證。 */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-14">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-xs font-semibold tracking-widest text-zinc-400">QUALITY</p>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
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
      <p className="text-xs font-medium text-zinc-400">{index}</p>
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}

/** 通用圖片佔位區塊：裝飾用，不承載資訊，aria-hidden 且不設 alt 文字（見 §7.3 alt 規則）。 */
function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-md bg-zinc-100 px-4 text-center text-xs text-zinc-400 dark:bg-zinc-900 ${className ?? ""}`}
    >
      {label}
    </div>
  );
}

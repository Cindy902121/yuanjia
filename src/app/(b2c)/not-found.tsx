import Link from "next/link";
import type { Metadata } from "next";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { editorialButtonSolid } from "@/lib/editorial/styles";

export const metadata: Metadata = {
  title: "找不到這個頁面 | 元家",
  description: "這個頁面不存在或已被移除，來看看元家目前販售的商品吧。",
};

/**
 * `(b2c)` route group 的 not-found 邊界（2026-09-01，9/1 B2C QA 排程「補齊
 * loading、empty、error 與商品不存在狀態」發現的落差）。
 *
 * 在這支檔案出現之前，這個 route group 底下所有 `notFound()` 呼叫
 * （/products/[slug]、/media/[slug]、/news/[slug] 商品／文章不存在時，見各自
 * page.tsx）都會落到 Next.js 內建的預設 404——正式環境下是完全沒有樣式的英文
 * 「404 This page could not be found.」，跟站內其他地方的編輯風視覺完全脫節，
 * 也沒有任何指引使用者回到商品頁的連結。
 *
 * 這裡補一個屬於這個 route group 的 `not-found.tsx`，Next.js 會讓這個 route
 * group 底下所有的 `notFound()` 呼叫改用這個畫面；因為檔案放在 `(b2c)` 底下、
 * 不是 root layout 底下，`(b2c)/layout.tsx` 的 Header／Footer／B2CHelpWidget
 * 仍然照常包住這個畫面（只有 `<main>` 換掉），使用者不會覺得「跳到另一個網站」。
 *
 * 沒有另外處理「完全打錯路徑、連 (b2c) 都進不去」的情境（例如 /asdkfj）——那種
 * 情況會落到 root layout 沒有對應 route group 的預設 404，維持原生行為即可，
 * 這不是這次任務要修的落差（那種網址不是「商品／文章不存在」，是使用者打錯
 * 網址，本來就不歸屬任何 route group 的視覺）。
 */
export default function B2CNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#FAF9F6] px-5 py-24 font-[family-name:var(--ep-font-sans)] text-[#2B2B2B] sm:px-8">
      <EditorialStyles />
      <div className="flex flex-col items-center gap-4 border border-dashed border-[#2b2b2b]/20 px-12 py-20 text-center">
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">
          404
        </span>
        <h1 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#2b2b2b]">
          找不到這個頁面
        </h1>
        <p className="max-w-md text-sm font-light leading-[1.8] text-[#4a4a4a]">
          這個網址可能已經失效、商品已下架，或連結有誤。歡迎回到商品列表，看看目前有哪些新鮮嚴選。
        </p>
        <Link href="/products" className={`mt-2 ${editorialButtonSolid}`}>
          瀏覽商品
        </Link>
      </div>
    </main>
  );
}

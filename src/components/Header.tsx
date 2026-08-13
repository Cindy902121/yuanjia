import Link from "next/link";

/**
 * 全站導覽列，掛在 root layout，所有頁面都會顯示（見 8/11–8/12 任務「首頁基本區塊與導覽」）。
 *
 * 依 PRD B2C-01：入口包含探索商品、會員登入、企業合作與購物車。目前只有「商品」是
 * 真正存在的頁面，其餘三個先用不可點擊的文字呈現「即將推出」——理由跟首頁一樣，
 * 避免連到還沒有的路由（/login、/business/lead、/cart）。原本放在首頁 Hero 區塊的
 * 同一組佔位入口已移除，改由這裡統一顯示，避免同一頁重複出現兩次。
 *
 * 純靜態、無互動狀態（沒有手機版漢堡選單），維持 Server Component；響應式細節排在
 * 8/16 任務再處理，現在先用 flex-wrap 讓小螢幕自動換行，不至於無法使用。
 */
export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <Link
          href="/"
          className="text-base font-semibold text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-zinc-50"
        >
          元家
        </Link>

        <nav aria-label="主導覽" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link
            href="/products"
            className="text-zinc-600 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            商品
          </Link>
          <span className="text-zinc-400">會員登入（即將推出）</span>
          <span className="text-zinc-400">企業合作（即將推出）</span>
          <span className="text-zinc-400">購物車（即將推出）</span>
        </nav>
      </div>
    </header>
  );
}

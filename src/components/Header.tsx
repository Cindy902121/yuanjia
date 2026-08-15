import Link from "next/link";

/**
 * B2C 導覽列，由 src/app/(b2c)/layout.tsx 掛載在 B2C 頁面。
 *
 * 依 PRD B2C-01：入口包含探索商品、會員登入、企業合作與購物車。「商品」「會員登入」
 * 是真正存在的頁面（/login 是 B 8/11–8/12 統一登入的成果，2026-08-13 merge 進來）；
 * 企業合作、購物車頁面還沒做，先用不可點擊的文字呈現「即將推出」，避免連到還不存在
 * 的路由（/business/lead、/cart）。原本放在首頁 Hero 區塊的同一組佔位入口已移除，
 * 改由這裡統一顯示，避免同一頁重複出現兩次。
 *
 * 純靜態、無互動狀態（沒有手機版漢堡選單），維持 Server Component。
 * B2B／Admin 會各自使用所屬版面，不在這個元件內判斷路徑。
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
          <Link
            href="/login"
            className="text-zinc-600 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            會員登入
          </Link>
          <span className="text-zinc-400">企業合作（即將推出）</span>
          <span className="text-zinc-400">購物車（即將推出）</span>
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";

/**
 * 全站導覽列，掛在 root layout，所有頁面都會顯示（見 8/11–8/12 任務「首頁基本區塊與導覽」）。
 *
 * 依 PRD B2C-01：入口包含探索商品、會員登入、企業合作與購物車。「商品」「會員登入」
 * 是真正存在的頁面（/login 是 B 8/11–8/12 統一登入的成果，2026-08-13 merge 進來）；
 * 企業合作、購物車頁面還沒做，先用不可點擊的文字呈現「即將推出」，避免連到還不存在
 * 的路由（/business/lead、/cart）。原本放在首頁 Hero 區塊的同一組佔位入口已移除，
 * 改由這裡統一顯示，避免同一頁重複出現兩次。
 *
 * 登入狀態（2026-08-13 補上，已跟 B 確認可以做；同日依 B 的意見再簡化一次）：
 * - 現在是 async Server Component，用 B 的 createClient()（src/lib/supabase/server.ts）
 *   讀 session。B 的要求：登入後**不要顯示「已登入」文字或 email**，只需要確保「會員
 *   登入」這個按鈕／連結不再出現就好，所以登入後這裡只留一個「登出」按鈕，沒有其他
 *   狀態文字。
 * - 刻意簡化，不判斷角色（B2C／B2B／Admin）：不管哪種身分登入，這裡都只顯示同一顆
 *   「登出」按鈕，不做角色專屬的文字或導轉。PRD AUTH-03 要求的角色分流（例如 B2B
 *   session 開啟 / 要導向 /business、B2C 不能進 B2B 路由）沒有在這裡處理，那是 B 的
 *   Auth／權限範圍，這裡只負責「有沒有登入」這一件事，避免搶做或跟他之後的設計衝突。
 * - 註冊功能不需要：PRD 3.2 明確排除「正式會員註冊」，AUTH-02 也明確排除 B2B 自助註冊，
 *   兩邊都是固定展示帳號／管理者建立帳號，不是使用者自己註冊。
 *
 * 提醒：/login 目前是 teal／slate 配色，跟這裡以及其他 B2C 頁面維持的中性灰階不同——
 * 這是預期中的暫時不一致（兩邊分屬不同工作分工，尚未統一視覺設計），不是這次要處理
 * 的範圍，先留意，之後統一套用設計時一起處理。
 *
 * 響應式細節（手機版漢堡選單等）排在 8/16 任務再處理，現在先用 flex-wrap 讓小螢幕
 * 自動換行，不至於無法使用。
 */
export async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

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

          {isLoggedIn ? (
            <form action={logout}>
              <button
                type="submit"
                className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                登出
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="text-zinc-600 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              會員登入
            </Link>
          )}

          <span className="text-zinc-400">企業合作（即將推出）</span>
          <span className="text-zinc-400">購物車（即將推出）</span>
        </nav>
      </div>
    </header>
  );
}

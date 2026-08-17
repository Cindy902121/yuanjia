import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { CartDrawer } from "@/components/CartDrawer";

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
 * 2026-08-14：套用 design.md §5.2／§5.3 品牌色彩與字體，跟 B 的 /login 對齊。
 * 2026-08-14（同日）：依 design.md §6.1／§8 Phase 1 再調整版面——72px 黏附式
 * （sticky）Header、導覽項目改用錨點連結首頁的 ABOUT／QUALITY 區塊（見
 * src/app/page.tsx 的 #about、#quality），「企業合作」改成 design.md §7.1 的
 * Secondary 樣式（白底藍框）、「會員登入／登出」改成小按鈕而不是純文字連結，
 * 視覺上更接近 §6.1 的規格。
 *
 * 範圍說明：
 * - design.md §6.1 的完整規格還包含 mega menu（商品分類）、搜尋框、購物車圖示；
 *   這裡沒有做——mega menu 需要分類頁面（目前只有 /products 一頁＋前端篩選，
 *   沒有 /products/categories/[slug]），搜尋已經在 /products 頁面內可用，
 *   Header 再放一個不會動作的搜尋框會變成假的互動元素，所以不加。這兩項留待
 *   之後真的有對應功能／頁面時再補。
 * - 手機版漢堡選單排在 8/16 任務再處理，現在仍用 flex-wrap 讓小螢幕自動換行，
 *   不是 design.md §6.1 講的「保留 Logo、搜尋、購物車、選單」那種收合選單。
 *
 * 2026-08-14（同日）：Logo 換成元家官方圖檔（public/yens-logo.png，2026-08-14
 * 抓自 yens.com.tw 官網 header 用的同一個檔案，389×135px；經使用者確認同意才下載
 * ／套用）。原本純文字「元家」在白底 Header 上略顯單薄，換成官方 logo 圖片更接近
 * 真實品牌識別。
 *
 * 2026-08-17：「購物車（即將推出）」換成真的入口，同一天改了兩次：
 * 1. 先從直接連到 /cart 的 CartLink，改成點擊後彈出小型下拉預覽視窗的 CartMenu。
 * 2. 使用者看了參考截圖後，改成右側滿版高度、附遮罩的抽屜——
 *    src/components/CartDrawer.tsx（目前這個）。三版都是獨立 Client Component，
 *    理由不變：Header 是 async Server Component，沒辦法直接用
 *    localStorage／useSyncExternalStore。
 */
export async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-white">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8 lg:h-[72px] lg:px-10 lg:py-0">
        <Link
          href="/"
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
        >
          <Image
            src="/yens-logo.png"
            alt="元家"
            width={116}
            height={40}
            priority
            style={{ width: "auto" }}
            className="h-9 sm:h-10"
          />
        </Link>

        <nav aria-label="主導覽" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
          <Link
            href="/products"
            className="text-ink-600 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
          >
            商品分類
          </Link>
          <a
            href="/#quality"
            className="text-ink-600 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
          >
            食安與產地
          </a>
          <a
            href="/#about"
            className="text-ink-600 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
          >
            關於元家
          </a>
        </nav>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-lg border border-brand-ocean-700 px-3 py-1.5 text-xs font-semibold text-brand-ocean-700">
            企業合作（即將推出）
          </span>

          {isLoggedIn ? (
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-ink-900 hover:border-brand-ocean-700 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
              >
                登出
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-ink-900 hover:border-brand-ocean-700 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
            >
              會員登入
            </Link>
          )}

          <CartDrawer />
        </div>
      </div>
    </header>
  );
}

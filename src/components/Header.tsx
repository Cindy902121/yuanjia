import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { CartDrawer } from "@/components/CartDrawer";

/**
 * 全站導覽列，掛在 root layout，所有頁面都會顯示（見 8/11–8/12 任務「首頁基本區塊與導覽」）。
 *
 * 依 PRD B2C-01：入口包含探索商品、會員登入、企業合作與購物車。
 *
 * 登入狀態：async Server Component，用 B 的 createClient()（見
 * src/lib/supabase/server.ts）讀 session；登入後只顯示「登出」，沒有其他狀態
 * 文字（B 的要求）。不判斷角色（B2C／B2B／Admin），角色分流是 B 的 Auth／權限
 * 範圍。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風（原本只在 /design-preview/*
 * 的提案），正式取代 design.md 舊有的「海洋藍＋鮮活綠」系統，這次連 Header／
 * Footer 也一起換（使用者明確選擇「也一起改成編輯風」，不是只換內容頁）：
 * - 底色從 `bg-surface-white` 改成跟全站一致的暖白 `#FAF9F6`，分隔線從實色
 *   `border-border-subtle` 改成極淡的 `border-[#2b2b2b]/10`，呼應整體「細線
 *   條、低對比」的編輯風語言。
 * - 導覽文字改用內文字體＋拉寬字距（`tracking-[0.15em]`），不是原本 design.md
 *   §5.3 的黑體導覽字級，跟其他頁面「文字稀疏、呼吸感重」的排版邏輯一致。
 * - 「企業合作（即將推出）」原本是藍框徽章，改成單純的淡色文字——徽章本身是
 *   舊系統「用色塊強調」的視覺語言，編輯風幾乎不用實色塊做強調。
 * - 「會員登入／登出」改成 src/lib/editorial/styles.ts 的直角方框按鈕
 *   （editorialButtonLight），跟商品頁的「加入購物車」用同一套按鈕語言。
 * - 購物車入口（CartDrawer 的觸發按鈕）也順手改成同樣的導覽文字樣式，見
 *   src/components/CartDrawer.tsx 的對應調整；購物車抽屜本身（品項清單、
 *   結帳按鈕）**還沒改版**，這次範圍只到觸發按鈕，抽屜內部維持舊樣式，是已知
 *   待辦，不是遺漏。
 * - 「關於元家」懸浮選單維持同一套 CSS group-hover／group-focus-within 做法
 *   （不用另外拆 Client Component，理由不變：Header 是 async Server
 *   Component），只換視覺——直角、細框、內文字體。
 *
 * `/products/tags/[slug]`、`/products/categories/[slug]`、`/cart`、
 * `/checkout`、`/login` 這幾個頁面本身還沒重新設計，繼續依賴 design.md 的舊
 * token（`ink-900`／`brand-ocean-700` 等，這些 token 本身沒有被刪除，見
 * src/app/globals.css），但因為 Header／Footer 現在全站共用同一份，訪客從
 * 這些舊頁面看到的 Header／Footer 也會是新樣式——這是刻意的（Header／Footer
 * 本來就是「全站唯一一份」，不會有新舊兩種版本並存），頁面本身的改版是後續
 * 待辦。
 *
 * 2026-08-19（同日，回報 bug 後修正）：Header 一度加了 `backdrop-blur`
 * （毛玻璃效果），結果讓 CartDrawer 的購物車抽屜點開後整個跑位、變成一個
 * 縮在角落的小方塊，不是原本滿版右側抽屜。原因是 CSS 規則：`backdrop-filter`
 * （`backdrop-blur` 對應的屬性）會讓套用的元素變成底下 `position: fixed`
 * 子元素的「新定位基準」（containing block）——CartDrawer 是 `<Header>` 的
 * 子元件（見下方 `<CartDrawer />`），它的滿版遮罩＋抽屜面板都是
 * `position: fixed`，套用範圍因此從「整個瀏覽器視窗」被 Header 自己的方框
 * 大小取代，才會整個跑位。`filter`、`transform`、`perspective`、
 * `will-change: transform` 這幾個 CSS 屬性都有同樣效果，**以後 Header／任何
 * 包著 CartDrawer 的祖先元素都不能加這幾個屬性**，這裡已經拿掉
 * `backdrop-blur`，改用純色半透明背景（`bg-[#FAF9F6]`，這裡目前是不透明），
 * 視覺差異很小，換掉風險最低。
 *
 * 2026-08-19（同日，補上 /user 入口）：新增 src/app/user/page.tsx（會員中心，
 * PRD 伸展項目）之後，發現全站沒有任何地方連得過去——原本登入後只有「登出」
 * 按鈕，沒有連結。這裡在登入狀態的「登出」旁邊加一個「會員中心」文字連結
 * （同樣用 navLinkClass，跟其他導覽字級一致），未登入狀態不受影響。
 *
 * 2026-08-19（同日，/business/lead 上線）：原本「企業合作（即將推出）」是純
 * 文字、不可點擊——現在頁面做好了（見 src/app/business/lead/page.tsx，PRD
 * 5.4／6.7 正式規格頁面，不是伸展項目），改成真的 `<Link>`，拿掉「即將推出」
 * 字樣。
 *
 * 2026-08-25：「關於元家」下拉選單加上「最新消息」（`/news`，SEO／AEO／GEO
 * 內容策略新增的原創編輯內容區塊，見 src/lib/content/news-items.ts 檔頭
 * 說明），跟原本就在的「媒體報導」並列——媒體報導是別人報導我們的清單，
 * 最新消息是我們自己寫的深度內容，兩者性質不同但都放在同一個下拉選單裡，
 * 對使用者來說都是「想多了解元家」的入口，不需要分開兩個地方。
 */
export async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const navLinkClass =
    "text-[#4a4a4a] tracking-[0.1em] transition-colors hover:text-[#3E5C6B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E5C6B]";

  return (
    <header className="sticky top-0 z-40 border-b border-[#2b2b2b]/10 bg-[#FAF9F6]">
      <div className="mx-auto flex w-full max-w-[1300px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8 lg:h-[76px] lg:px-10 lg:py-0">
        <Link
          href="/"
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E5C6B]"
        >
          <Image
            src="/yens-logo.png"
            alt="元家"
            width={116}
            height={40}
            priority
            style={{ width: "auto" }}
            className="h-8 sm:h-9"
          />
        </Link>

        <nav aria-label="主導覽" className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm">
          <Link href="/products" className={navLinkClass}>
            商品分類
          </Link>
          <Link href="/#quality" className={navLinkClass}>
            食安與產地
          </Link>
          <div className="group relative">
            <Link href="/#about" className={navLinkClass}>
              關於元家
            </Link>
            <div className="invisible absolute left-1/2 top-full z-10 w-40 -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="flex flex-col gap-1 border border-[#2b2b2b]/15 bg-[#FAF9F6] p-2 shadow-[0_8px_24px_rgba(43,43,43,0.1)]">
                <Link href="/#brand-story" className="px-3 py-2 text-sm text-[#4a4a4a] hover:text-[#3E5C6B]">
                  品牌故事
                </Link>
                <Link href="/#advantages" className="px-3 py-2 text-sm text-[#4a4a4a] hover:text-[#3E5C6B]">
                  企業優勢
                </Link>
                <Link href="/media" className="px-3 py-2 text-sm text-[#4a4a4a] hover:text-[#3E5C6B]">
                  媒體報導
                </Link>
                <Link href="/news" className="px-3 py-2 text-sm text-[#4a4a4a] hover:text-[#3E5C6B]">
                  最新消息
                </Link>
              </div>
            </div>
          </div>
          <Link href="/faq" className={navLinkClass}>
            常見問題
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-5 text-sm">
          <Link href="/business/lead" className={`${navLinkClass} text-xs`}>
            企業合作
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/user" className={navLinkClass}>
                會員中心
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="border border-[#2b2b2b]/30 px-4 py-1.5 text-xs tracking-[0.1em] text-[#2b2b2b] transition-colors hover:border-[#2b2b2b] hover:bg-[#2b2b2b] hover:text-white"
                >
                  登出
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="border border-[#2b2b2b]/30 px-4 py-1.5 text-xs tracking-[0.1em] text-[#2b2b2b] transition-colors hover:border-[#2b2b2b] hover:bg-[#2b2b2b] hover:text-white"
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

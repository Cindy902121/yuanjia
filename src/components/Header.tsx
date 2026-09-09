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
 * 2026-08-25：「關於元家」下拉選單加上「最新消息」（`/news`），跟原本就在
 * 的「媒體報導」並列。同日重新分工過一次：媒體報導是別人報導我們的清單
 * （含深度詳情頁 `/media/[slug]`），最新消息專門留給元家自己發布的第一手
 * 消息（新品、優惠、公告），見 src/lib/content/news-items.ts 檔頭說明。
 *
 * 2026-09-03（9/3 B2C QA 排程「清理前台可見的...console 問題」發現）：logo
 * 拿掉 `priority`——這顆圖只有 116×40（CSS 顯示更小，`h-8 sm:h-9`），從來
 * 不會是任何頁面的 LCP（Largest Contentful Paint）候選元素，`priority` 卻讓
 * 它在每一頁都多送一個 `<link rel="preload">`，瀏覽器 console 因此一直出現
 * 「resource preloaded but not used」的警告（無害，但每頁都有，清理範圍內）。
 * `priority` 應該留給真的是 LCP 候選的圖片，例如首頁／About／企業合作頁的
 * `hero-seafood.jpg`（`fill sizes="100vw"` 滿版大圖，見各自 page.tsx）——那些
 * 已經是正確用法，不需要跟著拿掉。
 *
 * 2026-09（配色遷移，使用者要求「Formal Version UI + Preview Color
 * Palette」——只換色，不換排版／結構／互動）：底色從暖白 `#FAF9F6` 換成
 * `/ui-preview` 的深海色 `#071B2B`，文字／邊框／hover 色跟著從「深色文字
 * 配淺色底」整組反轉成「淺色文字配深色底」（`text-[#4a4a4a]` 等→
 * `text-white/70`，`hover:text-[#3E5C6B]`→`hover:text-[#FF5A36]`），
 * 位置／間距／字級／導覽項目順序完全沒有動。下拉選單的陰影
 * `shadow-[...]` 顏色也跟著加深（原本 `rgba(43,43,43,0.1)` 太淺、在新的
 * 深色選單面板上幾乎看不出來），純粹是因為背景色改變而必須連動調整的
 * 陰影顏色，不是新增陰影效果。
 *
 * 2026-09（同批修改，使用者回報「logo 顏色跑掉、只剩一片白」後修正）：
 * logo 一開始用 `brightness-0 invert` 處理（想法是讓深色 logo 在深色底上
 * 反轉成白色），但 `brightness(0)` 對「不透明的每一個像素」一視同仁全部
 * 變黑（不分原本是白底還是藍綠色的圖案本身），`invert(1)` 再全部翻成
 * 白色，結果整張圖變成一塊沒有線條細節的純白矩形，不是「白色的 logo
 * 圖案」。第一次修正時拿掉濾鏡、但額外加了一層淺色（`#EAF4F8`）背景色塊
 * 墊底。
 *
 * 2026-09（同日，使用者回報 Header logo 有明顯淡藍色矩形色塊、要求比照
 * Footer 做法後再次修正）：Footer.tsx 的 logo（同一張 `/yens-logo.png`）
 * 完全沒有加任何底色或濾鏡，直接放在同樣的 `#071B2B` 深色底上，實際渲染
 * 完全正常、對比足夠——證明圖檔本身沒有問題，上一輪加的淺色墊底其實是
 * 不必要的裝飾（濾鏡拿掉後 logo 本來就能正常顯示原始顏色）。這裡拿掉
 * `bg-[#EAF4F8] px-2 py-1.5`，改成跟 Footer 一樣單純的透明背景，只有
 * logo 圖案＋外框 focus 樣式，讓 logo 直接露出 Header 原本的深色底。
 *
 * 2026-09-03（9/3 B2C QA 排程「檢查手機版」發現）：手機寬度（375px 測試）下，
 * 原本的 `<nav>` 跟右側帳號區塊沒有任何收合機制，所有連結（商品分類／食安
 * 與產地／關於元家／常見問題／企業合作／會員中心或登入／登出／購物車）直接
 * 用 `flex-wrap` 擠成三整行文字，開場畫面近 40% 高度都被導覽列占滿才看到
 * 主視覺。這裡補上 `lg:hidden` 以下（跟檔案裡其他處的 `lg:` 斷點一致）收成
 * 漢堡選單：
 * - 純 CSS checkbox hack（隱藏的 `<input type="checkbox" className="peer">`
 *   ＋ `<label>` 當觸發按鈕 ＋ 選單面板用 `peer-checked:flex` 顯示），刻意不
 *   拆 Client Component、不用 `useState`——理由跟檔案上面「關於元家」下拉選單
 *   一樣：Header 是 async Server Component，純 CSS 解法才能維持這點。
 * - 手機選單面板是 `absolute left-0 top-full w-full`，不是 `fixed`、也沒有用
 *   `transform`／`filter`／`backdrop-filter`／`will-change: transform`——這幾個
 *   屬性會讓套用的元素變成底下 `position: fixed` 子元素的新定位基準，
 *   `<CartDrawer />` 的滿版遮罩就是靠 `fixed` 定位，這條限制在檔案上面
 *   `backdrop-blur` 那次事故已經記錄過，這裡選單面板雖然不是 CartDrawer 的
 *   祖先節點（兩者是 header 底下的手足），但還是照同一個原則挑最安全的
 *   屬性組合，不留隱患。
 * - 「關於元家」在桌面版是 hover 下拉（媒體報導／最新消息），手機選單裡改成
 *   直接展開的縮排子連結——觸控裝置沒有 hover，展開式下拉在手機上本來就不
 *   好用，攤平成清單反而更好點。
 * - 購物車入口（`<CartDrawer />`）維持在頂列，手機版也一樣一眼就看得到、
 *   點得到，不收進選單面板裡——這是大部分電商站的慣例，購物車跟漢堡選單
 *   分開才不會多一層點擊。
 * - 選單面板本身沒有 JS 控制的「點連結後自動收合」——不需要：面板裡的連結
 *   都是換頁，Header 是 Server Component，換頁後重新渲染，checkbox 本來就會
 *   回到未勾選狀態；唯一沒有換頁動作的登出按鈕用的是既有 `logout()` Server
 *   Action，一樣會導頁，同樣道理不需要額外處理。
 * - 斷點選 `lg`（1024px）而不是 `sm`／`md`：導覽項目數量（4 個主連結＋4 個
 *   帳號區塊項目）在平板寬度一樣塞不進一行，跟這個檔案其他地方（例如
 *   `lg:h-[76px]`）已經用 `lg` 當「完整桌面版佈局」的分界一致。
 */
export async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const navLinkClass =
    "text-white/70 tracking-[0.1em] transition-colors hover:text-[#FF5A36] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]";
  const mobileNavLinkClass =
    "block px-1 py-2.5 text-sm text-white/70 tracking-[0.1em] transition-colors hover:text-[#FF5A36]";
  const mobileAccountButtonClass =
    "mt-1 inline-flex w-fit border border-white/30 px-4 py-1.5 text-xs tracking-[0.1em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#071B2B]";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071B2B]">
      {/* `sr-only`，不是 `hidden`——`hidden`＝`display:none` 會讓這顆 checkbox
          整個從 tab 順序跟無障礙樹裡消失，鍵盤使用者連 Tab 都碰不到、更打不
          開手機選單（測的時候用瀏覽器自動化工具點它才發現這個問題：工具跟
          鍵盤使用者遇到的是同一種「摸不到」）。`sr-only` 只是視覺上收起來，
          仍然保留在 tab 順序＋可以用空白鍵切換，下面的 `<label>` 補上
          `peer-focus-visible:` 讓鍵盤 focus 到它時，看得到的是 label 本身
          的外框提示。 */}
      <input type="checkbox" id="mobile-nav-toggle" className="peer sr-only" />

      <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between gap-x-6 px-5 py-4 sm:px-8 lg:h-[76px] lg:px-10 lg:py-0">
        <Link
          href="/"
          className="inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
        >
          <Image
            src="/yens-logo.png"
            alt="元家"
            width={116}
            height={40}
            style={{ width: "auto" }}
            className="h-8 sm:h-9"
          />
        </Link>

        <nav aria-label="主導覽" className="hidden items-center gap-x-7 text-sm lg:flex">
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
              <div className="flex flex-col gap-1 border border-white/15 bg-[#071B2B] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <Link href="/#brand-story" className="px-3 py-2 text-sm text-white/70 hover:text-[#FF5A36]">
                  品牌故事
                </Link>
                <Link href="/#advantages" className="px-3 py-2 text-sm text-white/70 hover:text-[#FF5A36]">
                  企業優勢
                </Link>
                <Link href="/media" className="px-3 py-2 text-sm text-white/70 hover:text-[#FF5A36]">
                  媒體報導
                </Link>
                <Link href="/news" className="px-3 py-2 text-sm text-white/70 hover:text-[#FF5A36]">
                  最新消息
                </Link>
              </div>
            </div>
          </div>
          <Link href="/faq" className={navLinkClass}>
            常見問題
          </Link>
        </nav>

        <div className="flex items-center gap-5 text-sm">
          <div className="hidden items-center gap-5 lg:flex">
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
                    className="border border-white/30 px-4 py-1.5 text-xs tracking-[0.1em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#071B2B]"
                  >
                    登出
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="border border-white/30 px-4 py-1.5 text-xs tracking-[0.1em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#071B2B]"
              >
                會員登入
              </Link>
            )}
          </div>

          <CartDrawer />

          <label
            htmlFor="mobile-nav-toggle"
            className="cursor-pointer text-lg leading-none text-white/70 transition-colors hover:text-[#FF5A36] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#FF5A36] lg:hidden"
          >
            ☰<span className="sr-only">選單</span>
          </label>
        </div>
      </div>

      <div className="hidden flex-col border-t border-white/10 bg-[#071B2B] px-5 py-4 sm:px-8 peer-checked:flex lg:hidden">
        <Link href="/products" className={mobileNavLinkClass}>
          商品分類
        </Link>
        <Link href="/#quality" className={mobileNavLinkClass}>
          食安與產地
        </Link>
        <Link href="/#about" className={mobileNavLinkClass}>
          關於元家
        </Link>
        <Link href="/media" className={`${mobileNavLinkClass} pl-5 text-xs text-white/55`}>
          媒體報導
        </Link>
        <Link href="/news" className={`${mobileNavLinkClass} pl-5 text-xs text-white/55`}>
          最新消息
        </Link>
        <Link href="/faq" className={mobileNavLinkClass}>
          常見問題
        </Link>

        <div className="my-2 h-px bg-white/10" aria-hidden="true" />

        <Link href="/business/lead" className={mobileNavLinkClass}>
          企業合作
        </Link>

        {isLoggedIn ? (
          <>
            <Link href="/user" className={mobileNavLinkClass}>
              會員中心
            </Link>
            <form action={logout}>
              <button type="submit" className={mobileAccountButtonClass}>
                登出
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className={mobileAccountButtonClass}>
            會員登入
          </Link>
        )}
      </div>
    </header>
  );
}

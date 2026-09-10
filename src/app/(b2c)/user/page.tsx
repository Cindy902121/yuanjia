import Link from "next/link";
import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth-context";
import { getB2BAccess } from "@/lib/b2b/catalog";
import { logout } from "@/lib/actions/auth";
import { DEMO_MEMBER_PROFILE } from "@/lib/cart/demo-profile";
import { editorialButtonSolid } from "@/lib/editorial/styles";
import { B2BShoppingGuard } from "@/components/B2BShoppingGuard";

/**
 * /user 頁面（2026-08-19，PRD B2C 伸展項目，8/17-8/22 團隊任務清單列為選做）。
 *
 * B2C 帳號建立與登入由 Supabase Auth 的 `/signup`、Email／密碼與 Google OAuth
 * 處理；會員中心仍只顯示登入身分與展示資料，不假造沒有真實資料來源的訂單歷史列表。
 *
 * 這裡做的是誠實範圍內合理的「會員中心」骨架：
 * - 未登入：提示先登入，連到 /login（B 的統一登入頁）。
 * - 已登入：顯示登入身分（真的 email，來自 Supabase session，跟 Header 刻意
 *   不顯示 email 不衝突——Header 是全站導覽列，B 要求不要顯示是因為那裡是
 *   每一頁都會看到的固定資訊，容易顯得雜；這裡是使用者自己點進「會員中心」
 *   才會看到的頁面，看自己的登入身分是這個頁面存在的目的）、展示用收件資料
 *   （src/lib/cart/demo-profile.ts，清楚標示為展示資料，不是真實個人資料
 *   儲存）、快速連結（購物車、常見問題），與登出按鈕。
 *
 * noindex：這是帳號相關頁面，不該被搜尋引擎索引，跟 /login、/checkout 同一個
 * 處理方式。
 *
 * 2026-09-03：路由規格表 /user 這一列，B2B 公司使用者是「登出確認[^1]」，不是
 * 直接顯示 B2C 會員中心（B2B 公司 session 也會通過 `!user` 判斷為 false，
 * 之前完全沒特殊處理）。這裡在讀 B2C session 之前先用 getB2BAccess() 判斷，
 * 是 B2B 就顯示 B2BShoppingGuard，不繼續往下渲染會員資料。
 */
export const metadata: Metadata = {
  title: "會員中心 | 元家",
  robots: { index: false, follow: false },
};

export default async function UserPage() {
  const access = await getB2BAccess();
  const { user } = access.role === "b2b" ? { user: null } : await getSessionContext();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 bg-[#EAF4F8] px-5 py-16 font-[family-name:var(--ep-font-sans)] text-[#0B1620] sm:px-8 lg:py-24">
      <div className="flex flex-col gap-1 border-b border-[#0B1620]/15 pb-6">
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
          ACCOUNT
        </span>
        <h1 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#0B1620]">
          會員中心
        </h1>
      </div>

      {access.role === "b2b" ? (
        <B2BShoppingGuard />
      ) : !user ? (
        <div className="flex flex-col items-center gap-4 border border-dashed border-[#0B1620]/20 px-12 py-20 text-center">
          <p className="text-sm font-light text-[#536168]">請先登入查看會員中心。</p>
          <Link href="/login" className={editorialButtonSolid}>
            前往登入
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]">
              登入帳號
            </span>
            <p className="font-[family-name:var(--ep-font-serif)] text-base text-[#0B1620]">{user.email}</p>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#0B1620]/15 pt-6">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]">
              收件資料（展示用）
            </span>
            <p className="text-xs font-light leading-6 text-[#536168]">
              本網站為 MVP 展示，尚未串接真實會員個人資料儲存，以下為結帳頁「使用展示會員資料」帶入的同一組示範資料。
            </p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[#536168]">收件人</dt>
                <dd className="text-[#0B1620]">{DEMO_MEMBER_PROFILE.recipientName}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[#536168]">電話</dt>
                <dd className="text-[#0B1620]">{DEMO_MEMBER_PROFILE.recipientPhone}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[#536168]">Email</dt>
                <dd className="text-[#0B1620]">{DEMO_MEMBER_PROFILE.recipientEmail}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[#536168]">地址</dt>
                <dd className="text-[#0B1620]">{DEMO_MEMBER_PROFILE.deliveryAddress}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#0B1620]/15 pt-6">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]">
              快速連結
            </span>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/cart" className="text-[#0B1620] underline underline-offset-2 hover:text-[#FF5A36]">
                購物車
              </Link>
              <Link href="/products" className="text-[#0B1620] underline underline-offset-2 hover:text-[#FF5A36]">
                商品列表
              </Link>
              <Link href="/faq" className="text-[#0B1620] underline underline-offset-2 hover:text-[#FF5A36]">
                常見問題
              </Link>
            </div>
          </div>

          <form action={logout} className="border-t border-[#0B1620]/15 pt-6">
            <button
              type="submit"
              className="border border-[#0B1620]/30 px-4 py-1.5 text-xs tracking-[0.1em] text-[#0B1620] transition-colors hover:border-[#0B1620] hover:bg-[#0B1620] hover:text-white"
            >
              登出
            </button>
          </form>
        </>
      )}
    </main>
  );
}

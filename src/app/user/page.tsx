import Link from "next/link";
import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth-context";
import { logout } from "@/lib/actions/auth";
import { DEMO_MEMBER_PROFILE } from "@/lib/cart/demo-profile";
import { editorialButtonSolid } from "@/lib/editorial/styles";

/**
 * /user 頁面（2026-08-19，PRD B2C 伸展項目，8/17-8/22 團隊任務清單列為選做）。
 *
 * 目前 B2C 註冊只建立 Supabase Auth identity，仍沒有真正的個人會員資料、
 * 訂單歷史查詢 API（目前 B2C 只有 `POST /api/b2c/mock-orders` 建立展示訂單，
 * 沒有對應的 GET 依使用者查詢自己訂單的端點），所以這裡**沒有**假造一個
 * 「訂單歷史」列表騙自己有這個功能——沒有真實資料來源的功能，寧可誠實地不做，
 * 也不要做一個看起來像真的、其實是空殼的頁面。
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
 */
export const metadata: Metadata = {
  title: "會員中心 | 元家",
  robots: { index: false, follow: false },
};

export default async function UserPage() {
  const { user } = await getSessionContext();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 bg-[#FAF9F6] px-5 py-16 font-[family-name:var(--ep-font-sans)] text-[#2B2B2B] sm:px-8 lg:py-24">
      <div className="flex flex-col gap-1 border-b border-[#2b2b2b]/15 pb-6">
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#8a8a8a]">
          ACCOUNT
        </span>
        <h1 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#2b2b2b]">
          會員中心
        </h1>
      </div>

      {!user ? (
        <div className="flex flex-col items-center gap-4 border border-dashed border-[#2b2b2b]/20 px-12 py-20 text-center">
          <p className="text-sm font-light text-[#4a4a4a]">請先登入查看會員中心。</p>
          <Link href="/login" className={editorialButtonSolid}>
            前往登入
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
              登入帳號
            </span>
            <p className="font-[family-name:var(--ep-font-serif)] text-base text-[#2b2b2b]">{user.email}</p>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#2b2b2b]/15 pt-6">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
              收件資料（展示用）
            </span>
            <p className="text-xs font-light leading-6 text-[#8a8a8a]">
              本網站為 MVP 展示，尚未串接真實會員個人資料儲存，以下為結帳頁「使用展示會員資料」帶入的同一組示範資料。
            </p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[#8a8a8a]">收件人</dt>
                <dd className="text-[#2b2b2b]">{DEMO_MEMBER_PROFILE.recipientName}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[#8a8a8a]">電話</dt>
                <dd className="text-[#2b2b2b]">{DEMO_MEMBER_PROFILE.recipientPhone}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[#8a8a8a]">Email</dt>
                <dd className="text-[#2b2b2b]">{DEMO_MEMBER_PROFILE.recipientEmail}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[#8a8a8a]">地址</dt>
                <dd className="text-[#2b2b2b]">{DEMO_MEMBER_PROFILE.deliveryAddress}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#2b2b2b]/15 pt-6">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
              快速連結
            </span>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/cart" className="text-[#2b2b2b] underline underline-offset-2 hover:text-[#3E5C6B]">
                購物車
              </Link>
              <Link href="/products" className="text-[#2b2b2b] underline underline-offset-2 hover:text-[#3E5C6B]">
                商品列表
              </Link>
              <Link href="/faq" className="text-[#2b2b2b] underline underline-offset-2 hover:text-[#3E5C6B]">
                常見問題
              </Link>
            </div>
          </div>

          <form action={logout} className="border-t border-[#2b2b2b]/15 pt-6">
            <button
              type="submit"
              className="border border-[#2b2b2b]/30 px-4 py-1.5 text-xs tracking-[0.1em] text-[#2b2b2b] transition-colors hover:border-[#2b2b2b] hover:bg-[#2b2b2b] hover:text-white"
            >
              登出
            </button>
          </form>
        </>
      )}
    </main>
  );
}

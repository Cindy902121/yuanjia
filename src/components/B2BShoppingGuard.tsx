import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { editorialButtonLight, editorialButtonSolid } from "@/lib/editorial/styles";

/**
 * B2B 公司使用者誤入 B2C 購物路由時顯示的守門畫面。
 *
 * 元家網站_路由與權限規格.md 註 1：「B2B 誤入 B2C 購物路由：顯示『請先登出
 * 企業帳號』。選擇登出時清除 session 並回首頁；取消時保留 session，導向
 * /business 後再進入 /business/catalog。」
 *
 * 2026-09-03：這條規則原本完全沒實作（/cart、/checkout、/products 系列、
 * /user 這幾頁對 B2B session 完全沒有判斷，會直接照 B2C 一般使用者渲染），
 * 是今天做公司隔離測試時發現的缺口，補上。
 *
 * 用法：呼叫端頁面先用 `getB2BAccess()`（@/lib/b2b/catalog）判斷
 * `role === "b2b"`，是的話用這個元件取代原本的購物內容渲染，其餘（未登入、
 * B2C 會員、admin、business_staff）維持各頁原本的邏輯不變。
 *
 * 兩個按鈕都不需要額外的 client-side 互動：
 * - 「取消，返回企業型錄」是單純的 <Link>，不會動到 session，直接連到
 *   /business/catalog（跟規格描述的「導向 /business 後再進入
 *   /business/catalog」結果相同，省了一次中繼 redirect）。
 * - 「登出企業帳號，繼續購物」沿用 Header／/user 頁共用的同一個 logout()
 *   Server Action（src/lib/actions/auth.ts），清除 session 後導回首頁。
 */
export function B2BShoppingGuard() {
  return (
    <div className="flex flex-col items-center gap-4 border border-dashed border-[#0B1620]/20 px-8 py-16 text-center sm:px-12 sm:py-20">
      <p className="font-[family-name:var(--ep-font-serif)] text-base text-[#0B1620]">請先登出企業帳號</p>
      <p className="max-w-md text-sm font-light leading-[1.8] text-[#5C7383]">
        這裡是一般會員的購物頁面，您目前是用企業客戶身分登入。請選擇要登出企業帳號繼續購物，還是返回企業型錄。
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href="/business/catalog" className={editorialButtonSolid}>
          取消，返回企業型錄
        </Link>
        <form action={logout}>
          <button type="submit" className={editorialButtonLight}>
            登出企業帳號，繼續購物
          </button>
        </form>
      </div>
    </div>
  );
}

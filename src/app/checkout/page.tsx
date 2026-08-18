import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";

/**
 * FDD §9.1：「/checkout 的 title 與 H1 使用「結帳」，但不加入 sitemap 且設定
 * noindex；不以結帳頁作為 SEO 目標。」跟 /login 一樣用 robots: { index: false,
 * follow: false }。
 */
export const metadata: Metadata = {
  title: "結帳 | 元家",
  description: "填寫收件資訊，送出展示用模擬訂單。",
  robots: { index: false, follow: false },
};

/**
 * /checkout 頁面。PRD B2C-04／FDD §6.3、§7.2。
 *
 * 這個檔案只負責 metadata（noindex 必須從 Server Component 設定）；實際表單
 * 邏輯在 checkout-form.tsx（要讀購物車 localStorage、處理送出狀態，一定要是
 * Client Component）。
 */
export default function CheckoutPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-6 px-5 py-10 sm:px-8">
      <CheckoutForm />
    </main>
  );
}

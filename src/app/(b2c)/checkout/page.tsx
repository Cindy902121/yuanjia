import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";
import { requireB2cAccess } from "@/lib/b2c/access";

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
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，這裡也一起換成編輯風的
 * 底色／字體，實際版面在 checkout-form.tsx。
 */
export default async function CheckoutPage() {
  await requireB2cAccess();

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 bg-[#FAF9F6] px-5 py-16 font-[family-name:var(--ep-font-sans)] text-[#2B2B2B] sm:px-8 lg:py-20">
      <CheckoutForm />
    </main>
  );
}

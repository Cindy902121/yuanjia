import type { Metadata } from "next";
import { CartPageClient } from "./cart-page-client";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";

const TITLE = "購物車 | 元家";
const DESCRIPTION = "查看購物車內容，調整數量後前往結帳。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonicalFor("/cart"),
  openGraph: buildOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    url: "/cart",
    images: [{ url: "/products-banner.jpg", width: 1920, height: 380, alt: "元家購物車" }],
  }),
};

/**
 * /cart 頁面。PRD B2C-04／FDD §7.2：空購物車狀態、商品清單、數量、總額、前往結帳 CTA。
 *
 * 這個檔案只負責 metadata（Server Component 才能 export metadata）；實際互動內容
 * 在 cart-page-client.tsx（購物車存瀏覽器 localStorage，見 src/lib/cart/store.ts，
 * 一定要是 Client Component）。/cart 不在 FDD §9.1 的 noindex 清單裡，所以這裡
 * 沒有設定 noindex。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，這裡也一起換成編輯風的
 * 底色／字體，實際版面在 cart-page-client.tsx。
 */
export default function CartPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 bg-[#FAF9F6] px-5 py-16 font-[family-name:var(--ep-font-sans)] text-[#2B2B2B] sm:px-8 lg:py-20">
      <CartPageClient />
    </main>
  );
}

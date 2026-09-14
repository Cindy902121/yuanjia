import type { Metadata } from "next";
import { CartPageClient } from "./cart-page-client";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";
import { requireB2cAccess } from "@/lib/b2c/access";

const TITLE = "購物車 | 元家";
const DESCRIPTION = "查看購物車內容，調整數量後前往結帳。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonicalFor("/cart"),
  robots: { index: false, follow: false },
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
 * 一定要是 Client Component）。B2B session 由 Server Component 先導回企業型錄，
 * /cart 依路由規格設定 noindex。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，這裡也一起換成編輯風的
 * 底色／字體，實際版面在 cart-page-client.tsx。
 *
 * 2026-09-09（main 合併，改採 B 的 requireB2cAccess()）：這裡原本是顯示
 * B2BShoppingGuard（請先登出企業帳號的確認選項），main 上 B 已經改成
 * requireB2cAccess() 直接 redirect("/business")，兩邊各自做了一版、合併時
 * 撞上，採用已經併進 main 的版本，細節見 products/page.tsx 同批說明。
 */
export default async function CartPage() {
  await requireB2cAccess();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 bg-[#EAF4F8] px-5 py-16 font-[family-name:var(--ep-font-sans)] text-[#0B1620] sm:px-8 lg:py-20">
      <CartPageClient />
    </main>
  );
}

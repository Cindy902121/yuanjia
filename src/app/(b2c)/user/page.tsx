import Link from "next/link";
import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth-context";
import { getB2BAccess } from "@/lib/b2b/catalog";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveProducts } from "@/lib/supabase/products";
import { toCardData } from "@/lib/types/product";
import { editorialButtonSolid } from "@/lib/editorial/styles";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { B2BShoppingGuard } from "@/components/B2BShoppingGuard";
import { buildDemoOrders } from "./member-demo-data";
import { MemberCenter } from "./member-center";

/**
 * /user 頁面（2026-08-19 原始建立，PRD B2C 伸展項目）。
 *
 * 2026-09-11：會員中心正式改版。使用者要求「課堂展示用 MVP，不會正式投入
 * 商業使用」，這次補上完整的會員總覽／會員資訊／訂單查詢／專屬優惠／
 * 收藏清單五個頁籤，優先做完整可互動的前端 UI/UX Demo，不要求全部功能都
 * 接 Supabase（詳細的 Demo Data 標記規則見 `member-demo-data.ts` 檔頭）。
 *
 * 這個檔案（Server Component）保留原本就有、真正在運作的守門邏輯完全不動：
 * - B2B 公司 session 顯示 `B2BShoppingGuard`（登出確認），不是 B2C 會員中心。
 * - 未登入導去 `/login`。
 * - 已登入才往下渲染——這裡新增的部分是「已登入之後看到什麼」，不是
 *   「誰可以看到」，Auth 判斷邏輯本身完全沒有改。
 *
 * 已登入時，這裡額外做兩件事，把真實資料準備好交給 `<MemberCenter />`
 * （Client Component，互動與 Demo State 都在那邊）：
 * 1. 用既有的 `getAllActiveProducts()`（跟 `/products` 頁面同一個查詢）
 *    查出真實商品，做為收藏清單／訂單品項的資料來源——不是另外造假商品。
 * 2. 用 `buildDemoOrders()` 把這批真實商品組成 6 筆展示訂單（訂單編號／
 *    日期／狀態是 Demo，商品本身是真的）。
 *
 * noindex：帳號相關頁面，跟 /login、/checkout 同一個處理方式，維持不變。
 */
export const metadata: Metadata = {
  title: "會員中心 | 元家",
  robots: { index: false, follow: false },
};

export default async function UserPage() {
  const access = await getB2BAccess();
  const { user } = access.role === "b2b" ? { user: null } : await getSessionContext();

  if (access.role === "b2b") {
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
        <B2BShoppingGuard />
      </main>
    );
  }

  if (!user) {
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
        <div className="flex flex-col items-center gap-4 border border-dashed border-[#0B1620]/20 px-12 py-20 text-center">
          <p className="text-sm font-light text-[#536168]">請先登入查看會員中心。</p>
          <Link href="/login" className={editorialButtonSolid}>
            前往登入
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const products = await getAllActiveProducts(supabase);
  const cardProducts = products.map(toCardData);
  const orders = buildDemoOrders(cardProducts);

  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <EditorialStyles />
      <MemberCenter email={user.email ?? DEMO_FALLBACK_EMAIL} products={cardProducts} orders={orders} />
    </main>
  );
}

/** Supabase User 的 email 型別是 `string | undefined`；理論上不會發生，純粹滿足型別、避免畫面顯示 undefined。 */
const DEMO_FALLBACK_EMAIL = "demo@yens.com.tw";

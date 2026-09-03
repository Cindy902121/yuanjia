import type { Metadata } from "next";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";
import { LeadForm } from "./lead-form";

const TITLE = "企業合作 | 元家";
const DESCRIPTION = "元家企業合作洽詢——留下公司與需求資訊，我們的業務團隊將盡快與您聯繫。";

/**
 * /business/lead 頁面（2026-08-19，PRD 5.4／6.7、FDD 6.10、路由與權限規格明確
 * 列出的正式頁面，不是伸展項目）。
 *
 * PRD 5.4「B2C 公開企業合作支線」：首頁「企業合作」入口 → 這頁的表單 →
 * 送出需求 → 表單成功狀態。
 *
 * FDD 6.10「B2B 新客表單」：**MVP 不建立公開寫入 API**，前端只做欄位驗證與
 * 成功畫面，不保存姓名、電話或 Email——所以這頁完全沒有打任何後端 API，
 * 表單邏輯（驗證＋成功狀態）都在 LeadForm（Client Component）裡，純本地
 * state 切換，跟 /checkout 那種會真的呼叫 POST /api/b2c/mock-orders 的表單
 * 不一樣，是刻意的行為差異，不是漏接 API。
 *
 * 存取權限（路由與權限規格第2節）：未登入／B2C 會員／B2B 使用者／管理者皆
 * 允許瀏覽；B2B 使用者只是「不從 B2B 導覽進入」（B2B 自己的導覽選單不會顯示
 * 這個入口），不代表禁止訪問，這裡不需要任何角色判斷或 guard。
 *
 * SEO：可索引（PRD 6.7 明確列在可索引頁面清單），已加進 sitemap.ts。
 */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: canonicalFor("/business/lead"),
  openGraph: buildOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    url: "/business/lead",
    images: [{ url: "/hero-seafood.jpg", width: 970, height: 980, alt: "元家精選海鮮" }],
  }),
};

export default function BusinessLeadPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 bg-[#EAF4F8] px-5 py-16 font-[family-name:var(--ep-font-sans)] text-[#0B1620] sm:px-8 lg:py-24">
      <div className="flex flex-col gap-3 border-b border-[#0B1620]/15 pb-6">
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
          BUSINESS
        </span>
        <h1 className="font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#0B1620] sm:text-3xl">
          企業合作
        </h1>
        <p className="text-sm font-light leading-7 text-[#5C7383]">
          元家企業提供餐飲通路、零售經銷、電商平台等多元合作方式。留下您的公司與需求資訊，我們的業務團隊將盡快與您聯繫。
        </p>
      </div>

      <LeadForm />
    </main>
  );
}

import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveProducts, getDistinctCategories } from "@/lib/supabase/products";
import { FadeInSection } from "@/components/editorial/FadeInSection";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";
import { collectTagGroups } from "@/lib/editorial/tag-groups";
import { requireB2cAccess } from "@/lib/b2c/access";
import { OceanProductList } from "./ocean-product-list";

/**
 * `/products-preview`——正式 `/products` 頁面的 Visual Enhancement Preview。
 *
 * 2026-09-12（使用者要求「針對 Product Listing Page 進行 Visual
 * Enhancement」，明確要求「請先建立獨立 Preview / Variant，不要直接修改
 * 目前正式版本」，確認視覺效果後才套用到正式頁面）。
 *
 * 這個檔案本身**逐字複製**自 `(b2c)/products/page.tsx`——資料查詢
 * （`getAllActiveProducts`／`getDistinctCategories`，同一份真實 Supabase
 * 資料）、`requireB2cAccess()` 守門、`?category=`／`?tag=` 查詢字串處理、
 * 滿版照片 Hero Banner，全部原封不動；唯一差異是商品格區塊換成
 * `OceanProductList`（見同資料夾 `ocean-product-list.tsx`／
 * `ocean-background-layer.tsx`，那兩個檔案才是這次視覺變更的實際內容）。
 *
 * `robots: { index: false, follow: false }` 比照 `ui-preview`／
 * 先前 `/about-preview` 的既有做法，用頁面層級 meta 自我隔離，不需要另外
 * 去改 `src/app/robots.ts`／`sitemap.ts`。這個頁面在 `(b2c)` route group
 * 底下，Header／Footer／B2CHelpWidget／GA4 由 `(b2c)/layout.tsx` 自動
 * 套用——選在這個位置而不是獨立頂層路由，是為了讓使用者審視時看到的就是
 * 「套進真實網站情境（含 Header／Footer）之後」的樣子，跟正式頁面唯一的
 * 差異只有視覺，不需要之後補這一段。
 *
 * 這個頁面完全沒有連結入口（首頁／導覽列都沒有指過來），只能直接輸入網址
 * 造訪，符合「不要直接修改目前正式版本」的要求。
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "商品列表（Ocean Preview）| 元家",
};

export default async function ProductsPreviewPage({ searchParams }: PageProps<"/products-preview">) {
  await requireB2cAccess();
  const params = await searchParams;
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    getAllActiveProducts(supabase),
    getDistinctCategories(supabase),
  ]);

  const categoryParam = typeof params.category === "string" ? params.category : undefined;
  const initialCategorySlug = categories.some((category) => category.slug === categoryParam)
    ? categoryParam
    : undefined;

  const tagParams = params.tag === undefined ? [] : Array.isArray(params.tag) ? params.tag : [params.tag];
  const allTagSlugs = collectTagGroups(products).flatMap(([, tags]) => tags.map((tag) => tag.slug));
  const initialTagSlugs = [...new Set(tagParams.filter((tag) => allTagSlugs.includes(tag)))];

  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <EditorialStyles />

      {/* Banner：跟正式頁面一模一樣，這次視覺調整範圍不含這裡。 */}
      <section className="relative flex min-h-[280px] items-end overflow-hidden border-b border-[#D4DEE2] lg:min-h-[360px]">
        <div className="absolute inset-0" aria-hidden="true">
          <Image src="/products-banner.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        </div>
        <FadeInSection className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-5 pb-12 pt-20 sm:px-8 lg:px-10">
          <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-white/85">
            SEASONAL
          </span>
          <h1 className="font-[family-name:var(--ep-font-serif)] text-3xl font-light tracking-[0.05em] text-white sm:text-4xl">
            嚴選當季鮮味
          </h1>
        </FadeInSection>
      </section>

      <section className="relative">
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <FadeInSection className="mb-14 flex flex-col gap-2">
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
              MENU · 商品一覽
            </span>
            <p className="text-xs font-light text-[#536168]">
              本網站商品資訊為 MVP 展示資料，商品照片為近似示意，包裝與規格請以商品詳情頁文字為準；實際價格與庫存請以正式商城公告為準。
            </p>
          </FadeInSection>

          <OceanProductList
            products={products}
            categories={categories}
            initialCategorySlug={initialCategorySlug}
            initialTagSlugs={initialTagSlugs}
          />
        </div>
      </section>
    </main>
  );
}

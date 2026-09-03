import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProductsByTagSlug, getTagBySlug } from "@/lib/supabase/products";
import { sortByAvailability, toCardData } from "@/lib/types/product";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";
import { EditorialProductGrid } from "@/components/editorial/ProductGrid";
import { EditorialStyles } from "@/components/editorial/EditorialStyles";

/**
 * /products/tags/[slug] 頁面。
 *
 * 標籤名稱直接查 `b2c_tags`（見 getTagBySlug 的說明，不是從商品陣列裡間接撈）。
 *
 * `b2c_tag_view` 沒有帶 product_id——這個事件本來就沒有 product_id（FDD 6.7
 * 白名單裡 b2c_tag_view 沒有帶 product_reference 的設計）。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，這裡也換成編輯風的網格
 * （見 src/components/editorial/ProductGrid.tsx），跟 /products 用同一套卡片
 * 視覺，但沒有篩選欄——這頁本身就是「某個標籤的結果」，不需要在結果頁裡再篩
 * 一次。
 */
export async function generateMetadata({
  params,
}: PageProps<"/products/tags/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const tag = await getTagBySlug(supabase, slug);
  const tagName = tag?.name ?? slug;
  const title = `${tagName} 商品 | 元家`;
  const description = `瀏覽所有標籤為「${tagName}」的元家商品。`;

  return {
    title,
    description,
    alternates: canonicalFor(`/products/tags/${slug}`),
    openGraph: buildOpenGraph({
      title,
      description,
      url: `/products/tags/${slug}`,
      images: [{ url: "/products-banner.jpg", width: 1920, height: 380, alt: title }],
    }),
  };
}

export default async function ProductTagPage({ params }: PageProps<"/products/tags/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();
  const [tag, products] = await Promise.all([
    getTagBySlug(supabase, slug),
    getProductsByTagSlug(supabase, slug),
  ]);
  const tagName = tag?.name ?? slug;
  const matches = sortByAvailability(products.map(toCardData));

  return (
    <main className="flex flex-1 flex-col bg-[#EAF4F8] font-[family-name:var(--ep-font-sans)] text-[#0B1620]">
      <EditorialStyles />
      <TrackPageView eventName="b2c_tag_view" />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-14 px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="flex flex-col gap-4">
          <Link
            href="/products"
            className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#5C7383] hover:text-[#FF5A36]"
          >
            ← ALL PRODUCTS
          </Link>
          <div>
            <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#5C7383]">
              TAG
            </span>
            <h1 className="mt-2 font-[family-name:var(--ep-font-serif)] text-3xl font-light tracking-[0.05em] text-[#0B1620]">
              {tagName}
            </h1>
          </div>
        </div>

        <EditorialProductGrid products={matches} />
      </div>
    </main>
  );
}

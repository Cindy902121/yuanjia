import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProductsByTagSlug, getTagBySlug } from "@/lib/supabase/products";
import { sortByAvailability, toCardData } from "@/lib/types/product";
import { ProductCard } from "@/components/ProductCard";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { buildOpenGraph, canonicalFor } from "@/lib/seo";

/**
 * /products/tags/[slug] 頁面。
 *
 * 2026-08-17：改接正式 Supabase（C 本週排程要求，見 src/lib/supabase/products.ts
 * 檔頭說明），取代原本的同步 fixture 查詢。標籤名稱改直接查 `b2c_tags`（見
 * getTagBySlug 的說明，不是從商品陣列裡間接撈）。
 *
 * `b2c_tag_view` 現在會帶上真的標籤所屬第一筆商品 id？—— 不會，這個事件本來就
 * 沒有 product_id（FDD 6.7 白名單裡 b2c_tag_view 沒有帶 product_reference 的
 * 設計），這裡沒有改動。
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

export default async function ProductTagPage({
  params,
}: PageProps<"/products/tags/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();
  const [tag, products] = await Promise.all([
    getTagBySlug(supabase, slug),
    getProductsByTagSlug(supabase, slug),
  ]);
  const tagName = tag?.name ?? slug;
  // 缺貨商品排到最後（2026-08-17 使用者要求），見 sortByAvailability 的說明。
  const matches = sortByAvailability(products.map(toCardData));

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-5 py-10 sm:px-8 lg:px-10">
      <Link href="/products" className="text-sm text-ink-600 hover:text-brand-ocean-700 hover:underline">
        ← 返回商品列表
      </Link>
      <h1 className="text-2xl font-semibold text-ink-900">標籤：{tagName}</h1>

      <TrackPageView eventName="b2c_tag_view" />

      {matches.length === 0 ? (
        // 對應 PRD「無符合商品」規則。可用不存在的標籤 slug（例如 /products/tags/beef）測試。
        <p className="rounded-lg border border-dashed border-border-subtle p-8 text-center text-sm text-ink-600">
          無符合商品
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      )}
    </main>
  );
}

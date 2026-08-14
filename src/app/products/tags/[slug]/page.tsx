import Link from "next/link";
import type { Metadata } from "next";
import { getProductsByTagSlug } from "@/lib/fixtures/products";
import { toCardData } from "@/lib/types/product";
import { ProductCard } from "@/components/ProductCard";
import { TrackPageView } from "@/components/analytics/TrackPageView";

/**
 * /products/tags/[slug] 骨架頁。
 *
 * TODO（接上 Supabase 後替換，見 docs/B2C商品展示資料.md §4.1、§9）：
 * - 改為呼叫商品標籤查詢 API，多標籤 AND 篩選邏輯見上面文件。
 *
 * 8/15：載入完成時觸發 b2c_tag_view（已在 FDD 6.7 白名單內，見 src/lib/analytics）。
 */

function resolveTagName(slug: string): string {
  const match = getProductsByTagSlug(slug)[0]?.tags.find((tag) => tag.slug === slug);
  return match?.name ?? slug;
}

export async function generateMetadata({
  params,
}: PageProps<"/products/tags/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tagName = resolveTagName(slug);

  return {
    title: `${tagName} 商品 | 元家`,
    description: `瀏覽所有標籤為「${tagName}」的元家商品。`,
  };
}

export default async function ProductTagPage({
  params,
}: PageProps<"/products/tags/[slug]">) {
  const { slug } = await params;
  const matches = getProductsByTagSlug(slug).map(toCardData);
  const tagName = resolveTagName(slug);

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

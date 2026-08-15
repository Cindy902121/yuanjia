import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/fixtures/products";
import { ProductDetail } from "@/components/ProductDetail";

/**
 * B2C /products/[slug] 頁面。
 *
 * TODO（接上 Supabase 後替換，見 docs/B2C商品展示資料.md §8）：
 * - 目前用同步的 fixture 查詢，找不到商品時直接呼叫 Next.js notFound()（保留正確
 *   的 HTTP 404／SEO 語意）；接上真正非同步查詢後，改成組出 ProductDetailState
 *   （loading／error／not_found／ready）傳給 <ProductDetail />——商品不存在或已
 *   下架時仍應呼叫 notFound()，不是把 not_found 狀態傳給元件（見元件內註解）。
 */

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "找不到這項商品 | 元家" };
  }

  return {
    title: `${product.name} | 元家`,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <Link href="/products" className="text-sm text-zinc-500 hover:underline">
        ← 返回商品列表
      </Link>

      <ProductDetail state={{ status: "ready", product }} />
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { getB2CCatalog, getB2CProductsByCategorySlug } from "@/lib/b2c/catalog";
import { ProductCard } from "@/components/ProductCard";
import { toCardData } from "@/lib/types/product";

type CategoryPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getB2CCatalog()).categories.find((item) => item.slug === slug);
  return { title: `${category?.name ?? slug}商品 | 元家`, description: `瀏覽元家${category?.name ?? slug}商品。` };
}

export default async function ProductCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const catalog = await getB2CCatalog();
  const category = catalog.categories.find((item) => item.slug === slug);
  const products = (await getB2CProductsByCategorySlug(slug)).map(toCardData);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <Link href="/products" className="text-sm text-zinc-500 hover:underline">← 返回商品列表</Link>
      <div><p className="text-sm text-zinc-500">PRODUCT CATEGORY</p><h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">分類：{category?.name ?? slug}</h1></div>
      {products.length === 0 ? <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">此分類目前沒有符合商品。</p> : <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</ul>}
    </main>
  );
}

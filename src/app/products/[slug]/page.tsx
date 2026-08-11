import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/fixtures/products";

/**
 * /products/[slug] 骨架頁。
 *
 * TODO（接上 Supabase 後替換，見 docs/B2C商品展示資料.md §8）：
 * - 改依 ProductDetailState 呈現 loading／error／not_found／ready。
 * - not_found 同時涵蓋「slug 不存在」與「商品已下架」——B2C 公開查詢的 RLS
 *   只會回傳 is_active = true 的商品，兩種情況在前台無法區分。
 * - 圖片區塊目前一律顯示佔位圖，因為 Supabase 尚無任何商品圖片。
 * - 正式 ProductDetail 元件完成後，這裡的行內 markup 要換成 <ProductDetail />。
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

      <div
        aria-hidden="true"
        className="flex h-64 items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-400 dark:bg-zinc-900"
      >
        無商品圖片
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {product.name}
        </h1>
        {product.brand ? (
          <p className="text-sm text-zinc-500">品牌：{product.brand}</p>
        ) : null}
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          NT$ {product.price}
        </p>
        {product.inventoryStatus === "out_of_stock" ? (
          <span className="w-fit rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300">
            缺貨
          </span>
        ) : null}
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">規格</dt>
          <dd className="text-zinc-900 dark:text-zinc-50">{product.specification}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">產地</dt>
          <dd className="text-zinc-900 dark:text-zinc-50">{product.origin}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">保存方式</dt>
          <dd className="text-zinc-900 dark:text-zinc-50">{product.storageMethod}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">分類</dt>
          <dd className="text-zinc-900 dark:text-zinc-50">
            {product.categories.map((category) => category.name).join("、")}
          </dd>
        </div>
      </dl>

      <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{product.description}</p>

      {product.foodSafetyInfo ? (
        <section>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">食品安全</h2>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            {product.foodSafetyInfo}
          </p>
        </section>
      ) : null}

      {product.qualityInfo ? (
        <section>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">認證／品質</h2>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{product.qualityInfo}</p>
        </section>
      ) : null}

      {product.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <li key={tag.slug}>
              <Link
                href={`/products/tags/${tag.slug}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {tag.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}

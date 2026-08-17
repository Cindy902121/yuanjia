import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveProducts, getProductBySlug } from "@/lib/supabase/products";
import { ProductDetail } from "@/components/ProductDetail";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RecommendedProducts } from "@/components/RecommendedProducts";

/**
 * /products/[slug] 頁面。
 *
 * 2026-08-17：改接正式 Supabase（C 本週排程要求，見 src/lib/supabase/products.ts
 * 檔頭說明）——取代原本的同步 fixture 查詢。找不到商品或已下架時，
 * `getProductBySlug()` 回傳 null，這裡呼叫 Next.js notFound()（保留正確的
 * HTTP 404／SEO 語意），跟 fixture 時期的行為一致，只是查詢來源換掉。
 *
 * `b2c_product_view` 現在會**帶上真的 product_id**——之前 fixture id（如
 * "fx-05"）不是 UUID，C 的 POST /api/analytics/events 會用 isUuid() 拒絕，所以
 * 先前刻意不帶；現在商品是正式 Supabase 資料、id 是真的 UUID 且存在於
 * b2c_products，這個限制解除了，補回去。
 *
 * 2026-08-17（同日）：依使用者要求（附圖參考）：
 * - 容器加寬到 max-w-5xl（跟 /products 的 1440px 不同，這裡是單一商品內容＋
 *   推薦商品，不需要 /products 那麼寬，1024px 讓推薦商品的 4 欄網格跟主內容
 *   都還算舒適）。
 * - 原本「← 返回商品列表」換成路徑列（首頁 > 商品列表 > 分類 > 商品名稱，
 *   見 src/components/Breadcrumb.tsx）；分類那一段現在連到新的
 *   /products/categories/[slug]（同一批這次新增），不是 /products?category=。
 * - 最下方加「推薦商品」（見 src/components/RecommendedProducts.tsx），資料來源
 *   也改成查 Supabase 全部啟用商品，不是 fixture 陣列。
 */

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const product = await getProductBySlug(supabase, slug);

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
  const supabase = await createClient();
  const product = await getProductBySlug(supabase, slug);

  if (!product) {
    notFound();
  }

  const allProducts = await getAllActiveProducts(supabase);
  const primaryCategory = product.categories.find((c) => c.isPrimary);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 lg:px-10">
      <Breadcrumb
        segments={[
          { label: "首頁", href: "/" },
          { label: "商品列表", href: "/products" },
          ...(primaryCategory
            ? [
                {
                  label: primaryCategory.name,
                  href: `/products/categories/${encodeURIComponent(primaryCategory.slug)}`,
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      <TrackPageView eventName="b2c_product_view" productId={product.id} />
      <ProductDetail state={{ status: "ready", product }} />

      <RecommendedProducts currentProduct={product} allProducts={allProducts} />
    </main>
  );
}

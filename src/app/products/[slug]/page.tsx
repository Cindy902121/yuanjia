import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveProducts, getProductBySlug } from "@/lib/supabase/products";
import { ProductDetail } from "@/components/ProductDetail";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RecommendedProducts } from "@/components/RecommendedProducts";
import { buildOpenGraph, canonicalFor, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

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

/**
 * 2026-08-18：openGraph.images 優先用商品自己的照片（目前只有 5 筆真實商品有，見
 * src/lib/product-photos.ts）——分享具體商品連結時應該看到那個商品本身的照片，
 * 不是全站通用圖。沒有照片的商品（coverImage 為 null）才退回
 * products-banner.jpg，不是完全不設定 og:image（分享出去總比什麼圖都沒有好）。
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

  const title = `${product.name} | 元家`;
  const ogImage = product.coverImage
    ? { url: product.coverImage.url, alt: product.coverImage.alt }
    : { url: "/products-banner.jpg", width: 1920, height: 380, alt: product.name };

  return {
    title,
    description: product.shortDescription,
    alternates: canonicalFor(`/products/${product.slug}`),
    openGraph: buildOpenGraph({
      title,
      description: product.shortDescription,
      url: `/products/${product.slug}`,
      images: [ogImage],
    }),
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

  const breadcrumbSegments = [
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
  ];

  /**
   * 2026-08-18：Product／BreadcrumbList 結構化資料（使用者要求「SEO 技術基礎」）。
   * Product 的 offers 直接用資料庫真實的 price／inventoryStatus——頁面上本來就
   * 顯示「本網站商品資訊為 MVP 展示資料」的揭露文字（見 ProductDetail.tsx），
   * 結構化資料標記的是資料庫當下真的存在的值，不是另外編造，跟頁面顯示的內容
   * 一致。
   *
   * BreadcrumbList 直接沿用上面同一份 breadcrumbSegments（跟畫面上的路徑列
   * 是同一份資料），避免結構化資料跟實際畫面顯示的路徑不一致。
   */
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.id,
    ...(product.coverImage ? { image: [`${SITE_URL}${product.coverImage.url}`] } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price,
      availability:
        product.inventoryStatus === "in_stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbSegments.map((segment, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: segment.label,
      ...(segment.href ? { item: `${SITE_URL}${segment.href}` } : {}),
    })),
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 lg:px-10">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <Breadcrumb segments={breadcrumbSegments} />

      <TrackPageView eventName="b2c_product_view" productId={product.id} />
      <ProductDetail state={{ status: "ready", product }} />

      <RecommendedProducts currentProduct={product} allProducts={allProducts} />
    </main>
  );
}

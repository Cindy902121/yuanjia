import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/fixtures/products";
import { ProductDetail } from "@/components/ProductDetail";
import { TrackPageView } from "@/components/analytics/TrackPageView";

/**
 * /products/[slug] 頁面。
 *
 * TODO（接上 Supabase 後替換，見 docs/B2C商品展示資料.md §8）：
 * - 目前用同步的 fixture 查詢，找不到商品時直接呼叫 Next.js notFound()（保留正確
 *   的 HTTP 404／SEO 語意）；接上真正非同步查詢後，改成組出 ProductDetailState
 *   （loading／error／not_found／ready）傳給 <ProductDetail />——商品不存在或已
 *   下架時仍應呼叫 notFound()，不是把 not_found 狀態傳給元件（見元件內註解）。
 *
 * 8/15：載入完成時觸發 b2c_product_view（見 src/lib/analytics）。
 * 2026-08-14：C 的 POST /api/analytics/events 已上線，會用 isUuid() 驗證
 * product_id，並且要求該 id 在 b2c_products 表裡真的存在且 is_active。我們的
 * fixture id（如 "fx-05"）不是 UUID，送了一定會被 API 拒絕（400「產品參照格式
 * 不正確」）——這不是 API 的 bug，是我們還沒接真資料。與其送一個保證失敗的假值，
 * 這裡先不帶 productId；等這個頁面改成查詢真正的 Supabase b2c_products 後，
 * 把 product.id 換成真的 UUID 再傳進去即可，TrackPageView／trackEvent 本身
 * 不需要改。
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

      <TrackPageView eventName="b2c_product_view" />
      <ProductDetail state={{ status: "ready", product }} />
    </main>
  );
}

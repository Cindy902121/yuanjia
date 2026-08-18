import { ProductCard } from "@/components/ProductCard";
import { sortByAvailability, toCardData } from "@/lib/types/product";
import type { ProductDetailData } from "@/lib/types/product";

interface RecommendedProductsProps {
  currentProduct: ProductDetailData;
  allProducts: ProductDetailData[];
}

/**
 * 商品詳情頁最下方的「推薦商品」（2026-08-17 使用者要求）。
 *
 * 推薦規則：跟目前商品共用「主分類」（categories 裡 isPrimary: true 的那筆）的
 * 其他商品，缺貨排最後，最多 4 筆。選這個規則是因為現有 fixture 資料只有分類／
 * 標籤可以用，分類是最穩定的「同一種商品」訊號；沒有瀏覽紀錄、購買紀錄這些
 * 更精準的推薦資料來源，之後真的接上 Supabase 且有行為資料後可以再優化規則，
 * 不是這裡刻意簡化。找不到主分類或同分類沒有其他商品時不顯示這個區塊，不勉強
 * 湊數或退而顯示不相關商品。
 */
export function RecommendedProducts({ currentProduct, allProducts }: RecommendedProductsProps) {
  const primaryCategorySlug = currentProduct.categories.find((c) => c.isPrimary)?.slug;

  if (!primaryCategorySlug) {
    return null;
  }

  const related = sortByAvailability(
    allProducts.filter(
      (product) =>
        product.id !== currentProduct.id &&
        product.categories.some((c) => c.slug === primaryCategorySlug),
    ),
  ).slice(0, 4);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink-900">推薦商品</h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((product) => (
          <ProductCard key={product.id} product={toCardData(product)} />
        ))}
      </ul>
    </section>
  );
}

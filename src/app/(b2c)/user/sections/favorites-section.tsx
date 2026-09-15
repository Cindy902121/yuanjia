import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/types/product";
import { AddToCartButton } from "@/components/AddToCartButton";
import { editorialButtonLight } from "@/lib/editorial/styles";

/**
 * 05 收藏清單——商品是真實既有商品資料（見 page.tsx 傳入的 `products`），
 * 收藏／取消收藏是 Front-end State（見 member-center.tsx 的 `favoriteIds`），
 * 不寫入 Supabase，重新整理會恢復成 `buildDemoFavoriteIds()` 的預設清單。
 * 卡片版面沿用 `/products` 既有 EditorialProductList 的圖片＋文字慣例
 * （4:3 圖片、serif 商品名、font-en 價格），維持全站商品卡視覺一致。
 */
export function FavoritesSection({
  favorites,
  onRemove,
}: {
  favorites: ProductCardData[];
  onRemove: (productId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
          05 · FAVORITES
        </span>
        <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#0B1620]">
          收藏清單
        </h2>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border border-dashed border-[#0B1620]/20 px-12 py-20 text-center">
          <p className="text-sm font-light text-[#536168]">目前沒有收藏商品。</p>
          <Link href="/products" className={editorialButtonLight}>
            瀏覽商品
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((product) => (
            <div key={product.id} className="group relative flex flex-col gap-4">
              <div className="ep-hover-zoom relative aspect-[4/3]">
                {product.coverImage ? (
                  <Image
                    src={product.coverImage.url}
                    alt={product.coverImage.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#F6FBFC] text-xs text-[#536168]">
                    無商品圖片
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/products/${product.slug}`}
                  className="after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
                >
                  <h3 className="font-[family-name:var(--ep-font-serif)] text-lg font-medium text-[#0B1620] group-hover:text-[#FF5A36]">
                    {product.name}
                  </h3>
                </Link>
                <span className="font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#0B1620]">
                  NT$ {product.price}
                </span>
                <div className="relative z-10 mt-1 flex items-center gap-3">
                  <AddToCartButton
                    product={product}
                    className={`${editorialButtonLight} min-h-9 flex-1 px-4 py-2 text-[11px]`}
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(product.id)}
                    className="relative z-10 shrink-0 text-xs tracking-[0.05em] text-[#536168] underline underline-offset-2 hover:text-[#C2401D]"
                  >
                    移除收藏
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

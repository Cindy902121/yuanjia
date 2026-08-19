import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/types/product";
import { AddToCartButton } from "@/components/AddToCartButton";
import { editorialButtonLight } from "@/lib/editorial/styles";

/**
 * 商品網格，日系雜誌編排風——2 欄、無編號（跟 /products 的
 * src/components/editorial/ProductList.tsx 同一套卡片視覺，但這裡沒有篩選欄，
 * 給「已經是篩選結果」的頁面用（標籤頁、分類頁），2026-08-19 新增。
 *
 * 跟 ProductList.tsx 的差異只在於：這裡是純展示用的 Server Component，沒有
 * 搜尋／篩選狀態（那兩個頁面本身就是「某個標籤／分類的結果」，不需要在結果
 * 頁裡再篩一次），卡片本身的視覺／互動（hover 縮放、加入購物車按鈕）完全一致。
 */
export function EditorialProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return <p className="border-t border-[#2b2b2b]/15 py-16 text-center text-sm font-light text-[#8a8a8a]">無符合商品</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2">
      {products.map((product) => (
        <div key={product.id} className="group relative flex flex-col gap-4">
          <div className="ep-hover-zoom relative aspect-[4/3]">
            {product.coverImage ? (
              <Image
                src={product.coverImage.url}
                alt={product.coverImage.alt}
                fill
                sizes="(min-width: 640px) 45vw, 90vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F3F1EB] text-xs text-[#8a8a8a]">
                無商品圖片
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E5C6B]"
            >
              <h2 className="font-[family-name:var(--ep-font-serif)] text-lg font-medium text-[#2b2b2b] group-hover:text-[#3E5C6B]">
                {product.name}
              </h2>
            </Link>
            <p className="line-clamp-2 text-sm font-light leading-[1.8] text-[#4a4a4a]">{product.shortDescription}</p>
            <div className="mt-1 flex flex-wrap items-center gap-4">
              <span className="font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#2b2b2b]">
                NT$ {product.price}
              </span>
              {product.inventoryStatus === "out_of_stock" ? (
                <span className="text-xs tracking-widest text-[#8a8a8a]">缺貨</span>
              ) : null}
            </div>
            <div className="relative z-10 mt-1">
              <AddToCartButton product={product} className={`${editorialButtonLight} min-h-9 w-full px-4 py-2 text-[11px]`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

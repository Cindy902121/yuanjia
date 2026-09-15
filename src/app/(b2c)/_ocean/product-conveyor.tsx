import Image from "next/image";
import Link from "next/link";
import type { ProductDetailData } from "@/lib/types/product";

/** 首頁主打橫幅下的真實商品入口；不是商品卡片，也不顯示價格或促銷資訊。 */
export function ProductConveyor({ products }: { products: ProductDetailData[] }) {
  const items = products.filter((product) => product.coverImage).slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="product-conveyor-title" className="product-conveyor bg-[#EAF4F8]">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 id="product-conveyor-title" className="font-[family-name:var(--ep-font-serif)] text-xl font-light tracking-[0.05em] text-[#0B1620]">
            嚴選海味
          </h2>
          <span className="font-[family-name:var(--ep-font-en)] text-[10px] tracking-[0.28em] text-[#536168]">SEAFOOD SELECTION</span>
        </div>
        <div className="product-conveyor-viewport" tabIndex={0} aria-label="商品輸送帶，移入或聚焦可暫停">
          <div className="product-conveyor-track">
            {items.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="product-conveyor-item group" aria-label={`查看商品：${product.name}`}>
                <span className="product-conveyor-image">
                  <Image src={product.coverImage!.url} alt={product.coverImage!.alt} fill sizes="(min-width: 1024px) 25vw, 48vw" className="object-contain transition-transform duration-500 group-hover:scale-[1.04]" />
                </span>
                <span className="mt-3 block font-[family-name:var(--ep-font-serif)] text-sm font-light tracking-[0.04em] text-[#0B1620] transition-colors group-hover:text-[#A8492F]">{product.name}</span>
              </Link>
            ))}
            <div aria-hidden="true" className="product-conveyor-duplicate">
              {items.map((product) => (
                <span key={product.id} className="product-conveyor-item">
                  <span className="product-conveyor-image">
                    <Image src={product.coverImage!.url} alt="" fill sizes="(min-width: 1024px) 25vw, 48vw" className="object-contain" />
                  </span>
                  <span className="mt-3 block font-[family-name:var(--ep-font-serif)] text-sm font-light tracking-[0.04em] text-[#0B1620]">{product.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

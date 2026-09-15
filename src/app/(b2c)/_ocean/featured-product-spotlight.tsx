import Image from "next/image";
import Link from "next/link";
import type { ProductDetailData } from "@/lib/types/product";
import { FadeInSection } from "@/components/editorial/FadeInSection";

/** Hero 下方的次要主打選品：是一幅編輯式廣告，不是商品卡格線。
 * 保留商品導流資料，但依已確認素材使用家庭餐桌情境圖。 */
export function FeaturedProductSpotlight({ products }: { products: ProductDetailData[] }) {
  const selected =
    products.find((product) => product.slug === "norwegian-salmon-fillet" && product.coverImage) ??
    products.find((product) => product.coverImage);
  if (!selected?.coverImage) return null;

  return (
    <section aria-labelledby="featured-selection-title" className="bg-[#F7FAFB]">
      <FadeInSection className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-stretch px-5 py-10 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-10 lg:py-14">
        <div className="flex flex-col justify-center border-y border-[#0B1620]/15 px-1 py-10 lg:border-r lg:px-8 lg:py-12">
          <span className="font-[family-name:var(--ep-font-en)] text-xs font-light tracking-[0.32em] text-[#536168]">FEATURED SELECTION</span>
          <h2 id="featured-selection-title" className="mt-4 font-[family-name:var(--ep-font-serif)] text-2xl font-light leading-relaxed tracking-[0.04em] text-[#0B1620]">為家的餐桌，<br />留一份剛好的鮮</h2>
          <p className="mt-4 max-w-sm text-sm font-light leading-7 text-[#536168]">從冷鏈送達到日常料理，這次先從兩款適合家庭餐桌的海味開始。</p>
          <p className="mt-5 text-[11px] font-light leading-5 text-[#536168]">商品圖片為近似示意，規格以商品詳情為準。</p>
        </div>
        <div className="grid min-h-[250px] grid-cols-1">
          <Link href={`/products/${selected.slug}`} className="group relative min-h-[250px] overflow-hidden bg-[#EAF4F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#C2401D]" aria-label={`查看主打商品：${selected.name}`}>
            <Image
              src="/family-seafood-spotlight.png"
              alt="一家人在明亮餐桌前享用鮭魚、鮮蝦與蛤蜊料理"
              fill
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="object-cover object-[52%_60%] saturate-[0.9] transition-transform duration-500 group-hover:scale-[1.025] sm:object-[52%_58%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071923]/80 via-[#071923]/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white sm:p-6">
              <div>
                <span className="font-[family-name:var(--ep-font-en)] text-[10px] tracking-[0.28em] text-white/75">01 · 主打選品</span>
                <h3 className="mt-2 font-[family-name:var(--ep-font-serif)] text-lg font-light tracking-[0.04em]">{selected.name}</h3>
              </div>
              <span className="shrink-0 font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-white/90">NT$ {selected.price} ↗</span>
            </div>
          </Link>
        </div>
      </FadeInSection>
    </section>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { B2BCatalogData, B2BProduct } from "@/lib/b2b/catalog";

type VariantKey = "a" | "b" | "c";

type CatalogWireframePrototypeProps = {
  catalog: B2BCatalogData;
  companyName: string;
  variant: VariantKey;
};

const variants: Array<{ key: VariantKey; label: string }> = [
  { key: "a", label: "A — 採購工作台" },
  { key: "b", label: "B — 規格比較表" },
  { key: "c", label: "C — 引導式選品" },
];

function sampleProducts(products: B2BProduct[]) {
  return products.slice(0, 4);
}

function ProductPlaceholder() {
  return (
    <div className="flex aspect-[4/3] items-end rounded-xl bg-[#DCEBF2] p-3" aria-hidden="true">
      <span className="rounded bg-white/80 px-2 py-1 text-xs font-bold text-[#536168]">商品圖片</span>
    </div>
  );
}

function InquiryPanel({ selected }: { selected: B2BProduct[] }) {
  return (
    <aside className="rounded-2xl border-2 border-dashed border-[#76A7C4] bg-[#F4FAFD] p-5">
      <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">WIRE-FRAME · 詢價單</p>
      <h2 className="mt-2 text-lg font-bold">已選 {selected.length} 項</h2>
      {selected.length ? (
        <ul className="mt-4 space-y-3 border-y border-[#CFE3F0] py-4 text-sm">
          {selected.map((product) => (
            <li key={product.id}>
              <p className="font-semibold">{product.name}</p>
              <p className="mt-1 text-[#536168]">規格：{product.specification}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg bg-white p-3 text-sm leading-6 text-[#536168]">從商品列表選擇規格後，品項會集中在這裡。</p>
      )}
      <div className="mt-5 space-y-2 text-sm text-[#536168]">
        <p>□ 預估需求量</p>
        <p>□ 希望交期</p>
        <p>□ 使用通路／用途</p>
        <p>□ 配送地區與備註</p>
      </div>
      <button className="mt-5 min-h-12 w-full rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white" type="button">
        送出詢價需求
      </button>
      <p className="mt-3 text-xs leading-5 text-[#536168]">送出後由負責業務確認規格、供應與報價；不是訂單或結帳。</p>
    </aside>
  );
}

function VariantA({ products, onSelect, selected }: { onSelect: (product: B2BProduct) => void; products: B2BProduct[]; selected: B2BProduct[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[14rem_1fr_17rem]">
      <aside className="rounded-2xl border-2 border-dashed border-[#AABDC7] bg-white p-5">
        <p className="text-xs font-bold tracking-[0.14em] text-[#536168]">篩選條件</p>
        <div className="mt-4 space-y-4 text-sm">
          {[
            ["商品分類", "魚類、蝦蟹、調理食品"],
            ["加工／分切", "菲力、切片、去刺"],
            ["包裝規格", "重量、箱容"],
            ["產地", "原料／加工產地"],
            ["使用情境", "餐飲、團膳、量販"],
          ].map(([title, description]) => (
            <div className="border-b border-[#D9E1E5] pb-3" key={title}>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-5 text-[#536168]">{description}</p>
            </div>
          ))}
        </div>
      </aside>
      <section>
        <div className="rounded-2xl border-2 border-dashed border-[#76A7C4] bg-[#EAF5FB] p-5">
          <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">A · 快速找貨</p>
          <h1 className="mt-2 text-2xl font-bold">從品名、代碼或規格開始找</h1>
          <div className="mt-4 rounded-lg border border-[#76A7C4] bg-white px-4 py-3 text-sm text-[#536168]">⌕ 例如：鮭魚菲力、150/200g、去皮</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["常詢商品", "魚類", "餐飲用", "冷凍", "產地認證"].map((label) => (
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#005DAA]" key={label}>{label}</span>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <article className="rounded-2xl border-2 border-dashed border-[#AABDC7] bg-white p-4" key={product.id}>
              <ProductPlaceholder />
              <p className="mt-3 text-xs font-bold text-[#005DAA]">{product.productCode}</p>
              <h2 className="mt-1 font-bold">{product.name}</h2>
              <p className="mt-2 text-sm text-[#536168]">{product.origin} · {product.specification}</p>
              <p className="mt-1 text-sm text-[#536168]">箱容：{product.packaging ?? "詳見規格"}</p>
              <button className="mt-4 min-h-11 w-full rounded-lg border border-[#005DAA] px-3 text-sm font-bold text-[#005DAA]" onClick={() => onSelect(product)} type="button">
                選擇規格
              </button>
            </article>
          ))}
        </div>
      </section>
      <InquiryPanel selected={selected} />
    </div>
  );
}

function VariantB({ products, onSelect, selected }: { onSelect: (product: B2BProduct) => void; products: B2BProduct[]; selected: B2BProduct[] }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border-2 border-dashed border-[#76A7C4] bg-[#EAF5FB] p-5">
        <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">B · 比較後再選</p>
        <h1 className="mt-2 text-2xl font-bold">規格比較型錄</h1>
        <p className="mt-2 text-sm text-[#536168]">適合業務客戶一次檢視同類商品的規格與箱容。</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#005DAA]">
          <span className="rounded bg-white px-3 py-2">魚類 ×</span><span className="rounded bg-white px-3 py-2">冷凍 ×</span><span className="rounded bg-white px-3 py-2">餐飲用 ×</span>
        </div>
      </section>
      <div className="overflow-x-auto rounded-2xl border-2 border-dashed border-[#AABDC7] bg-white">
        <table className="min-w-[780px] w-full text-left text-sm">
          <thead className="bg-[#F7F6F2] text-xs tracking-wide text-[#536168]"><tr><th className="p-4">商品</th><th className="p-4">規格／分切</th><th className="p-4">箱容</th><th className="p-4">產地</th><th className="p-4">用途標籤</th><th className="p-4">操作</th></tr></thead>
          <tbody>
            {products.map((product) => (<tr className="border-t border-[#D9E1E5]" key={product.id}><td className="p-4"><p className="font-bold">{product.name}</p><p className="mt-1 text-xs text-[#005DAA]">{product.productCode}</p></td><td className="p-4">{product.specification}</td><td className="p-4">{product.packaging ?? "詳見規格"}</td><td className="p-4">{product.origin}</td><td className="p-4"><span className="rounded bg-[#EAF5FB] px-2 py-1 text-xs text-[#005DAA]">{product.category}</span></td><td className="p-4"><button className="rounded-lg border border-[#005DAA] px-3 py-2 font-bold text-[#005DAA]" onClick={() => onSelect(product)} type="button">選此規格</button></td></tr>))}
          </tbody>
        </table>
      </div>
      <InquiryPanel selected={selected} />
    </div>
  );
}

function VariantC({ products, onSelect, selected }: { onSelect: (product: B2BProduct) => void; products: B2BProduct[]; selected: B2BProduct[] }) {
  const featured = products[0];
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      <section className="space-y-5">
        <div className="rounded-2xl border-2 border-dashed border-[#76A7C4] bg-[#EAF5FB] p-5">
          <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">C · 依需求選品</p>
          <h1 className="mt-2 text-2xl font-bold">您這次想找哪一種商品？</h1>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["1 商品種類", "2 使用情境", "3 包裝規格"].map((step, index) => <div className={index === 0 ? "rounded-xl bg-[#005DAA] p-4 text-sm font-bold text-white" : "rounded-xl border border-[#AABDC7] bg-white p-4 text-sm font-bold"} key={step}>{step}</div>)}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {["魚類", "蝦蟹類", "調理食品"].map((category) => <button className="min-h-28 rounded-2xl border-2 border-dashed border-[#AABDC7] bg-white p-4 text-left font-bold" key={category} type="button"><span className="block text-xs text-[#536168]">品類入口</span><span className="mt-2 block text-lg">{category}</span></button>)}
        </div>
        {featured ? <article className="rounded-2xl border-2 border-dashed border-[#AABDC7] bg-white p-5"><p className="text-xs font-bold text-[#005DAA]">依目前條件推薦</p><div className="mt-3 grid gap-4 sm:grid-cols-[11rem_1fr]"><ProductPlaceholder /><div><h2 className="text-xl font-bold">{featured.name}</h2><p className="mt-2 text-sm leading-6 text-[#536168]">{featured.description || "此區用於呈現完整產品特色與適用情境。"}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-[#536168]">規格</dt><dd className="mt-1 font-semibold">{featured.specification}</dd></div><div><dt className="text-xs text-[#536168]">箱容</dt><dd className="mt-1 font-semibold">{featured.packaging ?? "詳見規格"}</dd></div></dl><button className="mt-5 min-h-11 rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white" onClick={() => onSelect(featured)} type="button">選擇規格，加入詢價單</button></div></div></article> : null}
      </section>
      <InquiryPanel selected={selected} />
    </div>
  );
}

function PrototypeSwitcher({ variant, selectedCount }: { selectedCount: number; variant: VariantKey }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeIndex = variants.findIndex((item) => item.key === variant);
  const go = (direction: -1 | 1) => {
    const next = variants[(activeIndex + direction + variants.length) % variants.length];
    const params = new URLSearchParams(searchParams.toString());
    params.set("prototype", next.key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target instanceof HTMLElement && event.target.isContentEditable)) return;
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  if (process.env.NODE_ENV === "production") return null;
  return <div className="fixed inset-x-0 bottom-5 z-50 mx-auto flex w-fit items-center gap-3 rounded-full bg-[#17242A] px-3 py-2 text-sm text-white shadow-2xl"><button aria-label="上一個草圖" className="grid size-9 place-items-center rounded-full bg-white/15" onClick={() => go(-1)} type="button">←</button><span className="min-w-40 text-center font-bold">{variants[activeIndex].label}</span><span className="rounded bg-white/15 px-2 py-1 text-xs">已選 {selectedCount}</span><button aria-label="下一個草圖" className="grid size-9 place-items-center rounded-full bg-white/15" onClick={() => go(1)} type="button">→</button></div>;
}

export default function CatalogWireframePrototype({ catalog, companyName, variant }: CatalogWireframePrototypeProps) {
  const products = useMemo(() => sampleProducts(catalog.products), [catalog.products]);
  const [selected, setSelected] = useState<B2BProduct[]>([]);
  const onSelect = (product: B2BProduct) => setSelected((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
  const shared = { onSelect, products, selected };

  return <main className="min-h-screen bg-[#F7F6F2] px-5 py-8 pb-28 text-[#17242A]" style={{ fontFamily: '"Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif' }}><div className="mx-auto max-w-[1280px]"><header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-dashed border-[#AABDC7] pb-5"><div><p className="text-xs font-bold tracking-[0.16em] text-[#005DAA]">THROWAWAY PROTOTYPE · B2B CATALOG</p><p className="mt-2 text-sm text-[#536168]">{companyName}／僅驗證型錄資訊架構，沒有價格、庫存或實際送單功能。</p></div><Link className="text-sm font-bold text-[#005DAA] underline" href="/business/catalog">返回目前型錄</Link></header>{variant === "a" ? <VariantA {...shared} /> : null}{variant === "b" ? <VariantB {...shared} /> : null}{variant === "c" ? <VariantC {...shared} /> : null}</div><PrototypeSwitcher selectedCount={selected.length} variant={variant} /></main>;
}

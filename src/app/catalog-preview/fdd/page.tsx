"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Product = {
  code: string;
  name: string;
  category: string;
  brand: string;
  specification: string;
  packaging: string;
  origin: string;
  storage: string;
  tags: string[];
};

const groups = [
  { name: "食材", tags: ["魚類", "蝦蟹類", "貝類", "軟體類", "肉類", "調理食品"] },
  { name: "加工／規格", tags: ["切片", "切塊", "調味", "整尾", "原料"] },
  { name: "用途", tags: ["餐飲料理", "零售販售", "團膳／大量供應"] },
  { name: "保存／包裝", tags: ["冷凍", "箱裝"] },
] as const;

const products: Product[] = [
  { code: "B2B-FISH-001", name: "智利鮭魚切片", category: "魚類", brand: "元家", specification: "200g／片", packaging: "20片／箱", origin: "智利", storage: "冷凍 -18°C 以下", tags: ["魚類", "切片", "餐飲料理", "零售販售", "冷凍", "箱裝"] },
  { code: "B2B-FISH-002", name: "午仔魚整尾", category: "魚類", brand: "元家", specification: "450–550g／尾", packaging: "10尾／箱", origin: "台灣", storage: "冷凍 -18°C 以下", tags: ["魚類", "整尾", "餐飲料理", "團膳／大量供應", "冷凍", "箱裝"] },
  { code: "B2B-SHRIMP-001", name: "白蝦原料", category: "蝦蟹類", brand: "元家", specification: "31／40 尾／磅", packaging: "1kg × 10包／箱", origin: "厄瓜多", storage: "冷凍 -18°C 以下", tags: ["蝦蟹類", "原料", "餐飲料理", "團膳／大量供應", "冷凍", "箱裝"] },
  { code: "B2B-SHELL-001", name: "熟凍扇貝", category: "貝類", brand: "元家", specification: "20／30 規格", packaging: "5kg／箱", origin: "日本", storage: "冷凍 -18°C 以下", tags: ["貝類", "調味", "餐飲料理", "零售販售", "冷凍", "箱裝"] },
  { code: "B2B-SQUID-001", name: "花枝切塊", category: "軟體類", brand: "元家", specification: "3–5cm", packaging: "1kg × 10包／箱", origin: "越南", storage: "冷凍 -18°C 以下", tags: ["軟體類", "切塊", "餐飲料理", "團膳／大量供應", "冷凍", "箱裝"] },
  { code: "B2B-READY-001", name: "日式蒲燒鯛魚", category: "調理食品", brand: "元家", specification: "200g／包", packaging: "20包／箱", origin: "台灣", storage: "冷凍 -18°C 以下", tags: ["調理食品", "調味", "零售販售", "冷凍", "箱裝"] },
];

export default function FddCatalogPreviewPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [brand, setBrand] = useState("全部品牌");
  const [items, setItems] = useState<Product[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);

  const visible = useMemo(() => products.filter((product) => {
    const text = `${product.code} ${product.name} ${product.category} ${product.brand} ${product.specification} ${product.packaging}`.toLowerCase();
    return (!query || text.includes(query.trim().toLowerCase()))
      && (brand === "全部品牌" || product.brand === brand)
      && selected.every((tag) => product.tags.includes(tag));
  }), [brand, query, selected]);
  const toggle = (tag: string) => setSelected((old) => old.includes(tag) ? old.filter((item) => item !== tag) : [...old, tag]);
  const add = (product: Product) => { setItems((old) => old.some((item) => item.code === product.code) ? old : [...old, product]); setDrawer(true); };

  return <main className="min-h-screen bg-[#f7f6f2] text-[#18262d]" style={{ fontFamily: '"Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif' }}>
    <header className="sticky top-0 z-40 border-b border-[#d8e0e2] bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-5 py-3 lg:px-8"><div><p className="hidden text-xs font-bold tracking-[.18em] text-[#0062aa] sm:block">YUANJIA BUSINESS</p><h1 className="text-base font-bold sm:text-xl">元家 B2B・企業型錄</h1></div><div className="flex items-center gap-2"><Link className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[#47616d] hover:bg-[#edf5f8] sm:block" href="/catalog-preview">原版預覽</Link><span className="hidden rounded-lg bg-[#e9f4fa] px-3 py-2 text-sm font-bold text-[#0062aa] sm:block">FDD 對照版</span><button className="rounded-lg border border-[#91b9ce] bg-[#f5fbfe] px-3 py-2 text-sm font-bold text-[#0062aa]" onClick={() => setDrawer(true)} type="button">詢價單{items.length ? `（${items.length}）` : ""}</button></div></div></header>
    <section className="border-b border-[#253b43] bg-[#16282f]"><div className="mx-auto max-w-[1400px] px-5 py-9 lg:px-8"><p className="text-xs font-bold tracking-[.16em] text-[#b8dceb]">FDD-ALIGNED CATALOG</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-3xl font-bold text-white">企業產品型錄</h2><p className="mt-2 text-sm text-[#d1e4eb]">FDD 已定義的標籤群組，供企業採購條件交叉篩選。</p></div><Link className="rounded-lg border border-[#82b3ca] px-4 py-2 text-sm font-bold text-white hover:bg-white/10" href="/catalog-preview">查看原版（含系列／魚種）</Link></div></div></section>
    <div className="mx-auto max-w-[1400px] px-5 py-7 lg:px-8"><div className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-xl border border-[#d9e1e4] bg-white p-5 shadow-sm lg:sticky lg:top-20"><p className="text-xs font-bold tracking-[.14em] text-[#0062aa]">FDD FILTERS</p><h2 className="mt-2 text-lg font-bold">篩選商品</h2><label className="mt-5 block text-sm font-bold">關鍵字<input className="mt-2 min-h-10 w-full rounded-lg border border-[#c9d7dc] px-3 text-sm font-normal outline-none focus:border-[#0062aa] focus:ring-4 focus:ring-[#e6f3f9]" placeholder="品名、品號、規格或包裝" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="mt-4 block text-sm font-bold">品牌<select className="mt-2 min-h-10 w-full rounded-lg border border-[#c9d7dc] bg-white px-3 text-sm font-normal" value={brand} onChange={(event) => setBrand(event.target.value)}><option>全部品牌</option><option>元家</option></select></label>
        {groups.map((group) => <section className="mt-5 border-t border-[#e2e8ea] pt-4" key={group.name}><h3 className="text-sm font-bold">{group.name}</h3><div className="mt-3 space-y-2">{group.tags.map((tag) => <label className="flex cursor-pointer items-center gap-2 text-sm text-[#40535c]" key={tag}><input checked={selected.includes(tag)} className="size-4 accent-[#0062aa]" onChange={() => toggle(tag)} type="checkbox" />{tag}</label>)}</div></section>)}
        <button className="mt-5 min-h-10 w-full rounded-lg border border-[#b7cbd5] text-sm font-bold text-[#43606c]" onClick={() => { setQuery(""); setBrand("全部品牌"); setSelected([]); }} type="button">清除篩選</button></aside>
      <section><div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d9e1e4] pb-4"><div><p className="text-xs font-bold tracking-[.14em] text-[#0062aa]">RESULTS</p><h2 className="mt-1 text-2xl font-bold">符合條件的商品</h2><p className="mt-2 text-sm text-[#52656d]">{selected.length ? `已套用：${selected.join("、")}` : "尚未設定標籤條件"}</p></div><p className="text-sm font-bold text-[#00538f]">展示 {visible.length} 項／共 2,000+ 項商品</p></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((product) => <article className="overflow-hidden rounded-xl border border-[#d9e1e4] bg-white shadow-sm" key={product.code}><div className="flex aspect-[16/7] items-end bg-[linear-gradient(135deg,#e2f2f8,#f4fafb)] p-4"><span className="rounded-full border border-[#9ec4d7] bg-white px-3 py-1.5 text-xs font-bold text-[#0062aa]">{product.category}</span></div><div className="p-4"><p className="text-xs font-bold tracking-[.08em] text-[#0062aa]">{product.code}</p><h3 className="mt-2 text-lg font-bold">{product.name}</h3><p className="mt-1 text-sm text-[#52656d]">{product.brand}・{product.category}</p><dl className="mt-4 grid gap-2 border-t border-[#e2e8ea] pt-3 text-sm"><div className="grid grid-cols-[3rem_1fr]"><dt className="font-semibold text-[#52656d]">規格</dt><dd>{product.specification}</dd></div><div className="grid grid-cols-[3rem_1fr]"><dt className="font-semibold text-[#52656d]">包裝</dt><dd>{product.packaging}</dd></div><div className="grid grid-cols-[3rem_1fr]"><dt className="font-semibold text-[#52656d]">產地</dt><dd>{product.origin}</dd></div></dl><div className="mt-4 flex flex-wrap gap-1.5">{product.tags.slice(0, 3).map((tag) => <span className="rounded-full bg-[#edf5f8] px-2 py-1 text-xs font-semibold text-[#386275]" key={tag}>{tag}</span>)}</div><div className="mt-4 grid grid-cols-2 gap-2"><button className="min-h-10 rounded-lg border border-[#8fb9ce] text-sm font-bold text-[#0062aa]" onClick={() => setDetail(product)} type="button">查看細項</button><button className="min-h-10 rounded-lg bg-[#0062aa] text-sm font-bold text-white" onClick={() => add(product)} type="button">加入詢價單</button></div></div></article>)}{!visible.length && <div className="rounded-xl border border-dashed border-[#b8cbd3] bg-white p-10 text-center text-sm text-[#52656d] sm:col-span-2 xl:col-span-3">沒有符合的展示商品。可清除篩選，或改用 FDD 中的其他標籤。</div>}</div></section>
    </div></div>
    {detail && <div className="fixed inset-0 z-50 grid place-items-center bg-[#17252c]/45 p-4"><section aria-modal="true" className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl" role="dialog"><div className="flex justify-between gap-4"><div><p className="text-xs font-bold tracking-[.14em] text-[#0062aa]">PRODUCT DETAIL</p><h2 className="mt-2 text-2xl font-bold">{detail.name}</h2><p className="mt-1 text-sm text-[#52656d]">{detail.code}・{detail.brand}</p></div><button aria-label="關閉細項" className="text-2xl text-[#52656d]" onClick={() => setDetail(null)} type="button">×</button></div><dl className="mt-6 grid gap-3 border-y border-[#e2e8ea] py-4 text-sm"><div className="grid grid-cols-[5rem_1fr]"><dt className="font-bold">分類</dt><dd>{detail.category}</dd></div><div className="grid grid-cols-[5rem_1fr]"><dt className="font-bold">規格</dt><dd>{detail.specification}</dd></div><div className="grid grid-cols-[5rem_1fr]"><dt className="font-bold">包裝</dt><dd>{detail.packaging}</dd></div><div className="grid grid-cols-[5rem_1fr]"><dt className="font-bold">產地</dt><dd>{detail.origin}</dd></div><div className="grid grid-cols-[5rem_1fr]"><dt className="font-bold">保存</dt><dd>{detail.storage}</dd></div></dl><p className="mt-4 text-sm leading-6 text-[#52656d]">價格、供應狀況與交期由所屬業務確認。本預覽僅展示 FDD 的型錄欄位與標籤篩選方式。</p><button className="mt-5 min-h-11 w-full rounded-lg bg-[#0062aa] text-sm font-bold text-white" onClick={() => { add(detail); setDetail(null); }} type="button">加入詢價單</button></section></div>}
    {drawer && <div className="fixed inset-0 z-50 flex justify-end bg-[#17252c]/35"><aside aria-label="詢價單" className="h-full w-full max-w-md bg-white p-6 shadow-2xl"><div className="flex justify-between border-b border-[#d9e1e4] pb-5"><div><p className="text-xs font-bold tracking-[.14em] text-[#0062aa]">INQUIRY LIST</p><h2 className="mt-2 text-2xl font-bold">詢價單</h2></div><button aria-label="關閉詢價單" className="text-2xl" onClick={() => setDrawer(false)} type="button">×</button></div>{items.length ? <ul className="divide-y divide-[#e2e8ea]">{items.map((item) => <li className="flex items-start justify-between gap-4 py-4" key={item.code}><div><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-[#52656d]">{item.specification}・{item.packaging}</p></div><button className="text-sm font-bold text-[#0062aa]" onClick={() => setItems((old) => old.filter((entry) => entry.code !== item.code))} type="button">移除</button></li>)}</ul> : <p className="py-10 text-center text-sm text-[#52656d]">尚未選擇商品，可關閉後繼續瀏覽。</p>}<button className="mt-5 min-h-11 w-full rounded-lg border border-[#b7cbd5] text-sm font-bold text-[#52656d]" onClick={() => setDrawer(false)} type="button">繼續瀏覽商品</button><p className="mt-4 text-xs leading-5 text-[#52656d]">此為視覺對照預覽；詢價送出流程依本週排程於下一階段完成。</p></aside></div>}
  </main>;
}

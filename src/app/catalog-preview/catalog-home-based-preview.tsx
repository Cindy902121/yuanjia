"use client";

import { useState } from "react";

type Product = {
  code: string;
  name: string;
  category: string;
  series: string;
  specification: string;
  packaging: string;
  origin: string;
};

const categoryTree = [
  { name: "魚類", children: ["鮭魚系列", "石斑系列", "整尾魚", "魚類加工", "魚類調味", "魚卵／魚子"] },
  { name: "蝦蟹類", children: ["蝦仁", "白蝦", "草蝦", "蟹類"] },
  { name: "貝類", children: ["干貝", "牡蠣", "蛤蜊", "鮑魚"] },
  { name: "軟體類", children: ["花枝", "魷魚", "章魚"] },
  { name: "肉類", children: ["雞肉", "豬肉", "牛肉"] },
  { name: "調理食品類", children: ["湯品", "調味", "裹粉酥炸"] },
] as const;

const products: Product[] = [
  { code: "B2B-FISH-001", name: "智利鮭魚切片", category: "魚類", series: "鮭魚系列", specification: "200g／片", packaging: "20片／箱", origin: "智利" },
  { code: "B2B-FISH-002", name: "午仔魚整尾", category: "魚類", series: "整尾魚", specification: "450–550g／尾", packaging: "10尾／箱", origin: "台灣" },
  { code: "B2B-FISH-003", name: "鯛魚菲力", category: "魚類", series: "魚類加工", specification: "120–150g／片", packaging: "10kg／箱", origin: "台灣" },
  { code: "B2B-SHELL-001", name: "熟凍扇貝", category: "貝類", series: "干貝", specification: "20／30規格", packaging: "5kg／箱", origin: "日本" },
];

export default function CatalogHomeBasedPreview() {
  const [category, setCategory] = useState("魚類");
  const [series, setSeries] = useState("全部");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const current = categoryTree.find((item) => item.name === category) ?? categoryTree[0];
  const shownProducts = products.filter((product) => {
      const byCategory = product.category === category;
      const bySeries = series === "全部" || product.series === series;
      const term = query.trim().toLocaleLowerCase("zh-Hant");
      const byQuery = !term || [product.code, product.name, product.specification, product.packaging].join(" ").toLocaleLowerCase("zh-Hant").includes(term);
      return byCategory && bySeries && byQuery;
  });

  function pickCategory(next: string) {
    setCategory(next);
    setSeries("全部");
  }

  function add(product: Product) {
    setItems((currentItems) => currentItems.some((item) => item.code === product.code) ? currentItems : [...currentItems, product]);
  }

  return (
    <main className="min-h-screen bg-[#F7F6F2] text-[#17242A]" style={{ fontFamily: '"Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif' }}>
      <header className="border-b border-[#D9E1E5] bg-white">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 lg:px-8">
          <div><p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">YUANJIA BUSINESS</p><h1 className="mt-1 text-xl font-bold">企業型錄</h1></div>
          <div className="rounded-full border border-[#CFE3F0] bg-[#EAF5FB] px-3 py-1.5 text-sm font-semibold text-[#00457F]">王品餐飲測試企業・企業帳戶</div>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-5 py-7 lg:px-8">
        <div className="mb-5 rounded-2xl border border-[#CFE3F0] bg-[#EAF5FB] px-5 py-5 sm:flex sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold tracking-[.14em] text-[#005DAA]">BUSINESS CATALOG</p><h2 className="mt-2 text-2xl font-bold">企業產品型錄</h2><p className="mt-2 text-sm text-[#00457F]">依品類瀏覽規格、包裝與產地；價格與供應狀況由業務確認。</p></div>
          <p className="mt-3 text-sm font-semibold text-[#00457F] sm:mt-0">共 2,000+ 項商品</p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[14rem_minmax(0,1fr)_18rem]">
          <aside className="h-fit rounded-2xl border border-[#D9E1E5] bg-white p-4 shadow-[0_8px_20px_rgba(23,36,42,.04)] xl:sticky xl:top-5">
            <p className="text-xs font-bold tracking-[.14em] text-[#005DAA]">CATALOG FILTER</p><h3 className="mt-2 text-lg font-bold">篩選商品</h3>
            <label className="mt-5 block text-sm font-semibold">直接搜尋<input className="mt-2 min-h-10 w-full rounded-lg border border-[#CBD8DE] px-3 text-sm outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]" onChange={(event) => setQuery(event.target.value)} placeholder="品名、品號、規格" value={query} /></label>
            <div className="mt-5 border-t border-[#E2E8EB] pt-5"><p className="text-sm font-bold">產品大類</p><div className="mt-2 space-y-1">{categoryTree.map((item) => <button className={`flex min-h-9 w-full items-center justify-between rounded-md px-2 text-left text-sm font-semibold ${category === item.name ? "bg-[#005DAA] text-white" : "text-[#40525A] hover:bg-[#EAF5FB]"}`} key={item.name} onClick={() => pickCategory(item.name)} type="button">{item.name}<span>›</span></button>)}</div></div>
            <div className="mt-5 border-t border-[#E2E8EB] pt-5"><p className="text-sm font-bold">{category}・系列／魚種</p><div className="mt-2 space-y-1"><button className={`min-h-8 w-full rounded-md px-2 text-left text-sm ${series === "全部" ? "bg-[#EAF5FB] font-bold text-[#005DAA]" : "text-[#536168]"}`} onClick={() => setSeries("全部")} type="button">全部</button>{current.children.map((child) => <button className={`min-h-8 w-full rounded-md px-2 text-left text-sm ${series === child ? "bg-[#EAF5FB] font-bold text-[#005DAA]" : "text-[#536168] hover:bg-[#F4FAFD]"}`} key={child} onClick={() => setSeries(child)} type="button">{child}</button>)}</div></div>
            <details className="mt-5 border-t border-[#E2E8EB] pt-4"><summary className="cursor-pointer text-sm font-bold">更多採購條件</summary><div className="mt-3 space-y-2 text-sm text-[#536168]"><label className="block"><input className="mr-2" type="checkbox" />切片／菲力</label><label className="block"><input className="mr-2" type="checkbox" />冷凍保存</label><label className="block"><input className="mr-2" type="checkbox" />箱裝</label></div></details>
          </aside>

          <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D6E8F2] bg-white px-4 py-3"><div><p className="text-xs font-bold tracking-[.12em] text-[#005DAA]">目前瀏覽</p><h3 className="mt-1 font-bold">{category}{series === "全部" ? "" : ` ＞ ${series}`}</h3></div><p className="text-sm text-[#536168]">找到 {shownProducts.length} 項展示商品</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {shownProducts.map((product) => <article className="overflow-hidden rounded-2xl border border-[#D9E1E5] bg-white shadow-[0_6px_18px_rgba(23,36,42,.04)]" key={product.code}><div className="relative grid aspect-[16/8] place-items-center overflow-hidden bg-[#EAF5FB]"><div className="absolute -right-6 -top-8 size-32 rounded-full border-[18px] border-[#CFE3F0]" /><span className="relative rounded-full border border-[#9DC6DD] bg-white px-3 py-2 text-sm font-bold text-[#005DAA]">{product.category}</span><p className="absolute bottom-3 left-3 text-[10px] font-bold tracking-[.14em] text-[#536168]">PRODUCT REFERENCE</p></div><div className="p-4"><p className="text-xs font-bold tracking-[.08em] text-[#005DAA]">{product.code}</p><h4 className="mt-2 text-lg font-bold">{product.name}</h4><p className="mt-1 text-sm text-[#536168]">元家・{product.series}</p><dl className="mt-4 grid gap-2 border-t border-[#E2E8EB] pt-3 text-sm"><div className="grid grid-cols-[3rem_1fr]"><dt className="font-semibold text-[#536168]">規格</dt><dd>{product.specification}</dd></div><div className="grid grid-cols-[3rem_1fr]"><dt className="font-semibold text-[#536168]">包裝</dt><dd>{product.packaging}</dd></div><div className="grid grid-cols-[3rem_1fr]"><dt className="font-semibold text-[#536168]">產地</dt><dd>{product.origin}</dd></div></dl><button className="mt-4 min-h-10 w-full rounded-lg bg-[#005DAA] text-sm font-bold text-white hover:bg-[#00457F]" onClick={() => add(product)} type="button">加入詢價單</button></div></article>)}
              {!shownProducts.length && <div className="rounded-xl border border-dashed border-[#B9CCD5] bg-white p-10 text-center text-sm text-[#536168]">此篩選條件暫無展示商品，請改選其他系列或清除搜尋文字。</div>}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-[#B9D5E5] bg-white p-5 shadow-[0_10px_24px_rgba(0,93,170,.07)] xl:sticky xl:top-5"><div className="flex items-start justify-between border-b border-[#D9E1E5] pb-4"><div><p className="text-xs font-bold tracking-[.14em] text-[#005DAA]">INQUIRY LIST</p><h3 className="mt-2 text-xl font-bold">詢價單</h3></div><span className="rounded-full bg-[#005DAA] px-2.5 py-1 text-xs font-bold text-white">{items.length}</span></div>{items.length ? <ul className="divide-y divide-[#E2E8EB]">{items.map((item) => <li className="py-4" key={item.code}><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-[#536168]">{item.specification}・{item.packaging}</p><button className="mt-2 text-xs font-bold text-[#005DAA]" onClick={() => setItems((currentItems) => currentItems.filter((entry) => entry.code !== item.code))} type="button">移除</button></li>)}</ul> : <div className="py-9 text-center"><div className="mx-auto grid size-11 place-items-center rounded-full bg-[#EAF5FB] text-xl text-[#005DAA]">＋</div><p className="mt-3 text-sm font-semibold">尚未選擇商品</p><p className="mt-2 text-xs leading-5 text-[#536168]">從型錄挑選品項，集中提交給業務報價。</p></div>}<label className="mt-4 block border-t border-[#D9E1E5] pt-4 text-sm font-bold">補充需求<textarea className="mt-2 min-h-20 w-full rounded-lg border border-[#B9CCD5] p-2 text-sm font-normal" placeholder="交期、配送地點、用途等" /></label><button className="mt-3 min-h-11 w-full rounded-lg bg-[#005DAA] text-sm font-bold text-white disabled:bg-[#A2B5BF]" disabled={!items.length} type="button">確認詢價內容</button><p className="mt-3 text-xs leading-5 text-[#536168]">送出後由所屬業務確認價格、供應與交期；此頁不顯示即時價格或庫存。</p></aside>
        </div>
      </div>
    </main>
  );
}

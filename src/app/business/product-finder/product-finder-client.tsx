"use client";

import { useState } from "react";
import { B2B_FINDER_CONDITIONS } from "@/lib/product-finder";

const labels: Record<string, string> = {
  "b2b-fish": "魚類", "b2b-shrimp": "蝦蟹類", "b2b-shellfish": "貝類", "processed-food": "調理食品",
  "raw-material": "原料", "whole-fish": "整尾", fillet: "切片", "cut-piece": "切塊", seasoned: "調味",
  restaurant: "餐飲料理", retail: "零售販售", "bulk-supply": "團膳／大量供應", frozen: "冷凍保存",
  "pack-5kg": "5kg／箱", "pack-10kg": "10kg／箱",
};

export default function ProductFinderClient() {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<{ products: Array<{ id: string; product_code: string; name: string; specification: string; packaging: string | null }>; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const toggle = (key: string) => setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  async function search() {
    setLoading(true); setResult(null);
    const response = await fetch(`/api/b2b/product-finder?conditions=${encodeURIComponent(selected.join(","))}`);
    const body = await response.json();
    setResult(response.ok ? body : { products: [], error: body.error ?? "篩選失敗，請稍後再試。" });
    setLoading(false);
  }
  return <section className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
    <aside className="rounded-2xl border border-[#C9D8DE] bg-white p-5"><h2 className="font-bold">選擇需求</h2><div className="mt-4 space-y-3">{Object.keys(B2B_FINDER_CONDITIONS).map((key) => <label className="flex items-center gap-3 text-sm" key={key}><input checked={selected.includes(key)} onChange={() => toggle(key)} type="checkbox" />{labels[key] ?? key}</label>)}</div><button className="mt-6 min-h-11 w-full rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white disabled:bg-[#A2B5BF]" disabled={loading} onClick={search} type="button">{loading ? "篩選中…" : `套用篩選（${selected.length}）`}</button></aside>
    <div className="rounded-2xl border border-[#C9D8DE] bg-white p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.14em] text-[#005DAA]">RESULTS</p><h2 className="mt-2 text-xl font-bold">符合條件的商品</h2></div><span className="text-sm text-[#536168]">已選 {selected.length} 項</span></div>{result?.error ? <p className="mt-6 rounded-lg bg-[#FFF1F0] p-4 text-sm text-[#B42318]">{result.error}</p> : result ? result.products.length ? <ul className="mt-6 divide-y divide-[#E2E8EB]">{result.products.map((product) => <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={product.id}><div><p className="text-xs font-bold text-[#005DAA]">{product.product_code}</p><p className="mt-1 font-bold">{product.name}</p><p className="mt-1 text-sm text-[#536168]">{product.specification} · {product.packaging ?? "詳見包裝"}</p></div><a className="rounded-lg border border-[#8FB8CD] px-3 py-2 text-sm font-bold text-[#005DAA]" href="/business/catalog">回型錄選擇</a></li>)}</ul> : <p className="mt-6 text-sm text-[#536168]">目前沒有符合條件的商品，請調整條件或回型錄描述需求。</p> : <p className="mt-6 text-sm text-[#536168]">選擇左側條件後套用，系統會使用既有 B2B 需求篩選 API。</p>}</div>
  </section>;
}

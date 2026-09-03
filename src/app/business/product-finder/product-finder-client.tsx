"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";

import { trackEvent } from "@/lib/analytics/track";
import { B2B_FINDER_CHANNELS, type B2bChannel } from "@/lib/product-finder";

type FinderProduct = {
  brand: string;
  category: string;
  id: string;
  images?: Array<{ alt_text: string; image_role: "cover" | "detail"; url: string }>;
  name: string;
  origin: string;
  packaging: string | null;
  product_code: string;
  specification: string;
  storage_method: string;
};

type FinderResult = { products: FinderProduct[]; error?: string };

function channelFor(key: string | null) {
  return B2B_FINDER_CHANNELS.find((channel) => channel.key === key) ?? null;
}

function selectionPath(channel: B2bChannel | null, leafKey: string | null) {
  if (!channel || !leafKey) return "";
  const category = channel.categories?.find((item) => item.key === leafKey);
  return category ? `${channel.label} ＞ ${category.label}` : channel.label;
}

export default function ProductFinderClient() {
  const [primaryChannel, setPrimaryChannel] = useState<string | null>(null);
  const [selectedLeaf, setSelectedLeaf] = useState<string | null>(null);
  const [result, setResult] = useState<FinderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const activeChannel = channelFor(primaryChannel);

  useEffect(() => {
    trackEvent({ event_name: "b2b_product_finder_start" });
  }, []);

  async function loadResults(leafKey: string) {
    setLoading(true);
    setResult(null);
    const response = await fetch(`/api/b2b/product-finder?conditions=${encodeURIComponent(leafKey)}`);
    const body = await response.json().catch(() => ({}));
    setResult(response.ok ? body : { products: [], error: body.error ?? "篩選失敗，請稍後再試。" });
    if (response.ok) trackEvent({ event_name: "b2b_product_finder_complete" });
    setLoading(false);
  }

  function choosePrimary(channel: B2bChannel) {
    trackEvent({
      event_name: "b2b_product_finder_answer",
      event_data: { question_key: "primary_channel", option_id: channel.key },
    });
    setPrimaryChannel(channel.key);
    setSelectedLeaf(null);
    setResult(null);
    if (!channel.categories?.length) {
      setSelectedLeaf(channel.key);
      void loadResults(channel.key);
    }
  }

  function chooseCategory(leafKey: string) {
    trackEvent({
      event_name: "b2b_product_finder_answer",
      event_data: { question_key: "channel_category", option_id: leafKey },
    });
    setSelectedLeaf(leafKey);
    void loadResults(leafKey);
  }

  function reset() {
    setPrimaryChannel(null);
    setSelectedLeaf(null);
    setResult(null);
    setLoading(false);
  }

  const path = selectionPath(activeChannel, selectedLeaf);

  return (
    <section className="mt-8 rounded-2xl border border-[#C9D8DE] bg-white p-5 shadow-[0_10px_24px_rgba(23,36,42,0.04)] sm:p-7">
      {!primaryChannel ? <ChannelStep onChoose={choosePrimary} /> : null}

      {primaryChannel && activeChannel?.categories?.length && !selectedLeaf ? (
        <CategoryStep channel={activeChannel} onBack={reset} onChoose={chooseCategory} />
      ) : null}

      {primaryChannel && selectedLeaf ? (
        <FinderResults
          loading={loading}
          path={path}
          result={result}
          showCategoryBack={Boolean(activeChannel?.categories?.length)}
          onBack={() => { setSelectedLeaf(null); setResult(null); }}
          onReset={reset}
        />
      ) : null}
    </section>
  );
}

function ChannelStep({ onChoose }: { onChoose: (channel: B2bChannel) => void }) {
  return (
    <div>
      <div className="max-w-2xl">
        <p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">STEP 1 OF 2</p>
        <h2 className="mt-2 text-2xl font-bold">您的主要銷售通路是？</h2>
        <p className="mt-2 text-sm leading-6 text-[#536168]">選擇一項主要通路；系統只會推薦已明確標記適用通路的商品。</p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {B2B_FINDER_CHANNELS.map((channel) => (
          <button className="group min-h-32 rounded-xl border border-[#D8E5EA] bg-[#F8FBFC] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#005DAA] hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]" key={channel.key} onClick={() => onChoose(channel)} type="button">
            <span className="text-xs font-bold tracking-[.14em] text-[#005DAA]">CHANNEL</span>
            <span className="mt-3 block text-lg font-bold text-[#17242A]">{channel.label}</span>
            <span className="mt-2 block text-xs leading-5 text-[#536168]">{channel.categories?.length ? "選擇分類" : "直接查看商品"} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryStep({ channel, onBack, onChoose }: { channel: B2bChannel; onBack: () => void; onChoose: (key: string) => void }) {
  return (
    <div>
      <button className="text-sm font-semibold text-[#005DAA] hover:underline" onClick={onBack} type="button">← 返回通路選擇</button>
      <div className="mt-6"><p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">STEP 2 OF 2</p><h2 className="mt-2 text-2xl font-bold">您的通路分類是？</h2><p className="mt-2 text-sm leading-6 text-[#536168]">目前選擇：{channel.label}。選取後立即顯示對應商品。</p></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {channel.categories?.map((category) => <button className="min-h-24 rounded-xl border border-[#D8E5EA] bg-white p-5 text-left text-base font-bold transition hover:border-[#005DAA] hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]" key={category.key} onClick={() => onChoose(category.key)} type="button">{category.label}<span aria-hidden="true" className="ml-2 text-[#005DAA]">→</span></button>)}
      </div>
    </div>
  );
}

function FinderResults({ loading, onBack, onReset, path, result, showCategoryBack }: { loading: boolean; onBack: () => void; onReset: () => void; path: string; result: FinderResult | null; showCategoryBack: boolean }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D8E5EA] pb-5"><div><p className="text-xs font-bold tracking-[.16em] text-[#005DAA]">RESULTS</p><h2 className="mt-2 text-2xl font-bold">適合此通路的商品</h2><p className="mt-2 text-sm text-[#536168]">目前篩選：<span className="font-semibold text-[#17242A]">{path}</span></p></div><div className="flex flex-wrap gap-3">{showCategoryBack ? <button className="min-h-10 rounded-lg border border-[#8FB8CD] px-4 text-sm font-bold text-[#005DAA] hover:bg-[#EAF5FB]" onClick={onBack} type="button">返回分類</button> : null}<button className="min-h-10 rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white hover:bg-[#00457F]" onClick={onReset} type="button">重新選擇</button></div></div>
      {loading ? <div className="py-16 text-center text-sm text-[#536168]" role="status">正在找適合此通路的商品…</div> : result?.error ? <p className="mt-6 rounded-xl bg-[#FFF1F0] p-4 text-sm text-[#B42318]" role="alert">{result.error}</p> : result ? result.products.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{result.products.map((product) => <FinderProductCard key={product.id} product={product} />)}</div> : <EmptyResult onReset={onReset} /> : null}
    </div>
  );
}

function FinderProductCard({ product }: { product: FinderProduct }) {
  const cover = product.images?.find((image) => image.image_role === "cover") ?? product.images?.[0];
  return <article className="overflow-hidden rounded-xl border border-[#D8E5EA] bg-white">{cover ? <img alt={cover.alt_text || `${product.name}商品圖片`} className="aspect-[16/9] w-full object-cover" src={cover.url} /> : <div className="grid aspect-[16/9] place-items-center bg-[#EAF5FB] text-sm font-bold text-[#005DAA]">企業商品</div>}<div className="p-5"><p className="text-xs font-bold tracking-[.1em] text-[#005DAA]">{product.product_code}</p><h3 className="mt-2 text-lg font-bold">{product.name}</h3><p className="mt-1 text-sm text-[#536168]">{product.brand}・{product.category}</p><dl className="mt-4 space-y-2 border-t border-[#E2E8EB] pt-4 text-sm"><div className="grid grid-cols-[3.5rem_1fr] gap-2"><dt className="font-semibold text-[#536168]">規格</dt><dd>{product.specification}</dd></div>{product.packaging ? <div className="grid grid-cols-[3.5rem_1fr] gap-2"><dt className="font-semibold text-[#536168]">包裝</dt><dd>{product.packaging}</dd></div> : null}<div className="grid grid-cols-[3.5rem_1fr] gap-2"><dt className="font-semibold text-[#536168]">產地</dt><dd>{product.origin}</dd></div><div className="grid grid-cols-[3.5rem_1fr] gap-2"><dt className="font-semibold text-[#536168]">保存</dt><dd>{product.storage_method}</dd></div></dl><Link className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#8FB8CD] px-3 text-sm font-bold text-[#005DAA] hover:bg-[#EAF5FB]" href={`/business/catalog?q=${encodeURIComponent(product.product_code)}`} onClick={() => trackEvent({ event_name: "b2b_product_finder_result_click", product_id: product.id, event_data: { product_id: product.id } })}>查看詳情／選擇規格</Link></div></article>;
}

function EmptyResult({ onReset }: { onReset: () => void }) {
  return <div className="mt-6 rounded-xl border border-dashed border-[#B8CBD4] bg-[#F8FBFC] px-5 py-14 text-center"><h3 className="text-lg font-bold">目前尚無適合此通路的推薦商品</h3><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#536168]">您可以重新選擇通路，或前往企業型錄瀏覽完整品項並提出詢價需求。</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button className="min-h-11 rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white hover:bg-[#00457F]" onClick={onReset} type="button">重新選擇</button><Link className="inline-flex min-h-11 items-center rounded-lg border border-[#8FB8CD] px-4 text-sm font-bold text-[#005DAA] hover:bg-[#EAF5FB]" href="/business/catalog">前往企業型錄</Link></div></div>;
}

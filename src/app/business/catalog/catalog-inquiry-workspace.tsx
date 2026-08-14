"use client";

import { useState } from "react";

import type { B2BProduct } from "@/lib/b2b/catalog";

type InquiryItem = {
  product: B2BProduct;
  quantity: number;
};

type CatalogInquiryWorkspaceProps = {
  products: B2BProduct[];
};

function ProductVisual({ product }: { product: B2BProduct }) {
  const marker = product.category.slice(0, 2) || "型錄";

  return (
    <div className="relative grid aspect-[16/9] place-items-center overflow-hidden rounded-xl bg-[#EAF5FB]">
      <div className="absolute -right-6 -top-8 size-32 rounded-full border-[18px] border-[#CFE3F0]" />
      <div className="relative grid size-14 place-items-center rounded-full border border-[#9DC6DD] bg-white text-sm font-bold text-[#005DAA]">
        {marker}
      </div>
      <p className="absolute bottom-3 left-3 text-[11px] font-bold tracking-[0.14em] text-[#536168]">PRODUCT REFERENCE</p>
    </div>
  );
}

function ProductCard({ onChoose, product }: { onChoose: (product: B2BProduct) => void; product: B2BProduct }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#D9E1E5] bg-white shadow-[0_6px_18px_rgba(23,36,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#77AFCF] hover:shadow-[0_14px_28px_rgba(0,93,170,0.1)]">
      <div className="p-4 pb-0">
        <ProductVisual product={product} />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold tracking-[0.08em] text-[#005DAA]">{product.productCode}</p>
          <span className="shrink-0 rounded-full bg-[#EAF5FB] px-2 py-1 text-[11px] font-semibold text-[#005DAA]">企業型錄</span>
        </div>
        <h3 className="mt-3 text-lg font-bold leading-7 text-[#17242A]">{product.name}</h3>
        <p className="mt-1 text-sm text-[#536168]">{product.brand}・{product.category}</p>
        <dl className="mt-4 grid gap-3 border-t border-[#E2E8EB] pt-4 text-sm">
          <div className="grid grid-cols-[3.6rem_1fr] gap-2">
            <dt className="font-semibold text-[#536168]">規格</dt>
            <dd>{product.specification}</dd>
          </div>
          <div className="grid grid-cols-[3.6rem_1fr] gap-2">
            <dt className="font-semibold text-[#536168]">包裝</dt>
            <dd>{product.packaging ?? "詳見商品規格"}</dd>
          </div>
          <div className="grid grid-cols-[3.6rem_1fr] gap-2">
            <dt className="font-semibold text-[#536168]">產地</dt>
            <dd>{product.origin}</dd>
          </div>
        </dl>
        <button
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#005DAA] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]"
          onClick={() => onChoose(product)}
          type="button"
        >
          選擇規格
        </button>
      </div>
    </article>
  );
}

function SpecPicker({ onClose, onConfirm, product }: { onClose: () => void; onConfirm: (quantity: number) => void; product: B2BProduct }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-[#17242A]/45 p-4 sm:place-items-center" role="presentation">
      <section aria-labelledby="spec-picker-title" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">SELECT SPECIFICATION</p>
            <h2 className="mt-2 text-xl font-bold" id="spec-picker-title">{product.name}</h2>
          </div>
          <button aria-label="關閉" className="grid size-10 place-items-center rounded-full text-xl text-[#536168] hover:bg-[#F1F5F7]" onClick={onClose} type="button">×</button>
        </div>
        <div className="mt-6 space-y-3 rounded-xl border border-[#CFE3F0] bg-[#F4FAFD] p-4 text-sm">
          <p><span className="font-semibold text-[#536168]">目前規格：</span>{product.specification}</p>
          <p><span className="font-semibold text-[#536168]">包裝方式：</span>{product.packaging ?? "詳見商品規格"}</p>
          <p><span className="font-semibold text-[#536168]">保存方式：</span>{product.storageMethod}</p>
        </div>
        <label className="mt-6 block text-sm font-semibold" htmlFor="inquiry-quantity">
          預估需求量（箱）
          <input className="mt-2 min-h-12 w-full rounded-lg border border-[#B9CCD5] px-3 text-base outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]" id="inquiry-quantity" min="1" onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} type="number" value={quantity} />
        </label>
        <p className="mt-3 text-xs leading-5 text-[#536168]">實際規格、供應與報價由業務確認；本頁不顯示價格或即時庫存。</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="min-h-12 rounded-lg border border-[#B9CCD5] px-4 text-sm font-bold text-[#536168] hover:border-[#005DAA]" onClick={onClose} type="button">繼續選購</button>
          <button className="min-h-12 rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white hover:bg-[#00457F]" onClick={() => onConfirm(quantity)} type="button">加入詢價單</button>
        </div>
      </section>
    </div>
  );
}

function InquiryPanel({ items, onRemove }: { items: InquiryItem[]; onRemove: (id: string) => void }) {
  return (
    <aside className="rounded-2xl border border-[#B9D5E5] bg-white p-5 shadow-[0_12px_28px_rgba(0,93,170,0.08)] xl:sticky xl:top-6 xl:h-fit">
      <div className="flex items-start justify-between gap-3 border-b border-[#D9E1E5] pb-5">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">INQUIRY LIST</p>
          <h2 className="mt-2 text-xl font-bold">詢價單</h2>
        </div>
        <span className="rounded-full bg-[#005DAA] px-2.5 py-1 text-xs font-bold text-white">{items.length}</span>
      </div>
      {items.length ? (
        <ul className="divide-y divide-[#E2E8EB]">
          {items.map(({ product, quantity }) => (
            <li className="py-4" key={product.id}>
              <div className="flex gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#EAF5FB] text-xs font-bold text-[#005DAA]">{product.category.slice(0, 2)}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-5">{product.name}</p>
                  <p className="mt-1 text-xs leading-5 text-[#536168]">{product.specification}・{quantity} 箱</p>
                </div>
                <button aria-label={`移除 ${product.name}`} className="size-8 rounded text-[#536168] hover:bg-[#FFF1F0] hover:text-[#B42318]" onClick={() => onRemove(product.id)} type="button">×</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#EAF5FB] text-xl text-[#005DAA]">＋</div>
          <p className="mt-3 text-sm font-semibold">尚未選擇商品</p>
          <p className="mt-2 text-xs leading-5 text-[#536168]">從型錄選擇規格後，會集中在這裡一次送出。</p>
        </div>
      )}
      <div className="mt-2 border-t border-[#D9E1E5] pt-5">
        <label className="block text-sm font-semibold" htmlFor="inquiry-note">補充需求</label>
        <textarea className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#B9CCD5] p-3 text-sm outline-none placeholder:text-[#809099] focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]" id="inquiry-note" placeholder="例如：希望交期、配送地區、使用通路" />
        <button className="mt-4 min-h-12 w-full rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#A2B5BF]" disabled={!items.length} type="button">確認詢價內容</button>
        <p className="mt-3 text-xs leading-5 text-[#536168]">確認後將由業務確認規格與報價。此版本尚未連接正式送單服務。</p>
      </div>
    </aside>
  );
}

export default function CatalogInquiryWorkspace({ products }: CatalogInquiryWorkspaceProps) {
  const [chosenProduct, setChosenProduct] = useState<B2BProduct | null>(null);
  const [items, setItems] = useState<InquiryItem[]>([]);

  function addItem(quantity: number) {
    if (!chosenProduct) return;
    setItems((current) => {
      const matched = current.find((item) => item.product.id === chosenProduct.id);
      if (matched) return current.map((item) => item.product.id === chosenProduct.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...current, { product: chosenProduct, quantity }];
    });
    setChosenProduct(null);
  }

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-6">
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D6E8F2] bg-[#F4FAFD] px-4 py-3 text-sm text-[#00457F]">
          <p><span className="font-bold">採購小提醒：</span>先選規格，再集中送出詢價需求。</p>
          <p className="text-xs font-semibold">不顯示價格與即時庫存</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => <ProductCard key={product.id} onChoose={setChosenProduct} product={product} />)}
        </div>
      </section>
      <div className="mt-6 xl:mt-0"><InquiryPanel items={items} onRemove={(id) => setItems((current) => current.filter((item) => item.product.id !== id))} /></div>
      {chosenProduct ? <SpecPicker onClose={() => setChosenProduct(null)} onConfirm={addItem} product={chosenProduct} /> : null}
    </div>
  );
}

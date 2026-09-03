"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { B2BProduct, B2BSpecOption } from "@/lib/b2b/catalog";
import { trackEvent } from "@/lib/analytics/track";
import { INQUIRY_COUNT_EVENT, OPEN_INQUIRY_EVENT } from "./business-header";

type InquiryItem = {
  key: string;
  product: B2BProduct;
  quantity: number;
  selection: SpecificationSelection;
};

type SpecificationSelection =
  | { kind: "option"; option: B2BSpecOption }
  | { kind: "other"; otherPackaging: string; otherSpecification: string };

function selectionKey(product: B2BProduct, selection: SpecificationSelection) {
  if (selection.kind === "option") {
    return `${product.id}:option:${selection.option.id}`;
  }

  return `${product.id}:other:${selection.otherSpecification.trim()}:${selection.otherPackaging.trim()}`;
}

function selectionSpecification(selection: SpecificationSelection) {
  return selection.kind === "option" ? selection.option.specificationText : selection.otherSpecification || "其他規格";
}

function selectionPackaging(selection: SpecificationSelection) {
  return selection.kind === "option" ? selection.option.packagingText : selection.otherPackaging || "其他包裝";
}

type CatalogInquiryWorkspaceProps = {
  products: B2BProduct[];
};

function ProductVisual({ product }: { product: B2BProduct }) {
  const marker = product.category.slice(0, 2) || "型錄";
  const image = demoProductGalleries[product.productCode]?.[0];

  return (
    <div className="relative grid aspect-[16/9] place-items-center overflow-hidden rounded-xl bg-[#EAF5FB]">
      {image ? <Image alt={`${product.name}商品主圖`} className="object-cover" fill sizes="(min-width: 1280px) 24vw, (min-width: 640px) 40vw, 100vw" src={image} /> : <>
        <div className="absolute -right-6 -top-8 size-32 rounded-full border-[18px] border-[#CFE3F0]" />
        <div className="relative grid size-14 place-items-center rounded-full border border-[#9DC6DD] bg-white text-sm font-bold text-[#005DAA]">
          {marker}
        </div>
        <p className="absolute bottom-3 left-3 text-[11px] font-bold tracking-[0.14em] text-[#536168]">PRODUCT REFERENCE</p>
      </>}
    </div>
  );
}

function ProductCard({ onChoose, onDetail, product }: { onChoose: (product: B2BProduct) => void; onDetail: (product: B2BProduct) => void; product: B2BProduct }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#D9E1E5] bg-white shadow-[0_6px_18px_rgba(23,36,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#77AFCF] hover:shadow-[0_14px_28px_rgba(0,93,170,0.1)]">
      <div className="p-4 pb-0">
        <ProductVisual product={product} />
      </div>
      <div className="flex flex-1 flex-col p-5">
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
        {product.specificationOptions.length > 1 ? <p className="mt-3 text-xs font-semibold text-[#005DAA]">可選 {product.specificationOptions.length} 種規格與包裝</p> : null}
        {product.tags.length ? <div className="mt-4 flex flex-wrap gap-1.5">{product.tags.slice(0, 3).map((tag) => <span className="rounded-full bg-[#EAF5FB] px-2 py-1 text-xs font-semibold text-[#386275]" key={tag.slug} title={tag.groupName}>{tag.name}</span>)}</div> : null}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <button className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#8FB8CD] px-3 py-2 text-sm font-bold text-[#005DAA] transition hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]" onClick={() => onDetail(product)} type="button">查看細項</button>
          <button className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#005DAA] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]" onClick={() => onChoose(product)} type="button">選擇規格</button>
        </div>
      </div>
    </article>
  );
}

function ProductDetail({ onClose, onChoose, product }: { onClose: () => void; onChoose: () => void; product: B2BProduct }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-[#17242A]/45 p-4 sm:place-items-center" role="presentation">
      <section aria-labelledby="product-detail-title" aria-modal="true" className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4 border-b border-[#D9E1E5] p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">PRODUCT DETAIL</p>
            <h2 className="mt-2 text-2xl font-bold" id="product-detail-title">{product.name}</h2>
            <p className="mt-1 text-sm text-[#536168]">{product.productCode}・{product.brand}・{product.category}</p>
          </div>
          <button aria-label="關閉商品細項" className="grid size-10 shrink-0 place-items-center rounded-full text-xl text-[#536168] hover:bg-[#F1F5F7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]" onClick={onClose} type="button">×</button>
        </div>
        <div className="grid gap-6 p-5 sm:grid-cols-[.9fr_1.1fr] sm:p-6">
          <ProductGallery product={product} />
          <div>
            <dl className="divide-y divide-[#E2E8EB] border-y border-[#E2E8EB] text-sm">
              <div className="grid grid-cols-[5rem_1fr] gap-3 py-3"><dt className="font-semibold text-[#536168]">規格</dt><dd>{product.specification}</dd></div>
              <div className="grid grid-cols-[5rem_1fr] gap-3 py-3"><dt className="font-semibold text-[#536168]">包裝</dt><dd>{product.packaging ?? "詳見商品規格"}</dd></div>
              <div className="grid grid-cols-[5rem_1fr] gap-3 py-3"><dt className="font-semibold text-[#536168]">產地</dt><dd>{product.origin}</dd></div>
              <div className="grid grid-cols-[5rem_1fr] gap-3 py-3"><dt className="font-semibold text-[#536168]">保存方式</dt><dd>{product.storageMethod}</dd></div>
            </dl>
            <section aria-labelledby="product-description-title" className="mt-5">
              <h3 className="text-sm font-bold text-[#17242A]" id="product-description-title">產品特色</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#536168]">{product.description || "商品相關規格與供應條件，請由業務協助確認。"}</p>
            </section>
            {product.specificationOptions.length ? (
              <section aria-labelledby="specification-table-title" className="mt-5 rounded-xl border border-[#D6E8F2] bg-[#F4FAFD] p-4">
                <h3 className="text-sm font-bold text-[#17242A]" id="specification-table-title">規格明細對照表</h3>
                <div className="mt-2 divide-y divide-[#D6E8F2] text-sm text-[#536168]">
                  {product.specificationOptions.map((option) => <div className="grid grid-cols-[1fr_auto] gap-4 py-2 first:pt-0 last:pb-0" key={option.id}><span>{option.specificationText}</span><span className="text-right">{option.packagingText}</span></div>)}
                </div>
                <p className="mt-3 text-xs leading-5 text-[#536168]">實際可供規格與包裝，請於選擇規格後由業務確認。</p>
              </section>
            ) : null}
            {product.tags.length ? <div className="mt-4 flex flex-wrap gap-1.5">{product.tags.map((tag) => <span className="rounded-full bg-[#EAF5FB] px-2.5 py-1 text-xs font-semibold text-[#386275]" key={tag.slug} title={tag.groupName}>{tag.name}</span>)}</div> : null}
          <p className="mt-4 text-xs leading-5 text-[#536168]">價格、實際供應與交期由業務確認，本頁不顯示即時價格或庫存。</p>
            <button className="mt-5 min-h-12 w-full rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]" onClick={onChoose} type="button">選擇規格，加入詢價單</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SpecPicker({ onClose, onConfirm, product }: { onClose: () => void; onConfirm: (quantity: number, selection: SpecificationSelection) => void; product: B2BProduct }) {
  const firstOption = product.specificationOptions[0];
  const [quantity, setQuantity] = useState(1);
  const [selectionMode, setSelectionMode] = useState<"option" | "other">(firstOption ? "option" : "other");
  const [selectedOptionId, setSelectedOptionId] = useState(firstOption?.id ?? "");
  const [otherSpecification, setOtherSpecification] = useState("");
  const [otherPackaging, setOtherPackaging] = useState("");
  const selectedOption = product.specificationOptions.find((option) => option.id === selectedOptionId);
  const canConfirm = selectionMode === "option" ? Boolean(selectedOption) : Boolean(otherSpecification.trim() || otherPackaging.trim());

  function confirmSelection() {
    if (!canConfirm) return;
    const selection: SpecificationSelection = selectionMode === "option" && selectedOption
      ? { kind: "option", option: selectedOption }
      : { kind: "other", otherPackaging, otherSpecification };
    onConfirm(quantity, selection);
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-[#17242A]/45 p-4 sm:place-items-center" role="presentation">
      <section aria-labelledby="spec-picker-title" aria-modal="true" className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">SELECT SPECIFICATION</p>
            <h2 className="mt-2 text-xl font-bold" id="spec-picker-title">{product.name}</h2>
          </div>
          <button aria-label="關閉" className="grid size-10 place-items-center rounded-full text-xl text-[#536168] hover:bg-[#F1F5F7]" onClick={onClose} type="button">×</button>
        </div>
        <div className="mt-6 space-y-3 rounded-xl border border-[#CFE3F0] bg-[#F4FAFD] p-4 text-sm">
          <p><span className="font-semibold text-[#536168]">商品原始規格：</span>{product.specification}</p>
          <p><span className="font-semibold text-[#536168]">商品原始包裝：</span>{product.packaging ?? "詳見商品規格"}</p>
          <p><span className="font-semibold text-[#536168]">保存方式：</span>{product.storageMethod}</p>
        </div>
        <fieldset className="mt-6">
          <legend className="text-sm font-bold">選擇規格與包裝</legend>
          <div className="mt-3 space-y-2">
            {product.specificationOptions.map((option) => (
              <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm transition ${selectionMode === "option" && selectedOptionId === option.id ? "border-[#005DAA] bg-[#EAF5FB]" : "border-[#D9E1E5] hover:border-[#8FB8CD]"}`} key={option.id}>
                <span className="flex items-center gap-3">
                  <input checked={selectionMode === "option" && selectedOptionId === option.id} className="size-4 accent-[#005DAA]" name="specification-option" onChange={() => { setSelectionMode("option"); setSelectedOptionId(option.id); }} type="radio" />
                  <span className="font-semibold">{option.specificationText}</span>
                </span>
                <span className="text-xs text-[#536168]">{option.packagingText}</span>
              </label>
            ))}
            <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${selectionMode === "other" ? "border-[#005DAA] bg-[#EAF5FB]" : "border-[#D9E1E5] hover:border-[#8FB8CD]"}`}>
              <input checked={selectionMode === "other"} className="size-4 accent-[#005DAA]" name="specification-option" onChange={() => setSelectionMode("other")} type="radio" />
              <span className="font-semibold">其他規格／包裝（自行填寫）</span>
            </label>
          </div>
        </fieldset>
        {selectionMode === "other" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold" htmlFor="other-specification">其他規格<input className="mt-2 min-h-11 w-full rounded-lg border border-[#B9CCD5] px-3 text-sm font-normal outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]" id="other-specification" onChange={(event) => setOtherSpecification(event.target.value)} placeholder="例如：250g／片" value={otherSpecification} /></label>
            <label className="text-sm font-semibold" htmlFor="other-packaging">其他包裝<input className="mt-2 min-h-11 w-full rounded-lg border border-[#B9CCD5] px-3 text-sm font-normal outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]" id="other-packaging" onChange={(event) => setOtherPackaging(event.target.value)} placeholder="例如：12片／箱" value={otherPackaging} /></label>
          </div>
        ) : null}
        <label className="mt-6 block text-sm font-semibold" htmlFor="inquiry-quantity">
          預估需求量（箱）
          <span className="mt-2 grid min-h-12 grid-cols-[3.25rem_1fr_3.25rem] overflow-hidden rounded-lg border border-[#B9CCD5] bg-white">
            <button aria-label="減少一箱" className="border-r border-[#D9E1E5] text-2xl font-medium text-[#005DAA] transition hover:bg-[#EAF5FB] disabled:cursor-not-allowed disabled:text-[#A2B5BF]" disabled={quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))} type="button">−</button>
            <input aria-label="預估需求量（箱）" className="min-w-0 border-0 px-3 text-center text-base font-bold outline-none [appearance:textfield] focus:ring-4 focus:ring-inset focus:ring-[#EAF5FB] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" id="inquiry-quantity" inputMode="numeric" min="1" onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} type="number" value={quantity} />
            <button aria-label="增加一箱" className="border-l border-[#D9E1E5] text-2xl font-medium text-[#005DAA] transition hover:bg-[#EAF5FB] active:bg-[#D9EEF8]" onClick={() => setQuantity((current) => current + 1)} type="button">+</button>
          </span>
        </label>
        <p className="mt-3 text-xs leading-5 text-[#536168]">實際規格、供應與報價由業務確認；本頁不顯示價格或即時庫存。</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="min-h-12 rounded-lg border border-[#B9CCD5] px-4 text-sm font-bold text-[#536168] hover:border-[#005DAA]" onClick={onClose} type="button">繼續選購</button>
          <button className="min-h-12 rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white hover:bg-[#00457F] disabled:cursor-not-allowed disabled:bg-[#A2B5BF]" disabled={!canConfirm} onClick={confirmSelection} type="button">加入詢價單</button>
        </div>
      </section>
    </div>
  );
}

const demoProductGalleries: Record<string, string[]> = {
  "B2B-FISH-001": [
    "/products/b2b/B2B-FISH-001/main.jpg",
    "/products/b2b/B2B-FISH-001/detail-01.jpg",
    "/products/b2b/B2B-FISH-001/detail-02.jpg",
  ],
  "B2B-FISH-002": [
    "/products/b2b/B2B-FISH-002/main.jpg",
    "/products/b2b/B2B-FISH-002/detail-01.jpg",
    "/products/b2b/B2B-FISH-002/detail-02.jpg",
  ],
  "B2B-FISH-003": [
    "/products/b2b/B2B-FISH-003/main.jpg",
    "/products/b2b/B2B-FISH-003/detail-01.jpg",
    "/products/b2b/B2B-FISH-003/detail-02.jpg",
    "/products/b2b/B2B-FISH-003/detail-03.jpg",
  ],
  "B2B-SHRIMP-001": [
    "/products/b2b/B2B-SHRIMP-001/main.jpg",
    "/products/b2b/B2B-SHRIMP-001/detail-01.jpg",
    "/products/b2b/B2B-SHRIMP-001/detail-02.jpg",
    "/products/b2b/B2B-SHRIMP-001/detail-03.jpg",
  ],
  "B2B-SHELL-001": [
    "/products/b2b/B2B-SHELL-001/main.jpg",
    "/products/b2b/B2B-SHELL-001/detail-01.jpg",
    "/products/b2b/B2B-SHELL-001/detail-02.jpg",
    "/products/b2b/B2B-SHELL-001/detail-03.jpg",
  ],
  "B2B-SOFT-001": [
    "/products/b2b/B2B-SOFT-001/main.jpg",
  ],
  "B2B-MEAT-001": [
    "/products/b2b/B2B-MEAT-001/main.jpg",
    "/products/b2b/B2B-MEAT-001/detail-01.jpg",
  ],
  "B2B-PREP-001": [
    "/products/b2b/B2B-PREP-001/main.jpg",
  ],
};

function ProductGallery({ product }: { product: B2BProduct }) {
  const images = demoProductGalleries[product.productCode] ?? [];
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) return <ProductVisual product={product} />;

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#EAF5FB]">
        <Image alt={`${product.name}商品圖片 ${activeIndex + 1}`} className="object-cover" fill priority={activeIndex === 0} sizes="(min-width: 640px) 42vw, 100vw" src={images[activeIndex]} />
      </div>
      <div aria-label="商品圖片切換" className="mt-3 flex gap-2 overflow-x-auto pb-1" role="list">
        {images.map((src, index) => (
          <button aria-label={`查看第 ${index + 1} 張商品圖片`} aria-pressed={activeIndex === index} className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${activeIndex === index ? "border-[#005DAA] ring-2 ring-[#EAF5FB]" : "border-[#D9E1E5] hover:border-[#8FB8CD]"}`} key={src} onClick={() => setActiveIndex(index)} type="button">
            <Image alt="" className="object-cover" fill sizes="64px" src={src} />
          </button>
        ))}
      </div>
    </div>
  );
}

function InquiryPanel({ items, onClose, onRemove, onSubmit, onUpdateQuantity }: { items: InquiryItem[]; onClose: () => void; onRemove: (key: string) => void; onSubmit: (note: string) => Promise<{ ok: boolean; message: string }>; onUpdateQuantity: (key: string, quantity: number) => void }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const submissionSucceeded = feedback.startsWith("詢價已送出");
  return (
    <aside aria-label="詢價單" className="h-full overflow-y-auto bg-white p-5 shadow-[-16px_0_32px_rgba(23,36,42,0.12)] sm:p-6" id="inquiry-list" tabIndex={-1}>
      <div className="flex items-start justify-between gap-3 border-b border-[#D9E1E5] pb-5">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">INQUIRY LIST</p>
          <h2 className="mt-2 text-xl font-bold">詢價單</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#005DAA] px-2.5 py-1 text-xs font-bold text-white">{items.length}</span>
          <button aria-label="收起詢價單" className="grid size-10 place-items-center rounded-full text-xl text-[#536168] transition hover:bg-[#F1F5F7] hover:text-[#17242A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]" onClick={onClose} type="button">×</button>
        </div>
      </div>
      {items.length ? (
        <ul className="divide-y divide-[#E2E8EB]">
          {items.map(({ key, product, quantity, selection }) => (
            <li className="py-4" key={key}>
              <div className="flex gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#EAF5FB] text-xs font-bold text-[#005DAA]">{product.category.slice(0, 2)}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-5">{product.name}</p>
                  <p className="mt-1 text-xs leading-5 text-[#536168]">{selectionSpecification(selection)} · {selectionPackaging(selection)}</p>
                  <div className="mt-3 inline-grid min-h-8 grid-cols-[2rem_2.5rem_2rem] overflow-hidden rounded-md border border-[#B9CCD5] bg-white text-sm">
                    <button aria-label={`減少 ${product.name} 一箱`} className="border-r border-[#D9E1E5] font-bold text-[#005DAA] transition hover:bg-[#EAF5FB] disabled:cursor-not-allowed disabled:text-[#A2B5BF]" disabled={quantity <= 1} onClick={() => onUpdateQuantity(key, quantity - 1)} type="button">−</button>
                    <span className="grid place-items-center font-bold">{quantity} 箱</span>
                    <button aria-label={`增加 ${product.name} 一箱`} className="border-l border-[#D9E1E5] font-bold text-[#005DAA] transition hover:bg-[#EAF5FB]" onClick={() => onUpdateQuantity(key, quantity + 1)} type="button">+</button>
                  </div>
                </div>
                <button aria-label={`移除 ${product.name}`} className="size-8 rounded text-[#536168] hover:bg-[#FFF1F0] hover:text-[#B42318]" onClick={() => onRemove(key)} type="button">×</button>
              </div>
            </li>
          ))}
        </ul>
      ) : feedback && feedback.startsWith("詢價已送出") ? (
        <div className="flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-center px-4 text-center sm:min-h-[24rem]">
          <div className="mx-auto grid size-11 place-items-center rounded-full bg-[#E8F6EE] text-lg text-[#18794E]">✓</div>
          <p aria-live="assertive" className="mt-4 text-base font-bold text-[#18794E]">詢價已成功送出</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[#536168]">{feedback}</p>
          <Link className="mt-6 inline-flex min-h-11 min-w-56 items-center justify-center rounded-lg bg-[#005DAA] px-5 text-sm font-bold text-white hover:bg-[#00457F]" href="/business/rfq" onClick={onClose}>查看詢價紀錄</Link>
          <p className="mt-4 text-xs text-[#809099]">您可以關閉此視窗繼續瀏覽商品</p>
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#EAF5FB] text-xl text-[#005DAA]">＋</div>
          <p className="mt-3 text-sm font-semibold">尚未選擇商品</p>
          <p className="mt-2 text-xs leading-5 text-[#536168]">從型錄選擇規格後，會集中在這裡一次送出。</p>
        </div>
      )}
      {!submissionSucceeded ? <div className="mt-2 border-t border-[#D9E1E5] pt-5">
        <label className="block text-sm font-semibold" htmlFor="inquiry-note">補充需求</label>
        <textarea className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#B9CCD5] p-3 text-sm outline-none placeholder:text-[#809099] focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]" id="inquiry-note" onChange={(event) => setNote(event.target.value)} placeholder="例如：希望交期、配送地區、使用通路" value={note} />
        <button className="mt-4 min-h-12 w-full rounded-lg bg-[#005DAA] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#A2B5BF]" disabled={!items.length || submitting} onClick={async () => { setSubmitting(true); setFeedback(""); const response = await onSubmit(note); setFeedback(response.message); setSubmitting(false); }} type="button">{submitting ? "送出中…" : "確認詢價內容"}</button>
        {feedback && !feedback.startsWith("詢價已送出") ? <p aria-live="polite" className="mt-3 rounded-lg bg-[#FFF1F0] p-3 text-xs leading-5 text-[#B42318]">{feedback}</p> : null}
          <p aria-live="polite" className="mt-3 text-xs leading-5 text-[#536168]">送出後由業務確認規格與報價；本頁不顯示價格或庫存。</p>
      </div> : null}
    </aside>
  );
}

export default function CatalogInquiryWorkspace({ products }: CatalogInquiryWorkspaceProps) {
  const [chosenProduct, setChosenProduct] = useState<B2BProduct | null>(null);
  const [detailProduct, setDetailProduct] = useState<B2BProduct | null>(null);
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent<number>(INQUIRY_COUNT_EVENT, { detail: items.length }));
  }, [items.length]);

  useEffect(() => {
    function openInquiry() {
      setInquiryOpen(true);
    }

    window.addEventListener(OPEN_INQUIRY_EVENT, openInquiry);
    return () => window.removeEventListener(OPEN_INQUIRY_EVENT, openInquiry);
  }, []);

  function addItem(quantity: number, selection: SpecificationSelection) {
    if (!chosenProduct) return;
    trackEvent({ event_name: "b2b_rfq_add", product_id: chosenProduct.id });
    const key = selectionKey(chosenProduct, selection);
    setItems((current) => {
      const matched = current.find((item) => item.key === key);
      if (matched) return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item);
      return [...current, { key, product: chosenProduct, quantity, selection }];
    });
    setChosenProduct(null);
    setInquiryOpen(true);
  }

  async function submitInquiry(note: string) {
    const response = await fetch("/api/b2b/rfqs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        total_note: note,
        items: items.map((item) => ({
          product_id: item.product.id,
          specification_option_id: item.selection.kind === "option" ? item.selection.option.id : undefined,
          other_specification: item.selection.kind === "other" ? item.selection.otherSpecification : undefined,
          other_packaging: item.selection.kind === "other" ? item.selection.otherPackaging : undefined,
          quantity: item.quantity,
          unit: "箱",
        })),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, message: body.error ?? "詢價送出失敗，請稍後再試。" };
    trackEvent({ event_name: "b2b_rfq_submit" });
    setItems([]);
    return { ok: true, message: `詢價已送出（編號 ${String(body.rfqId ?? "").slice(0, 8)}），業務將與您聯繫。` };
  }

  return (
    <div>
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D6E8F2] bg-[#F4FAFD] px-4 py-3 text-sm text-[#00457F]">
          <p><span className="font-bold">採購小提醒：</span>先選規格，再集中送出詢價需求。</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => <ProductCard key={product.id} onChoose={(nextProduct) => { trackEvent({ event_name: "b2b_product_view", product_id: nextProduct.id }); setChosenProduct(nextProduct); }} onDetail={(nextProduct) => { trackEvent({ event_name: "b2b_product_view", product_id: nextProduct.id }); setDetailProduct(nextProduct); }} product={product} />)}
        </div>
      </section>
      {inquiryOpen ? <div className="fixed inset-0 z-40 bg-[#17242A]/30 backdrop-blur-[1px]" role="presentation"><button aria-label="收起詢價單" className="absolute inset-0 cursor-default" onClick={() => setInquiryOpen(false)} type="button" /><div className="absolute inset-y-0 right-0 w-full max-w-[26rem] translate-x-0 transition-transform duration-300"><InquiryPanel items={items} onClose={() => setInquiryOpen(false)} onRemove={(key) => setItems((current) => current.filter((item) => item.key !== key))} onSubmit={submitInquiry} onUpdateQuantity={(key, quantity) => setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, quantity) } : item))} /></div></div> : null}
      {detailProduct ? <ProductDetail onChoose={() => { setDetailProduct(null); setChosenProduct(detailProduct); }} onClose={() => setDetailProduct(null)} product={detailProduct} /> : null}
      {chosenProduct ? <SpecPicker onClose={() => setChosenProduct(null)} onConfirm={(quantity, selection) => addItem(quantity, selection)} product={chosenProduct} /> : null}
    </div>
  );
}

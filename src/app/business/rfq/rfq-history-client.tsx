"use client";

import { useEffect, useMemo, useState } from "react";

type RfqItem = {
  id: string;
  product: { product_code: string; name: string; brand: string } | null;
  specification_text_snapshot: string | null;
  packaging_text_snapshot: string | null;
  quantity: number;
  unit: string;
};

type Rfq = {
  id: string;
  status: string;
  total_note: string | null;
  created_at: string;
  items: RfqItem[];
};

type Status = "submitted" | "reviewing" | "quoted" | "closed";

const statusMeta: Record<Status, { label: string; description: string; className: string }> = {
  submitted: { label: "已送出", description: "需求已收到，等待業務確認。", className: "border-[#B7D3E2] bg-[#F2F8FB] text-[#005DAA]" },
  reviewing: { label: "業務確認中", description: "正在確認供應、規格與交期。", className: "border-[#E6D59E] bg-[#FFF9E9] text-[#806300]" },
  quoted: { label: "已報價", description: "業務已完成報價聯繫。", className: "border-[#B5DCC7] bg-[#F0FAF4] text-[#18794E]" },
  closed: { label: "已完成", description: "本次詢價已結案。", className: "border-[#D9E1E5] bg-[#F4F6F7] text-[#536168]" },
};

function normalizeStatus(status: string): Status {
  if (status === "reviewing" || status === "quoted" || status === "closed") return status;
  return "submitted";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta[normalizeStatus(status)];
  return <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-bold ${meta.className}`}>{meta.label}</span>;
}

function InquiryDetail({ rfq }: { rfq: Rfq }) {
  const meta = statusMeta[normalizeStatus(rfq.status)];
  return (
    <div className="border-t border-[#E2E8EB] bg-[#FAFCFC] px-5 py-5 sm:px-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">SELECTED ITEMS</p>
          <ul className="mt-3 divide-y divide-[#E2E8EB] rounded-xl border border-[#E2E8EB] bg-white px-4">
            {rfq.items.map((item) => (
              <li className="grid gap-1 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_10rem_8rem] sm:items-center sm:gap-4" key={item.id}>
                <div className="min-w-0">
                  <p className="font-bold text-[#17242A]">{item.product?.name ?? "商品資料待確認"}</p>
                  {item.product?.product_code ? <p className="mt-1 text-xs font-semibold text-[#005DAA]">{item.product.product_code}</p> : null}
                </div>
                <p className="text-[#536168]">{item.specification_text_snapshot ?? "規格待確認"}<br className="hidden sm:block" /> {item.packaging_text_snapshot ?? "包裝待確認"}</p>
                <p className="font-semibold text-[#17242A]">預估 {item.quantity} {item.unit}</p>
              </li>
            ))}
          </ul>
        </div>
        <aside className="rounded-xl border border-[#D6E8F2] bg-[#F4FAFD] p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-[#005DAA]">NEXT STEP</p>
          <p className="mt-2 text-sm font-bold text-[#17242A]">{meta.label}</p>
          <p className="mt-2 text-sm leading-6 text-[#536168]">{meta.description}</p>
          {rfq.total_note ? <p className="mt-4 border-t border-[#CFE0E8] pt-4 text-sm leading-6 text-[#536168]"><span className="font-bold text-[#17242A]">您的備註：</span>{rfq.total_note}</p> : null}
        </aside>
      </div>
    </div>
  );
}

export default function RfqHistoryClient() {
  const [rfqs, setRfqs] = useState<Rfq[] | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/b2b/rfqs")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "讀取失敗");
        setRfqs(body.rfqs ?? []);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const counts = useMemo(() => {
    const summary: Record<Status, number> = { submitted: 0, reviewing: 0, quoted: 0, closed: 0 };
    rfqs?.forEach((rfq) => { summary[normalizeStatus(rfq.status)] += 1; });
    return summary;
  }, [rfqs]);

  if (error) return <p className="mt-8 rounded-lg bg-[#FFF1F0] p-4 text-sm text-[#B42318]">{error}</p>;
  if (!rfqs) return <p className="mt-8 text-sm text-[#536168]">載入詢價紀錄中…</p>;
  if (!rfqs.length) return <section className="mt-8 rounded-2xl border border-dashed border-[#B9CCD5] bg-white px-6 py-14 text-center"><p className="text-lg font-bold text-[#17242A]">目前尚無詢價紀錄</p><p className="mt-2 text-sm leading-6 text-[#536168]">從企業型錄選擇規格與預估數量後，即可建立第一筆詢價需求。</p><a className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#005DAA] px-5 text-sm font-bold text-white transition hover:bg-[#00457F]" href="/business/catalog">前往企業型錄</a></section>;

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#D9E1E5] pb-5">
        <div><h2 className="text-xl font-bold text-[#17242A]">詢價處理概況</h2><p className="mt-1 text-sm text-[#536168]">僅列出目前公司送出的詢價需求。</p></div>
        <p className="text-sm font-semibold text-[#536168]">共 {rfqs.length} 筆</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(Object.keys(statusMeta) as Status[]).map((status) => <div className="rounded-xl border border-[#D9E1E5] bg-white px-4 py-3" key={status}><p className="text-xs font-bold text-[#536168]">{statusMeta[status].label}</p><p className="mt-1 text-2xl font-bold text-[#17242A]">{counts[status]}</p></div>)}
      </div>
      <div className="mt-7 overflow-hidden rounded-2xl border border-[#C9D8DE] bg-white">
        <div className="hidden grid-cols-[9.5rem_8rem_minmax(14rem,1fr)_9rem_6rem] gap-4 border-b border-[#C9D8DE] bg-[#F3F7F8] px-5 py-3 text-xs font-bold tracking-wide text-[#536168] lg:grid"><span>詢價編號</span><span>送出日期</span><span>品項摘要</span><span>處理狀態</span><span className="text-right">明細</span></div>
        <ul className="divide-y divide-[#E2E8EB]">
          {rfqs.map((rfq) => {
            const expanded = expandedId === rfq.id;
            const firstItem = rfq.items[0]?.product?.name ?? "商品資料待確認";
            return <li key={rfq.id}>
              <button aria-controls={`rfq-detail-${rfq.id}`} aria-expanded={expanded} className="block w-full px-5 py-4 text-left transition hover:bg-[#F7FBFD] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#005DAA] sm:px-6" onClick={() => setExpandedId((current) => current === rfq.id ? null : rfq.id)} type="button">
                <div className="grid gap-2 lg:grid-cols-[9.5rem_8rem_minmax(14rem,1fr)_9rem_6rem] lg:items-center lg:gap-4">
                  <div><p className="text-xs text-[#536168] lg:hidden">詢價編號</p><p className="font-bold text-[#17242A]">RFQ-{rfq.id.slice(0, 8).toUpperCase()}</p></div>
                  <div><p className="text-xs text-[#536168] lg:hidden">送出日期</p><p className="text-sm text-[#536168]">{formatDate(rfq.created_at)}</p></div>
                  <div><p className="font-semibold text-[#17242A]">{firstItem}{rfq.items.length > 1 ? ` 等 ${rfq.items.length} 項商品` : ""}</p><p className="mt-1 text-xs text-[#536168]">點擊查看規格、包裝與預估數量</p></div>
                  <StatusPill status={rfq.status} />
                  <span className="mt-1 text-right text-sm font-bold text-[#005DAA] lg:mt-0">{expanded ? "收合 ︿" : "查看明細 ﹀"}</span>
                </div>
              </button>
              {expanded ? <div id={`rfq-detail-${rfq.id}`}><InquiryDetail rfq={rfq} /></div> : null}
            </li>;
          })}
        </ul>
      </div>
    </section>
  );
}

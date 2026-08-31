"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  AnalyticsFilters,
  AnalyticsResponse,
  Funnel,
} from "@/lib/analytics/report";

const EVENT_LABELS: Record<string, string> = {
  b2b_login_success: "登入成功",
  b2b_catalog_view: "型錄瀏覽",
  b2b_product_view: "商品查看",
  b2b_search_filter: "型錄篩選",
  b2b_product_finder_start: "需求篩選開始",
  b2b_product_finder_answer: "需求篩選回答",
  b2b_product_finder_complete: "需求篩選完成",
  b2b_product_finder_result_click: "需求篩選結果點擊",
  b2b_rfq_add: "加入詢價單",
  b2b_rfq_submit: "送出詢價",
};

const EMPTY_FILTERS: AnalyticsFilters = {
  customer_tier_snapshot: [],
  channel_snapshot: [],
  product_reference: [],
  product_category: [],
  product_brand: [],
  event_name: [],
  filter_type: [],
  finder_question: [],
};

const EXPORT_PURPOSES = [
  ["operations_analysis", "營運分析"],
  ["customer_service", "客戶服務"],
  ["audit", "稽核"],
  ["other", "其他"],
] as const;

type ProductSort = "active_companies" | "product_views" | "rfq_adds" | "rfq_submits";

const inputClass =
  "mt-2 min-h-10 w-full rounded-lg border border-[#D8E1E5] bg-white px-3 py-2 text-sm text-[#17242A] outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const TABLE_PAGE_SIZE = 50;

function dateInTaipei(date = new Date()) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Asia/Taipei",
      year: "numeric",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateSpan(from: string, to: string) {
  return Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000) + 1;
}

function buildQuery(dateFrom: string, dateTo: string, filters: AnalyticsFilters) {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  const values: Array<[keyof AnalyticsFilters, string]> = [
    ["customer_tier_snapshot", "customer_tier_snapshot"],
    ["channel_snapshot", "channel_snapshot"],
    ["product_reference", "product_reference"],
    ["product_category", "product_category"],
    ["product_brand", "product_brand"],
    ["event_name", "event_name"],
    ["filter_type", "filter_type"],
    ["finder_question", "finder_question"],
  ];
  for (const [field, key] of values) {
    if (filters[field].length) params.set(key, filters[field].join(","));
  }
  return params;
}

async function fetchReport(dateFrom: string, dateTo: string, filters: AnalyticsFilters) {
  const response = await fetch(`/api/admin/analytics/summary?${buildQuery(dateFrom, dateTo, filters)}`, {
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "目前無法讀取分析報表。");
  return body as AnalyticsResponse;
}

function number(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString("zh-TW");
}

function percentage(value: number | null) {
  return value === null ? "—" : `${value > 0 ? "+" : ""}${value}%`;
}

function MetricCard({
  label,
  value,
  change,
}: {
  label: string;
  value: number | string;
  change?: { previous: number; absolute: number; percentage: number | null };
}) {
  return (
    <article className="rounded-xl border border-[#D8E1E5] bg-white p-4">
      <p className="text-sm text-[#536168]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#17242A]">{typeof value === "number" ? number(value) : value}</p>
      {change ? <p className={`mt-2 text-xs font-semibold ${change.absolute >= 0 ? "text-[#18794E]" : "text-[#A43B34]"}`}>前期 {number(change.previous)} · 差異 {change.absolute > 0 ? "+" : ""}{number(change.absolute)}（{percentage(change.percentage)}）</p> : null}
    </article>
  );
}

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <label className="text-sm font-semibold text-[#536168]">
      {label}
      <select
        className={`${inputClass} min-h-[5rem]`}
        multiple
        onChange={(event) => onChange(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}
        size={Math.min(4, Math.max(2, options.length))}
        value={value}
      >
        {options.length ? options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>) : <option disabled>目前沒有可選值</option>}
      </select>
      <span className="mt-1 block text-xs font-normal text-[#809099]">可複選；同欄位為 OR，不同欄位為 AND。</span>
    </label>
  );
}

function BarList({
  rows,
  onClick,
}: {
  rows: Array<{ label: string; value: number; detail?: string; disabled?: boolean }>;
  onClick?: (label: string) => void;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return rows.length ? (
    <div className="space-y-3">
      {rows.map((row) => (
        <button
          className={`block w-full text-left ${row.disabled ? "cursor-default" : "cursor-pointer"}`}
          disabled={row.disabled}
          key={`${row.label}-${row.detail ?? ""}`}
          onClick={() => onClick?.(row.label)}
          type="button"
        >
          <div className="flex justify-between gap-3 text-sm"><span className="truncate font-semibold text-[#536168]">{row.label}</span><span className="shrink-0 font-bold text-[#17242A]">{number(row.value)}{row.detail ? ` · ${row.detail}` : ""}</span></div>
          <div className="mt-1 h-2 rounded-full bg-[#EEF2F3]"><div className="h-2 rounded-full bg-[#4B9AC4]" style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} /></div>
        </button>
      ))}
    </div>
  ) : <p className="text-sm text-[#809099]">目前沒有資料。</p>;
}

function TrendChart({ report }: { report: AnalyticsResponse }) {
  const points = report.trend;
  const max = Math.max(...points.map((point) => point.events), 1);
  const width = 640;
  const height = 170;
  const path = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - (point.events / max) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(" ");
  return points.length ? (
    <div>
      <svg aria-label="B2B 事件趨勢" className="h-44 w-full overflow-visible" role="img" viewBox={`0 0 ${width} ${height}`}>
        <polyline fill="none" points={path} stroke="#005DAA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {points.map((point, index) => {
          const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
          const y = height - (point.events / max) * (height - 20) - 10;
          return <circle cx={x} cy={y} fill="#fff" key={`${point.date_bucket}-${index}`} r="4" stroke="#005DAA" strokeWidth="3" />;
        })}
      </svg>
      <div className="flex justify-between gap-3 text-xs text-[#809099]"><span>{points[0].date_bucket}</span><span>事件 {number(points.reduce((sum, point) => sum + point.events, 0))}</span><span>{points[points.length - 1].date_bucket}</span></div>
    </div>
  ) : <p className="text-sm text-[#809099]">目前沒有事件資料。</p>;
}

function FunnelList({ funnel, labels }: { funnel: Funnel; labels: Record<string, string> }) {
  const entries = Object.keys(labels).map((key) => [key, funnel.sessions[key] ?? 0] as [string, number]);
  return entries.length ? (
    <div>
      <p className="mb-3 text-sm font-semibold text-[#536168]">整體轉換 {entries[0]?.[1] ? `${(((entries[entries.length - 1]?.[1] ?? 0) / entries[0][1]) * 100).toFixed(1)}%` : "—"}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([key, sessions], index) => {
          const previous = entries[index - 1]?.[1] ?? 0;
          const conversion = previous ? `${((sessions / previous) * 100).toFixed(1)}%` : "—";
          return <div className="rounded-lg border border-[#E7EDF0] bg-[#FBFDFE] p-3" key={key}><p className="text-xs text-[#809099]">{index ? `相鄰轉換 ${conversion}` : "起始階段"}</p><p className="mt-1 font-bold text-[#17242A]">{labels[key] ?? key}</p><p className="mt-1 text-sm text-[#536168]">Session {number(sessions)} · 企業 {number(funnel.companies[key] ?? 0)}</p></div>;
        })}
      </div>
    </div>
  ) : <p className="text-sm text-[#809099]">目前沒有漏斗資料。</p>;
}

export default function AnalyticsReportPanel() {
  const today = dateInTaipei();
  const [dateFrom, setDateFrom] = useState(shiftDate(today, -89));
  const [dateTo, setDateTo] = useState(today);
  const [filters, setFilters] = useState<AnalyticsFilters>(EMPTY_FILTERS);
  const [report, setReport] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purpose, setPurpose] = useState<(typeof EXPORT_PURPOSES)[number][0]>("operations_analysis");
  const [note, setNote] = useState("");
  const [exporting, setExporting] = useState(false);
  const [productSort, setProductSort] = useState<ProductSort>("active_companies");
  const [finderPage, setFinderPage] = useState(0);
  const [rfqPage, setRfqPage] = useState(0);

  async function refresh(nextFilters = filters, nextDateFrom = dateFrom, nextDateTo = dateTo) {
    const days = dateSpan(nextDateFrom, nextDateTo);
    if (!Number.isFinite(days) || days <= 0) {
      setError("日期範圍不正確。");
      return;
    }
    if (days > 90 && !window.confirm("目前查詢超過 90 天，報表會使用週／月聚合。確定繼續嗎？")) return;
    setLoading(true);
    setError("");
    try {
      setReport(await fetchReport(nextDateFrom, nextDateTo, nextFilters));
      setFinderPage(0);
      setRfqPage(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "目前無法讀取分析報表。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const initialDateFrom = shiftDate(today, -89);
    fetchReport(initialDateFrom, today, EMPTY_FILTERS).then(
      (nextReport) => {
        if (active) setReport(nextReport);
      },
      (reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "目前無法讀取分析報表。");
      },
    ).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [today]);

  const productOptions = useMemo(
    () => (report?.options.products ?? []).map((product) => ({ value: product.id, label: `${product.product_code}｜${product.name}` })),
    [report?.options.products],
  );
  const categories = useMemo(
    () => [...new Set((report?.options.products ?? []).map((product) => product.category))].sort().map((value) => ({ value, label: value })),
    [report?.options.products],
  );
  const brands = useMemo(
    () => [...new Set((report?.options.products ?? []).map((product) => product.brand))].sort().map((value) => ({ value, label: value })),
    [report?.options.products],
  );
  const rankedProducts = useMemo(
    () => [...(report?.product_ranking ?? [])]
      .sort((left, right) => right[productSort] - left[productSort] || right.events - left.events)
      .slice(0, 10),
    [productSort, report?.product_ranking],
  );

  function setCrossFilter(next: AnalyticsFilters) {
    setFilters(next);
    void refresh(next);
  }

  function applyPreset(days: number) {
    const nextDateTo = today;
    const nextDateFrom = shiftDate(today, 1 - days);
    setDateFrom(nextDateFrom);
    setDateTo(nextDateTo);
    void refresh(filters, nextDateFrom, nextDateTo);
  }

  async function download() {
    const days = dateSpan(dateFrom, dateTo);
    if (days > 90 && !window.confirm("目前匯出範圍超過 90 天，確定下載嗎？")) return;
    setExporting(true);
    setError("");
    try {
      const params = buildQuery(dateFrom, dateTo, filters);
      params.set("purpose", purpose);
      if (note.trim()) params.set("note", note.trim());
      const response = await fetch(`/api/admin/analytics/export?${params}`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "報表下載失敗。");
      }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(await response.blob());
      link.download = `b2b-analytics-${dateTo}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "報表下載失敗。");
    } finally {
      setExporting(false);
    }
  }

  const change = report?.comparison.totals;
  const eventRows = (report?.events_by_name ?? []).map((row) => ({ label: EVENT_LABELS[row.event_name] ?? row.event_name, value: row.events, detail: `企業 ${number(row.active_companies)}` }));
  const tierRows = (report?.tier_breakdown ?? []).map((row) => ({ label: row.label, value: row.events, detail: `企業 ${number(row.active_companies)}`, disabled: row.label.includes("已遮罩") }));
  const finderRows = report?.finder_answers ?? [];
  const rfqRows = report?.rfq_product_ranking ?? [];
  const finderPageCount = Math.max(1, Math.ceil(finderRows.length / TABLE_PAGE_SIZE));
  const rfqPageCount = Math.max(1, Math.ceil(rfqRows.length / TABLE_PAGE_SIZE));
  const currentFinderPage = Math.min(finderPage, finderPageCount - 1);
  const currentRfqPage = Math.min(rfqPage, rfqPageCount - 1);
  const visibleFinderRows = finderRows.slice(currentFinderPage * TABLE_PAGE_SIZE, (currentFinderPage + 1) * TABLE_PAGE_SIZE);
  const visibleRfqRows = rfqRows.slice(currentRfqPage * TABLE_PAGE_SIZE, (currentRfqPage + 1) * TABLE_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,42,0.04)] sm:p-6">
        <div className="mb-5 border-b border-[#E7EDF0] pb-5">
          <h2 className="text-xl font-bold text-[#17242A]">B2B 使用行為分析</h2>
        <p className="mt-2 text-sm leading-6 text-[#536168]">依客戶代碼前綴快照分析企業客戶的使用程度；B2C 報表由 GA4 負責。本報表不提供公司明細或原始事件下載。</p>
        </div>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void refresh(); }}>
          <div aria-label="日期快捷範圍" className="flex flex-wrap items-end gap-2 lg:col-span-2">
            <span className="mr-1 self-center text-sm font-semibold text-[#536168]">快捷範圍</span>
            {[{ label: "今天", days: 1 }, { label: "近 7 天", days: 7 }, { label: "近 30 天", days: 30 }, { label: "近 90 天", days: 90 }].map((preset) => <button className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`} key={preset.days} onClick={() => applyPreset(preset.days)} type="button">{preset.label}</button>)}
          </div>
          <label className="text-sm font-semibold text-[#536168]">開始日期<input className={inputClass} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} /></label>
          <label className="text-sm font-semibold text-[#536168]">結束日期<input className={inputClass} min={dateFrom} max={today} onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} /></label>
          <MultiSelect label="客戶級距" options={(report?.options.tiers ?? []).map((value) => ({ value, label: value === "unclassified" ? "未分類" : value }))} value={filters.customer_tier_snapshot} onChange={(value) => setFilters((current) => ({ ...current, customer_tier_snapshot: value }))} />
          <MultiSelect label="客戶通路" options={(report?.options.channels ?? []).map((value) => ({ value, label: value === "unclassified" ? "未分類" : value }))} value={filters.channel_snapshot} onChange={(value) => setFilters((current) => ({ ...current, channel_snapshot: value }))} />
          <MultiSelect label="商品" options={productOptions} value={filters.product_reference} onChange={(value) => setFilters((current) => ({ ...current, product_reference: value }))} />
          <MultiSelect label="分類" options={categories} value={filters.product_category} onChange={(value) => setFilters((current) => ({ ...current, product_category: value }))} />
          <MultiSelect label="品牌" options={brands} value={filters.product_brand} onChange={(value) => setFilters((current) => ({ ...current, product_brand: value }))} />
          <MultiSelect label="事件名稱" options={(report?.options.event_names ?? []).map((value) => ({ value, label: EVENT_LABELS[value] ?? value }))} value={filters.event_name} onChange={(value) => setFilters((current) => ({ ...current, event_name: value as AnalyticsFilters["event_name"] }))} />
          <MultiSelect label="篩選類型" options={(report?.options.filter_types ?? []).map((value) => ({ value, label: value }))} value={filters.filter_type} onChange={(value) => setFilters((current) => ({ ...current, filter_type: value }))} />
          <MultiSelect label="Finder 問題" options={(report?.options.finder_questions ?? []).map((value) => ({ value, label: value }))} value={filters.finder_question} onChange={(value) => setFilters((current) => ({ ...current, finder_question: value }))} />
          <div className="flex flex-wrap items-end gap-3 lg:col-span-2">
            <button className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`} disabled={loading} type="submit">{loading ? "讀取中…" : "套用篩選"}</button>
            <button className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`} onClick={() => { setFilters(EMPTY_FILTERS); void refresh(EMPTY_FILTERS); }} type="button">清除全部</button>
            {report ? <span className="text-xs text-[#809099]">{report.period.date_from}～{report.period.date_to} · {report.period.grain === "day" ? "日" : report.period.grain === "week" ? "週" : "月"}聚合</span> : null}
          </div>
        </form>
      </section>

      {error ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F0C6C3] bg-[#FFF3F2] px-4 py-3 text-sm text-[#A43B34]" role="alert"><span>{error}</span><button className={`${buttonClass} border border-[#D99B96] bg-white text-[#8D302A] hover:bg-[#FFE8E5]`} disabled={loading} onClick={() => void refresh()} type="button">重試</button></div> : null}
      {loading && !report ? <div className="rounded-2xl border border-[#D8E1E5] bg-white p-10 text-center text-sm text-[#536168]">正在整理 B2B 聚合資料…</div> : null}
      {report ? <>
        {report.totals.events === 0 ? <div className="rounded-xl border border-[#D8E1E5] bg-[#FBFDFE] px-4 py-3 text-sm text-[#536168]">此期間沒有資料；以下指標顯示為 0。</div> : null}
        <p className="text-xs text-[#809099]">前期比較：{report.comparison.period.date_from}～{report.comparison.period.date_to}。</p>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard change={change?.events} label="總事件數" value={report.totals.events} />
          <MetricCard change={change?.active_companies} label="活躍企業" value={report.totals.active_companies} />
          <MetricCard change={change?.active_users} label="活躍使用者" value={report.totals.active_users} />
          <MetricCard change={change?.active_sessions} label="活躍 Session" value={report.totals.active_sessions} />
          <MetricCard change={change?.avg_events_per_active_company} label="平均每活躍企業事件" value={report.totals.avg_events_per_active_company} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">使用趨勢</h3><p className="mt-1 text-xs text-[#809099]">事件強度使用原始事件數；不做重複事件去重。</p><div className="mt-4"><TrendChart report={report} /></div></div>
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">客戶級距</h3><p className="mt-1 text-xs text-[#809099]">未滿 5 家企業的群組顯示為其他（已遮罩）。</p><div className="mt-4"><BarList rows={tierRows} onClick={(label) => { if (label.includes("已遮罩")) return; setCrossFilter({ ...filters, customer_tier_snapshot: [label === "未分類" ? "unclassified" : label] }); }} /></div></div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">主要事件</h3><div className="mt-4"><BarList rows={eventRows} onClick={(label) => { const eventName = Object.entries(EVENT_LABELS).find(([, value]) => value === label)?.[0]; if (eventName) setCrossFilter({ ...filters, event_name: [eventName as AnalyticsFilters["event_name"][number]] }); }} /></div></div>
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">客戶通路</h3><div className="mt-4"><BarList rows={report.channel_breakdown.map((row) => ({ label: row.label, value: row.events, detail: `企業 ${number(row.active_companies)}`, disabled: row.label.includes("已遮罩") }))} /></div></div>
        </section>

        <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">主要使用漏斗</h3><p className="mt-1 text-xs text-[#809099]">主漏斗依同一 Session 且事件順序計算；企業到達數另列。</p><div className="mt-4"><FunnelList funnel={report.funnels.main} labels={{ catalog_view: "型錄瀏覽", product_view: "商品查看", rfq_add: "加入詢價單", rfq_submit: "送出詢價" }} /></div></section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">商品行為排名</h3><label className="text-xs font-semibold text-[#536168]">排序<select className="ml-2 rounded-lg border border-[#D8E1E5] bg-white px-2 py-1.5 text-sm text-[#17242A]" onChange={(event) => setProductSort(event.target.value as ProductSort)} value={productSort}><option value="active_companies">活躍企業</option><option value="product_views">商品查看</option><option value="rfq_adds">加入詢價</option><option value="rfq_submits">送出詢價</option></select></label></div><p className="mt-1 text-xs text-[#809099]">預設依活躍企業數；可切換商品查看／加入詢價／送出詢價，點擊商品可交叉篩選；未滿 5 家企業的商品會合併遮罩。</p><div className="mt-4 overflow-x-auto"><table className="min-w-[680px] w-full text-left text-sm"><thead className="bg-[#F4F7F8] text-xs text-[#536168]"><tr><th className="px-3 py-2">商品</th><th className="px-3 py-2">企業</th><th className="px-3 py-2">查看</th><th className="px-3 py-2">加入詢價</th><th className="px-3 py-2">送出詢價</th></tr></thead><tbody className="divide-y divide-[#E7EDF0]">{rankedProducts.map((row) => <tr className={row.product_id ? "cursor-pointer hover:bg-[#FBFDFE]" : ""} key={`${row.product_id ?? "masked"}-${row.name ?? ""}`} onClick={() => { if (row.product_id) setCrossFilter({ ...filters, product_reference: [row.product_id] }); }}><td className="px-3 py-3"><p className="font-semibold">{row.name ?? (row.product_id ? "未命名商品" : "其他（已遮罩）")}</p><p className="text-xs text-[#809099]">{row.product_code ?? (row.product_id ? row.product_id : "")}</p></td><td className="px-3 py-3">{number(row.active_companies)}</td><td className="px-3 py-3">{number(row.product_views)}</td><td className="px-3 py-3">{number(row.rfq_adds)}</td><td className="px-3 py-3">{number(row.rfq_submits)}</td></tr>)}{!rankedProducts.length ? <tr><td className="px-3 py-6 text-center text-[#809099]" colSpan={5}>目前沒有商品行為資料。</td></tr> : null}</tbody></table></div></div>
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">Finder 行為</h3><div className="mt-4"><FunnelList funnel={report.funnels.finder} labels={{ start: "開始", answer: "回答問題", complete: "完成篩選", result_click: "點擊結果" }} /><div className="mt-5 overflow-x-auto"><table className="min-w-[420px] w-full text-left text-sm"><thead className="bg-[#F4F7F8] text-xs text-[#536168]"><tr><th className="px-3 py-2">問題／選項</th><th className="px-3 py-2">事件</th><th className="px-3 py-2">企業</th></tr></thead><tbody className="divide-y divide-[#E7EDF0]">{visibleFinderRows.map((row) => <tr key={`${row.question_key}-${row.option_id}`}><td className="px-3 py-3">{row.question_key}／{row.option_id}</td><td className="px-3 py-3">{number(row.events)}</td><td className="px-3 py-3">{number(row.active_companies)}</td></tr>)}</tbody></table></div>{finderRows.length > TABLE_PAGE_SIZE ? <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#536168]"><span>第 {currentFinderPage + 1}／{finderPageCount} 頁</span><div className="flex gap-2"><button className={`${buttonClass} min-h-8 border border-[#B8CBD4] bg-white px-2 text-xs text-[#00457F]`} disabled={currentFinderPage === 0} onClick={() => setFinderPage((page) => Math.max(0, page - 1))} type="button">上一頁</button><button className={`${buttonClass} min-h-8 border border-[#B8CBD4] bg-white px-2 text-xs text-[#00457F]`} disabled={currentFinderPage >= finderPageCount - 1} onClick={() => setFinderPage((page) => Math.min(finderPageCount - 1, page + 1))} type="button">下一頁</button></div></div> : null}</div></div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">實際詢價統計</h3><p className="mt-1 text-xs text-[#809099]">此區來自 b2b_rfqs，與行為事件分開計算。</p><div className="mt-4 grid grid-cols-2 gap-3"><MetricCard label="詢價單" value={report.rfq_summary.rfqs} /><MetricCard label="詢價企業" value={report.rfq_summary.active_companies} /><MetricCard label="品項列" value={report.rfq_summary.line_items} /><MetricCard label="需求數量" value={report.rfq_summary.requested_quantity} /></div></div>
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">詢價商品排名</h3><p className="mt-1 text-xs text-[#809099]">未滿 5 家企業的商品會合併為其他（已遮罩）。</p><div className="mt-4 overflow-x-auto"><table className="min-w-[620px] w-full text-left text-sm"><thead className="bg-[#F4F7F8] text-xs text-[#536168]"><tr><th className="px-3 py-2">商品</th><th className="px-3 py-2">詢價企業</th><th className="px-3 py-2">詢價單</th><th className="px-3 py-2">需求數量</th></tr></thead><tbody className="divide-y divide-[#E7EDF0]">{visibleRfqRows.map((row) => <tr key={`${row.product_id ?? "masked"}-${row.name ?? ""}`}><td className="px-3 py-3">{row.name ?? row.product_code ?? (row.product_id ?? "其他（已遮罩）")}</td><td className="px-3 py-3">{number(row.active_companies)}</td><td className="px-3 py-3">{number(row.rfqs)}</td><td className="px-3 py-3">{number(row.requested_quantity)}</td></tr>)}{!rfqRows.length ? <tr><td className="px-3 py-6 text-center text-[#809099]" colSpan={4}>目前沒有詢價商品資料。</td></tr> : null}</tbody></table></div>{rfqRows.length > TABLE_PAGE_SIZE ? <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#536168]"><span>第 {currentRfqPage + 1}／{rfqPageCount} 頁</span><div className="flex gap-2"><button className={`${buttonClass} min-h-8 border border-[#B8CBD4] bg-white px-2 text-xs text-[#00457F]`} disabled={currentRfqPage === 0} onClick={() => setRfqPage((page) => Math.max(0, page - 1))} type="button">上一頁</button><button className={`${buttonClass} min-h-8 border border-[#B8CBD4] bg-white px-2 text-xs text-[#00457F]`} disabled={currentRfqPage >= rfqPageCount - 1} onClick={() => setRfqPage((page) => Math.min(rfqPageCount - 1, page + 1))} type="button">下一頁</button></div></div> : null}</div>
        </section>

        <section className="rounded-2xl border border-[#C5D8E9] bg-[#EEF7FD] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h3 className="font-bold text-[#17242A]">下載聚合報表</h3><p className="mt-1 text-sm leading-6 text-[#536168]">下載前請填寫用途；系統會記錄管理者、時間、用途、查詢範圍、格式與列數。CSV 不含原始事件、完整客戶代碼或公司明細。</p></div><div className="grid gap-3 sm:grid-cols-[11rem_minmax(14rem,1fr)_auto]"><label className="text-sm font-semibold text-[#536168]">用途<select className={inputClass} onChange={(event) => setPurpose(event.target.value as typeof purpose)} value={purpose}>{EXPORT_PURPOSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-semibold text-[#536168]">備註（選填）<input className={inputClass} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="例如：月度營運會議" value={note} /></label><button className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`} disabled={exporting} onClick={() => void download()} type="button">{exporting ? "產生中…" : "下載 CSV"}</button></div></div></section>
      </> : null}
    </div>
  );
}

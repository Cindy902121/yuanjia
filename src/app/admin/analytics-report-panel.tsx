"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolvePeriod, validatePeriod, shiftDay, bucketRange } from "@/lib/admin-dates";
import { changeAdminQuery } from "./admin-navigation";
import { adminRequest } from "./admin-request";
import { useAdminResource } from "./use-admin-resource";
import { ResourceState } from "./resource-state";
import { B2B_FINDER_CHANNELS } from "@/lib/product-finder";

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

const FILTER_TYPE_LABELS: Record<string, string> = {
  keyword: "關鍵字搜尋",
  category: "商品分類",
  brand: "品牌",
  tag: "標籤",
};

const FINDER_QUESTION_LABELS: Record<string, string> = {
  primary_channel: "主要通路",
  channel_category: "通路分類",
};

const FINDER_OPTION_LABELS: Record<string, string> = Object.fromEntries(
  B2B_FINDER_CHANNELS.flatMap((channel) => [
    [channel.key, channel.label],
    ...(channel.categories ?? []).map((category) => [category.key, category.label]),
  ]),
);

const FILTER_LABELS: Array<[keyof AnalyticsFilters, string]> = [
  ["customer_tier_snapshot", "客戶級距"],
  ["channel_snapshot", "客戶通路"],
  ["product_reference", "商品"],
  ["product_category", "分類"],
  ["product_brand", "品牌"],
  ["event_name", "事件"],
  ["filter_type", "篩選類型"],
  ["finder_question", "Finder 問題"],
];

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

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  review: "待審核",
  published: "已上架",
  offline: "停用",
};

type ProductSort = "active_companies" | "product_views" | "rfq_adds" | "rfq_submits";
type SavedFilter = { id: string; name: string; scope: Record<string, unknown>; created_at: string; updated_at: string };
type AnalyticsSchedule = { id: string; name: string; frequency: "daily" | "weekly" | "monthly"; time_local: string; weekday: number | null; month_day: number | null; is_active: boolean; last_run_at: string | null };
type AnalyticsAlert = { id: string; title: string; message: string; status: "unread" | "acknowledged" | "recovered"; last_seen_at: string };
type ExportRun = { id: string; status: string; file_name: string | null; row_count: number; error_message: string | null; created_at: string };
type DrilldownCompany = { id: string; name: string; client_code: string; is_active: boolean; event_count: number; active_users: number; active_sessions: number; product_events: number; rfq_events: number; rfq_count: number; last_activity_at: string };
type DrilldownResponse = { masked?: boolean; total: number; page: number; page_size: number; companies: DrilldownCompany[] };
type SavedDateMode = { type: "fixed" } | { type: "complete_days"; days: number };

const inputClass =
  "mt-2 min-h-10 w-full rounded-lg border border-[#D8E1E5] bg-white px-3 py-2 text-sm text-[#17242A] outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const TABLE_PAGE_SIZE = 50;

function buildQuery(dateFrom: string, dateTo: string, filters: AnalyticsFilters, includeInactiveProducts = false) {
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
  if (includeInactiveProducts) params.set("include_inactive_products", "true");
  return params;
}

function number(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString("zh-TW");
}

function percentage(value: number | null) {
  return value === null ? "—（前期為 0）" : `${value > 0 ? "+" : ""}${value}%`;
}

function filterValueLabel(
  field: keyof AnalyticsFilters,
  value: string,
  products: AnalyticsResponse["options"]["products"],
) {
  if (field === "product_reference") return products.find((product) => product.id === value)?.name ?? value;
  if (field === "event_name") return EVENT_LABELS[value] ?? value;
  if (field === "filter_type") return FILTER_TYPE_LABELS[value] ?? value;
  if (field === "finder_question") return FINDER_QUESTION_LABELS[value] ?? value;
  return value === "unclassified" ? "未分類" : value;
}

function appliedFilterChips(
  filters: AnalyticsFilters,
  products: AnalyticsResponse["options"]["products"],
) {
  return FILTER_LABELS.flatMap(([field, label]) => filters[field].map((value) => ({
    key: `${field}-${value}`,
    label,
    value: filterValueLabel(field, value, products),
  })));
}

const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as Array<keyof AnalyticsFilters>;

function scopeFilters(value: unknown): AnalyticsFilters | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(FILTER_KEYS.map((key) => [key, Array.isArray(source[key]) ? source[key].filter((item): item is string => typeof item === "string") : []])) as AnalyticsFilters;
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
      <span className="mt-1 block text-xs font-normal text-[#809099]">按住 Cmd／Ctrl 可複選；同欄位為 OR，不同欄位為 AND。</span>
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
          return <circle cx={x} cy={y} fill="#fff" key={`${(() => { const range = bucketRange(point.date_bucket, report.period.grain, report.period.date_from, report.period.date_to); return `${range.from}～${range.to}${range.partial ? "（部分期間）" : ""}`; })()}-${index}`} r="4" stroke="#005DAA" strokeWidth="3" />;
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

export default function AnalyticsReportPanel({ revision = 0 }: { revision?: number }) {
  const params = useSearchParams();
  const period = resolvePeriod(new URLSearchParams(params.toString()));
  const today = period.today;
  const appliedFilters = Object.fromEntries(Object.keys(EMPTY_FILTERS).map((key) => [key, params.getAll(key).flatMap((value) => value.split(",")).filter(Boolean)])) as AnalyticsFilters;
  const [dateFrom, setDateFrom] = useState(period.from);
  const [dateTo, setDateTo] = useState(period.to);
  const [dateMode, setDateMode] = useState<SavedDateMode>({ type: "fixed" });
  const [filters, setFilters] = useState<AnalyticsFilters>(appliedFilters);
  const [includeInactiveProducts, setIncludeInactiveProducts] = useState(params.get("include_inactive_products") === "true");
  const resource = useAdminResource<AnalyticsResponse>(period.error ? null : `/api/admin/analytics/summary?${buildQuery(period.from, period.to, appliedFilters, includeInactiveProducts)}`, revision);
  const report = resource.data ?? null, loading = resource.pending;
  const [localError, setError] = useState("");
  const error = localError || period.error || resource.error;
  useEffect(() => { if (period.absent) changeAdminQuery({ date_from: period.from, date_to: period.to }, true); }, [period.absent, period.from, period.to]);
  const [purpose, setPurpose] = useState<(typeof EXPORT_PURPOSES)[number][0]>("operations_analysis");
  const [note, setNote] = useState("");
  const [exporting, setExporting] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [savedFilterName, setSavedFilterName] = useState("");
  const [selectedSavedFilter, setSelectedSavedFilter] = useState("");
  const [schedules, setSchedules] = useState<AnalyticsSchedule[]>([]);
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState<AnalyticsSchedule["frequency"]>("daily");
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [scheduleWeekday, setScheduleWeekday] = useState("1");
  const [scheduleMonthDay, setScheduleMonthDay] = useState("1");
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportRun[]>([]);
  const [managementError, setManagementError] = useState("");
  const [managementMessage, setManagementMessage] = useState("");
  const [drilldown, setDrilldown] = useState<DrilldownResponse | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState("");
  const [drilldownPage, setDrilldownPage] = useState(1);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [productSort, setProductSort] = useState<ProductSort>("active_companies");
  const [finderPage, setFinderPage] = useState(0);
  const [rfqPage, setRfqPage] = useState(0);
  const dateError = dateFrom && dateTo && dateFrom > dateTo ? "起日不得晚於迄日" : "";

  useEffect(() => {
    let active = true;
    void Promise.all([
      adminRequest<{ filters: SavedFilter[] }>("/api/admin/analytics/saved-filters"),
      adminRequest<{ schedules: AnalyticsSchedule[] }>("/api/admin/analytics/schedules"),
      adminRequest<{ alerts: AnalyticsAlert[] }>("/api/admin/analytics/alerts?status=unread"),
      adminRequest<{ exports: ExportRun[] }>("/api/admin/analytics/exports"),
    ]).then(([filtersResult, schedulesResult, alertsResult, exportsResult]) => {
      if (!active) return;
      setSavedFilters(filtersResult.filters ?? []);
      setSchedules(schedulesResult.schedules ?? []);
      setAlerts(alertsResult.alerts ?? []);
      setExportHistory(exportsResult.exports ?? []);
    }).catch((reason) => {
      if (active) setManagementError(reason instanceof Error ? reason.message : "目前無法讀取分析管理資料。");
    });
    return () => { active = false; };
  }, [revision]);

  async function refresh(nextFilters = filters, nextDateFrom = dateFrom, nextDateTo = dateTo, nextIncludeInactiveProducts = includeInactiveProducts) {
    const invalid = validatePeriod(nextDateFrom, nextDateTo, today);
    if (invalid) { setError(invalid); return; }
    setError("");
    const values: Record<string, string | null> = { date_from: nextDateFrom, date_to: nextDateTo, include_inactive_products: nextIncludeInactiveProducts ? "true" : null };
    for (const key of Object.keys(EMPTY_FILTERS) as Array<keyof AnalyticsFilters>) values[key] = nextFilters[key].join(",") || null;
    changeAdminQuery(values);
    if (nextDateFrom === period.from && nextDateTo === period.to && JSON.stringify(nextFilters) === JSON.stringify(appliedFilters) && nextIncludeInactiveProducts === includeInactiveProducts) await resource.reload();
  }

  const productOptions = useMemo(
    () => (report?.options.products ?? []).map((product) => ({ value: product.id, label: `${product.product_code}｜${product.name}${product.status && product.status !== "published" ? `（${PRODUCT_STATUS_LABELS[product.status] ?? "未上架"}）` : ""}` })),
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

  function changeProductVisibility(include: boolean) {
    const nextFilters = include ? filters : {
      ...filters,
      product_reference: filters.product_reference.filter((id) => (report?.options.products ?? []).some((product) => product.id === id && product.status === "published" && product.is_active)),
    };
    setIncludeInactiveProducts(include);
    setFilters(nextFilters);
    void refresh(nextFilters, dateFrom, dateTo, include);
  }

  function applyPreset(days: number) {
    const nextDateTo = days === 1 ? today : shiftDay(today, -1);
    const nextDateFrom = shiftDay(nextDateTo, 1 - days);
    setDateMode({ type: "complete_days", days });
    setDateFrom(nextDateFrom);
    setDateTo(nextDateTo);
    void refresh(filters, nextDateFrom, nextDateTo);
  }

  async function download() {
    if (!report) return;
    const days = report.period.days;
    if (days > 90 && !window.confirm("目前匯出範圍超過 90 天，確定下載嗎？")) return;
    setExporting(true);
    setError("");
    setDownloadMessage("");
    try {
      const params = buildQuery(report.period.date_from, report.period.date_to, report.filters, includeInactiveProducts);
      params.set("purpose", purpose);
      if (note.trim()) params.set("note", note.trim());
      const response = await fetch(`/api/admin/analytics/export?${params}`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "報表下載失敗。");
      }
      const filename = response.headers.get("content-disposition")?.match(/filename="?([^";]+)"?/)?.[1]
        ?? `b2b-analytics-${report.period.date_to}.csv`;
      const link = document.createElement("a");
      const objectUrl = URL.createObjectURL(await response.blob());
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
      setDownloadMessage(`已下載 ${filename}。`);
    } catch (reason) {
      setDownloadMessage("");
      setError(reason instanceof Error ? reason.message : "報表下載失敗。");
    } finally {
      setExporting(false);
    }
  }

  function currentScope() {
    if (!report) return null;
    return {
      date_from: report.period.date_from,
      date_to: report.period.date_to,
      date_mode: dateMode,
      include_inactive_products: includeInactiveProducts,
      filters: Object.fromEntries(FILTER_KEYS.map((key) => [key, report.filters[key]])),
    };
  }

  async function saveFilter() {
    const scope = currentScope();
    if (!scope || !savedFilterName.trim()) {
      setManagementError("請先輸入常用篩選名稱。");
      return;
    }
    try {
      const result = await adminRequest<{ filter: SavedFilter }>("/api/admin/analytics/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: savedFilterName.trim(), scope }),
      });
      setSavedFilters((current) => [result.filter, ...current.filter((item) => item.id !== result.filter.id)]);
      setSavedFilterName("");
      setManagementMessage(`已保存常用篩選「${result.filter.name}」。`);
      setManagementError("");
    } catch (reason) {
      setManagementError(reason instanceof Error ? reason.message : "目前無法保存常用篩選。");
    }
  }

  function loadSavedFilter() {
    const selected = savedFilters.find((item) => item.id === selectedSavedFilter);
    const scope = selected?.scope;
    if (!scope) return;
    const nextFilters = scopeFilters(scope.filters);
    if (!nextFilters) {
      setManagementError("這組常用篩選內容已失效，請重新保存。");
      return;
    }
    const mode = scope.date_mode && typeof scope.date_mode === "object" && !Array.isArray(scope.date_mode) ? scope.date_mode as Record<string, unknown> : null;
    const nextIncludeInactiveProducts = scope.include_inactive_products === true;
    const nextMode: SavedDateMode = mode?.type === "complete_days" && Number.isInteger(mode.days) && Number(mode.days) > 0 && Number(mode.days) <= 90
      ? { type: "complete_days", days: Number(mode.days) }
      : { type: "fixed" };
    const fixedDateTo = typeof scope.date_to === "string" ? scope.date_to : null;
    const fixedDateFrom = typeof scope.date_from === "string" ? scope.date_from : null;
    let nextDateTo = fixedDateTo;
    let nextDateFrom = fixedDateFrom;
    if (nextMode.type === "complete_days") {
      nextDateTo = nextMode.days === 1 ? today : shiftDay(today, -1);
      nextDateFrom = shiftDay(nextDateTo, 1 - nextMode.days);
    }
    if (typeof nextDateFrom !== "string" || typeof nextDateTo !== "string") {
      setManagementError("這組常用篩選缺少有效日期，請重新保存。");
      return;
    }
    setDateMode(nextMode);
    setDateFrom(nextDateFrom);
    setDateTo(nextDateTo);
    setIncludeInactiveProducts(nextIncludeInactiveProducts);
    setFilters(nextFilters);
    void refresh(nextFilters, nextDateFrom, nextDateTo, nextIncludeInactiveProducts);
  }

  async function createSchedule() {
    const scope = currentScope();
    if (!scope || !scheduleName.trim()) {
      setManagementError("請先輸入排程名稱。");
      return;
    }
    const scheduleScope = { ...scope, date_mode: { type: "fixed" as const } };
    try {
      const result = await adminRequest<{ schedule: AnalyticsSchedule }>("/api/admin/analytics/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scheduleName.trim(),
          frequency: scheduleFrequency,
          time_local: scheduleTime,
          weekday: scheduleFrequency === "weekly" ? Number(scheduleWeekday) : null,
          month_day: scheduleFrequency === "monthly" ? Number(scheduleMonthDay) : null,
          query_scope: scheduleScope,
        }),
      });
      setSchedules((current) => [result.schedule, ...current]);
      setScheduleName("");
      setManagementMessage(`已建立排程「${result.schedule.name}」。`);
      setManagementError("");
    } catch (reason) {
      setManagementError(reason instanceof Error ? reason.message : "目前無法建立匯出排程。");
    }
  }

  async function loadDrilldown(page = 1) {
    if (!report || report.totals.active_companies < 5) return;
    setDrilldownLoading(true);
    setManagementError("");
    try {
      const query = buildQuery(report.period.date_from, report.period.date_to, report.filters, includeInactiveProducts);
      query.set("page", String(page));
      query.set("page_size", String(TABLE_PAGE_SIZE));
      if (drilldownSearch.trim()) query.set("search", drilldownSearch.trim());
      const data = await adminRequest<DrilldownResponse>(`/api/admin/analytics/drilldown?${query}`);
      setDrilldown(data);
      setDrilldownPage(page);
    } catch (reason) {
      setDrilldown(null);
      setManagementError(reason instanceof Error ? reason.message : "目前無法讀取客戶明細。");
    } finally {
      setDrilldownLoading(false);
    }
  }

  async function acknowledgeAlert(id: string) {
    try {
      await adminRequest(`/api/admin/analytics/alerts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "acknowledged" }),
      });
      setAlerts((current) => current.filter((alert) => alert.id !== id));
    } catch (reason) {
      setManagementError(reason instanceof Error ? reason.message : "目前無法更新告警。");
    }
  }

  async function toggleSchedule(schedule: AnalyticsSchedule) {
    try {
      const result = await adminRequest<{ schedule: AnalyticsSchedule }>(`/api/admin/analytics/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !schedule.is_active }),
      });
      setSchedules((current) => current.map((item) => item.id === schedule.id ? result.schedule : item));
    } catch (reason) {
      setManagementError(reason instanceof Error ? reason.message : "目前無法更新匯出排程。");
    }
  }

  async function deleteSchedule(schedule: AnalyticsSchedule) {
    if (!window.confirm(`確定刪除排程「${schedule.name}」嗎？`)) return;
    try {
      await adminRequest(`/api/admin/analytics/schedules/${schedule.id}`, { method: "DELETE" });
      setSchedules((current) => current.filter((item) => item.id !== schedule.id));
    } catch (reason) {
      setManagementError(reason instanceof Error ? reason.message : "目前無法刪除匯出排程。");
    }
  }

  async function downloadScheduledExport(id: string) {
    try {
      const result = await adminRequest<{ download_url: string | null }>(`/api/admin/analytics/exports?id=${id}`);
      if (!result.download_url) throw new Error("此匯出檔案目前不可下載。");
      const link = document.createElement("a");
      link.href = result.download_url;
      link.click();
      setManagementMessage("已開始下載排程匯出檔案。");
    } catch (reason) {
      setManagementError(reason instanceof Error ? reason.message : "目前無法下載排程匯出檔案。");
    }
  }

  const change = report?.period.date_to === today ? undefined : report?.comparison.totals;
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
  const activeFilterChips = report ? appliedFilterChips(report.filters, report.options.products) : [];
  const appliedConditions = report ? [
    { key: "date", label: "日期", value: `${report.period.date_from}～${report.period.date_to}` },
    ...activeFilterChips,
  ] : [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,42,0.04)] sm:p-6">
        <div className="mb-5 border-b border-[#E7EDF0] pb-5">
          <h2 className="text-xl font-bold text-[#17242A]">B2B 使用行為分析</h2>
        <p className="mt-2 text-sm leading-6 text-[#536168]">依客戶代碼前綴快照分析企業客戶的使用程度；B2C 報表由 GA4 負責。CSV 不提供原始事件或客戶明細，Admin 可在未遮罩範圍查看最小聚合明細。</p>
        </div>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void refresh(); }}>
          <div aria-label="日期快捷範圍" className="flex flex-wrap items-end gap-2 lg:col-span-2">
            <span className="mr-1 self-center text-sm font-semibold text-[#536168]">快捷範圍</span>
            {[{ label: "今天", days: 1 }, { label: "近 7 個完整日", days: 7 }, { label: "近 30 個完整日", days: 30 }, { label: "近 90 個完整日", days: 90 }].map((preset) => <button className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`} key={preset.days} onClick={() => applyPreset(preset.days)} type="button">{preset.label}</button>)}
          </div>
          <label className="text-sm font-semibold text-[#536168]">開始日期<input className={inputClass} max={dateTo} onChange={(event) => { setDateMode({ type: "fixed" }); setDateFrom(event.target.value); }} type="date" value={dateFrom} /></label>
          <label className="text-sm font-semibold text-[#536168]">結束日期<input aria-describedby={dateError ? "analytics-date-error" : undefined} aria-invalid={dateError ? "true" : undefined} className={inputClass} min={dateFrom} max={today} onChange={(event) => { setDateMode({ type: "fixed" }); setDateTo(event.target.value); }} type="date" value={dateTo} />{dateError ? <span className="mt-1 block text-xs font-normal text-[#B42318]" id="analytics-date-error" role="alert">{dateError}</span> : null}</label>
          <MultiSelect label="客戶級距" options={(report?.options.tiers ?? []).map((value) => ({ value, label: value === "unclassified" ? "未分類" : value }))} value={filters.customer_tier_snapshot} onChange={(value) => setFilters((current) => ({ ...current, customer_tier_snapshot: value }))} />
          <MultiSelect label="客戶通路" options={(report?.options.channels ?? []).map((value) => ({ value, label: value === "unclassified" ? "未分類" : value }))} value={filters.channel_snapshot} onChange={(value) => setFilters((current) => ({ ...current, channel_snapshot: value }))} />
          <MultiSelect label="商品" options={productOptions} value={filters.product_reference} onChange={(value) => setFilters((current) => ({ ...current, product_reference: value }))} />
          <div className="rounded-lg border border-[#D8E1E5] bg-[#FBFDFE] px-3 py-2 lg:col-span-2"><label className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-[#536168]"><input aria-describedby="analytics-inactive-products-hint" checked={includeInactiveProducts} className="mt-1 h-4 w-4 shrink-0 accent-[#005DAA]" onChange={(event) => changeProductVisibility(event.currentTarget.checked)} type="checkbox" /><span><span className="block text-[#17242A]">包含停用商品</span><span className="mt-1 block text-xs font-normal leading-5 text-[#809099]" id="analytics-inactive-products-hint">預設只顯示已上架且啟用中的商品；勾選後立即載入停用／測試商品。</span></span></label></div>
          <MultiSelect label="分類" options={categories} value={filters.product_category} onChange={(value) => setFilters((current) => ({ ...current, product_category: value }))} />
          <MultiSelect label="品牌" options={brands} value={filters.product_brand} onChange={(value) => setFilters((current) => ({ ...current, product_brand: value }))} />
          <MultiSelect label="事件名稱" options={(report?.options.event_names ?? []).map((value) => ({ value, label: EVENT_LABELS[value] ?? value }))} value={filters.event_name} onChange={(value) => setFilters((current) => ({ ...current, event_name: value as AnalyticsFilters["event_name"] }))} />
          <MultiSelect label="篩選類型" options={(report?.options.filter_types ?? []).map((value) => ({ value, label: FILTER_TYPE_LABELS[value] ?? value }))} value={filters.filter_type} onChange={(value) => setFilters((current) => ({ ...current, filter_type: value }))} />
          <MultiSelect label="Finder 問題" options={(report?.options.finder_questions ?? []).map((value) => ({ value, label: FINDER_QUESTION_LABELS[value] ?? value }))} value={filters.finder_question} onChange={(value) => setFilters((current) => ({ ...current, finder_question: value }))} />
          <div className="flex flex-wrap items-end gap-3 lg:col-span-2">
            <button className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`} disabled={loading} type="submit">{loading ? "讀取中…" : "套用篩選"}</button>
            <button className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`} onClick={() => { setDateMode({ type: "fixed" }); setFilters(EMPTY_FILTERS); void refresh(EMPTY_FILTERS); }} type="button">清除篩選條件</button>
            {report ? <span className="text-xs text-[#809099]">{report.period.date_from}～{report.period.date_to} · {report.period.grain === "day" ? "日" : report.period.grain === "week" ? "週" : "月"}聚合</span> : null}
          </div>
        </form>
      </section>

      {managementError ? <div className="flex items-center justify-between gap-3 rounded-xl border border-[#F0C6C3] bg-[#FFF3F2] px-4 py-3 text-sm text-[#A43B34]" role="alert">{managementError}<button className="text-xs font-semibold underline" onClick={() => setManagementError("")} type="button">關閉</button></div> : null}
      {managementMessage ? <div className="rounded-xl border border-[#BFDCCB] bg-[#F1FAF4] px-4 py-3 text-sm font-semibold text-[#18794E]" role="status">{managementMessage}</div> : null}
      {report ? <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5 shadow-[0_8px_24px_rgba(23,36,42,0.03)] sm:p-6">
        <div className="grid gap-5 xl:grid-cols-2">
          <details className="rounded-xl border border-[#E7EDF0] bg-[#FBFDFE] p-4" open>
            <summary className="cursor-pointer font-bold text-[#17242A]">常用篩選</summary>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="text-sm font-semibold text-[#536168]">載入已保存條件<select className={inputClass} onChange={(event) => setSelectedSavedFilter(event.target.value)} value={selectedSavedFilter}><option value="">選擇常用篩選</option>{savedFilters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <button className={`${buttonClass} self-end border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`} disabled={!selectedSavedFilter} onClick={loadSavedFilter} type="button">套用</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="text-sm font-semibold text-[#536168]">保存目前日期與篩選<input className={inputClass} maxLength={80} onChange={(event) => setSavedFilterName(event.target.value)} placeholder="例如：本月 RFQ 追蹤" value={savedFilterName} /></label>
                <button className={`${buttonClass} self-end bg-[#005DAA] text-white hover:bg-[#00457F]`} disabled={!savedFilterName.trim()} onClick={() => void saveFilter()} type="button">保存</button>
              </div>
              <p className="text-xs text-[#809099]">只保存日期、篩選與事件條件；不保存客戶明細或原始事件。</p>
            </div>
          </details>

          <details className="rounded-xl border border-[#E7EDF0] bg-[#FBFDFE] p-4">
            <summary className="cursor-pointer font-bold text-[#17242A]">排程匯出</summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#536168] sm:col-span-2">排程名稱<input className={inputClass} maxLength={80} onChange={(event) => setScheduleName(event.target.value)} placeholder="例如：每週營運分析" value={scheduleName} /></label>
              <label className="text-sm font-semibold text-[#536168]">頻率<select className={inputClass} onChange={(event) => setScheduleFrequency(event.target.value as AnalyticsSchedule["frequency"])} value={scheduleFrequency}><option value="daily">每日</option><option value="weekly">每週</option><option value="monthly">每月</option></select></label>
              <label className="text-sm font-semibold text-[#536168]">台北時間<input className={inputClass} onChange={(event) => setScheduleTime(event.target.value)} type="time" value={scheduleTime} /></label>
              {scheduleFrequency === "weekly" ? <label className="text-sm font-semibold text-[#536168]">星期<select className={inputClass} onChange={(event) => setScheduleWeekday(event.target.value)} value={scheduleWeekday}><option value="0">日</option><option value="1">一</option><option value="2">二</option><option value="3">三</option><option value="4">四</option><option value="5">五</option><option value="6">六</option></select></label> : null}
              {scheduleFrequency === "monthly" ? <label className="text-sm font-semibold text-[#536168]">每月日期<input className={inputClass} max="31" min="1" onChange={(event) => setScheduleMonthDay(event.target.value)} type="number" value={scheduleMonthDay} /></label> : null}
              <div className="flex items-end sm:col-span-2"><button className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`} disabled={!scheduleName.trim()} onClick={() => void createSchedule()} type="button">建立排程</button></div>
            </div>
            {schedules.length ? <ul className="mt-4 space-y-2 border-t border-[#E7EDF0] pt-3 text-xs text-[#536168]">{schedules.slice(0, 5).map((schedule) => <li className="flex flex-wrap items-center justify-between gap-2" key={schedule.id}><span className="font-semibold">{schedule.name}</span><span>{schedule.frequency === "daily" ? "每日" : schedule.frequency === "weekly" ? "每週" : "每月"} {schedule.time_local.slice(0, 5)} · {schedule.is_active ? "啟用中" : "已停用"}</span><span className="flex gap-2"><button className="font-semibold text-[#00457F] underline" onClick={() => void toggleSchedule(schedule)} type="button">{schedule.is_active ? "停用" : "啟用"}</button><button className="font-semibold text-[#A43B34] underline" onClick={() => void deleteSchedule(schedule)} type="button">刪除</button></span></li>)}</ul> : <p className="mt-4 text-xs text-[#809099]">尚未建立排程。</p>}
          </details>

          <details className="rounded-xl border border-[#E7EDF0] bg-[#FBFDFE] p-4">
            <summary className="cursor-pointer font-bold text-[#17242A]">告警中心{alerts.length ? <span className="ml-2 rounded-full bg-[#FCE4C4] px-2 py-0.5 text-xs text-[#7A4B00]">{alerts.length}</span> : null}</summary>
            <div className="mt-4 space-y-3">{alerts.length ? alerts.slice(0, 5).map((alert) => <article className="rounded-lg border border-[#F0C6C3] bg-[#FFF8F7] p-3" key={alert.id}><div className="flex items-start justify-between gap-3"><div><h4 className="font-semibold text-[#8D302A]">{alert.title}</h4><p className="mt-1 text-sm text-[#536168]">{alert.message}</p></div><button className="shrink-0 text-xs font-semibold text-[#00457F] underline" onClick={() => void acknowledgeAlert(alert.id)} type="button">標記已讀</button></div></article>) : <p className="text-sm text-[#809099]">目前沒有未讀告警。</p>}</div>
          </details>

          <details className="rounded-xl border border-[#E7EDF0] bg-[#FBFDFE] p-4">
            <summary className="cursor-pointer font-bold text-[#17242A]">匯出歷史</summary>
            <div className="mt-4 overflow-x-auto">{exportHistory.length ? <table className="min-w-[600px] w-full text-left text-xs"><thead className="text-[#809099]"><tr><th className="pb-2">檔案</th><th className="pb-2">狀態</th><th className="pb-2">列數</th><th className="pb-2">建立時間</th><th className="pb-2">操作</th></tr></thead><tbody className="divide-y divide-[#E7EDF0]">{exportHistory.slice(0, 5).map((item) => <tr key={item.id}><td className="py-2 font-semibold">{item.file_name ?? "—"}</td><td className="py-2">{item.status === "succeeded" ? "已完成" : item.status === "failed" ? "失敗" : "處理中"}</td><td className="py-2">{number(item.row_count)}</td><td className="py-2">{new Date(item.created_at).toLocaleString("zh-TW")}</td><td className="py-2">{item.status === "succeeded" ? <button className="font-semibold text-[#00457F] underline" onClick={() => void downloadScheduledExport(item.id)} type="button">下載</button> : item.error_message ? <span className="text-[#A43B34]" title={item.error_message}>失敗原因</span> : "—"}</td></tr>)}</tbody></table> : <p className="text-sm text-[#809099]">尚未有排程匯出紀錄。</p>}</div>
          </details>
        </div>
      </section> : null}

      <ResourceState {...resource} hasData={!!report} />
      {error ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F0C6C3] bg-[#FFF3F2] px-4 py-3 text-sm text-[#A43B34]" role="alert"><span>{error}</span><button className={`${buttonClass} border border-[#D99B96] bg-white text-[#8D302A] hover:bg-[#FFE8E5]`} disabled={loading} onClick={() => void refresh()} type="button">重試</button></div> : null}
      {loading && !report ? <div className="rounded-2xl border border-[#D8E1E5] bg-white p-10 text-center text-sm text-[#536168]">正在整理 B2B 聚合資料…</div> : null}
      {report ? <>
        {report.totals.events === 0 ? <div className="rounded-xl border border-[#D8E1E5] bg-[#FBFDFE] px-4 py-3 text-sm text-[#536168]">此期間沒有資料；以下指標顯示為 0。</div> : null}
        <div aria-label="已套用條件" aria-live="polite" className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-[#536168]">已套用條件</span>{appliedConditions.map((chip) => <span className="rounded-full border border-[#B8CBD4] bg-white px-2.5 py-1 text-xs text-[#536168]" key={chip.key}>{chip.label}：{chip.value}</span>)}</div>
        <p className="mt-2 text-xs text-[#809099]">台北時間。{report.period.date_to === today ? "今天的資料尚未結束，不顯示前期比較。" : `前期比較：${report.comparison.period.date_from}～${report.comparison.period.date_to}。`}</p>
        {report.totals.active_companies > 0 && report.totals.active_companies < 5 ? <div className="rounded-xl border border-[#E8C27A] bg-[#FFF8E7] px-4 py-3 text-sm font-semibold text-[#7A4B00]" role="note">目前 {number(report.totals.active_companies)} 家企業，少於 5 家，依隱私規則隱藏明細。</div> : null}
        <section className="rounded-2xl border border-[#D8E1E5] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">客戶明細下鑽</h3><p className="mt-1 text-xs text-[#809099]">僅 Admin 可查看；只顯示企業層級聚合指標，不提供原始事件資料。</p></div><button className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`} disabled={report.totals.active_companies < 5 || drilldownLoading} onClick={() => void loadDrilldown(1)} type="button">{drilldownLoading ? "讀取中…" : "查看客戶明細"}</button></div>
          {report.totals.active_companies < 5 ? <p className="mt-3 rounded-lg bg-[#FFF8E7] px-3 py-2 text-sm text-[#7A4B00]">目前企業數少於 5 家，依隱私規則不可下鑽。</p> : null}
          {drilldown ? <div className="mt-4"><div className="flex flex-wrap items-end gap-3"><label className="min-w-[16rem] flex-1 text-sm font-semibold text-[#536168]">搜尋企業名稱或代碼<input className={inputClass} maxLength={120} onChange={(event) => setDrilldownSearch(event.target.value)} placeholder="輸入後按搜尋" value={drilldownSearch} /></label><button className={`${buttonClass} border border-[#B8CBD4] bg-white text-[#00457F] hover:bg-[#EAF5FB]`} onClick={() => void loadDrilldown(1)} type="button">搜尋</button><span className="text-xs text-[#809099]">共 {number(drilldown.total)} 家</span></div><div className="mt-4 overflow-x-auto"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-[#F4F7F8] text-xs text-[#536168]"><tr><th className="px-3 py-2">企業</th><th className="px-3 py-2">狀態</th><th className="px-3 py-2">事件</th><th className="px-3 py-2">使用者</th><th className="px-3 py-2">Session</th><th className="px-3 py-2">商品事件</th><th className="px-3 py-2">RFQ 事件</th><th className="px-3 py-2">詢價單</th><th className="px-3 py-2">最近活動</th></tr></thead><tbody className="divide-y divide-[#E7EDF0]">{drilldown.companies.map((company) => <tr key={company.id}><td className="px-3 py-3"><p className="font-semibold">{company.name}</p><p className="text-xs text-[#809099]">{company.client_code}</p></td><td className="px-3 py-3">{company.is_active ? "啟用" : "停用"}</td><td className="px-3 py-3">{number(company.event_count)}</td><td className="px-3 py-3">{number(company.active_users)}</td><td className="px-3 py-3">{number(company.active_sessions)}</td><td className="px-3 py-3">{number(company.product_events)}</td><td className="px-3 py-3">{number(company.rfq_events)}</td><td className="px-3 py-3">{number(company.rfq_count)}</td><td className="px-3 py-3">{new Date(company.last_activity_at).toLocaleString("zh-TW")}</td></tr>)}{!drilldown.companies.length ? <tr><td className="px-3 py-6 text-center text-[#809099]" colSpan={9}>目前沒有符合的客戶明細。</td></tr> : null}</tbody></table></div>{drilldown.total > TABLE_PAGE_SIZE ? <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#536168]"><span>第 {drilldown.page}／{Math.ceil(drilldown.total / TABLE_PAGE_SIZE)} 頁</span><div className="flex gap-2"><button className={`${buttonClass} min-h-8 border border-[#B8CBD4] bg-white px-2 text-xs text-[#00457F]`} disabled={drilldownPage === 1 || drilldownLoading} onClick={() => void loadDrilldown(drilldownPage - 1)} type="button">上一頁</button><button className={`${buttonClass} min-h-8 border border-[#B8CBD4] bg-white px-2 text-xs text-[#00457F]`} disabled={drilldownPage >= Math.ceil(drilldown.total / TABLE_PAGE_SIZE) || drilldownLoading} onClick={() => void loadDrilldown(drilldownPage + 1)} type="button">下一頁</button></div></div> : null}</div> : null}
        </section>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard change={change?.events} label="總事件數（含重複）" value={report.totals.events} />
          <MetricCard change={change?.active_companies} label="活躍企業" value={report.totals.active_companies} />
          <MetricCard change={change?.active_users} label="活躍使用者" value={report.totals.active_users} />
          <MetricCard change={change?.active_sessions} label="活躍 Session" value={report.totals.active_sessions} />
          <MetricCard change={change?.avg_events_per_active_company} label="每活躍企業平均事件數" value={report.totals.avg_events_per_active_company} />
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
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">Finder 行為</h3><div className="mt-4"><FunnelList funnel={report.funnels.finder} labels={{ start: "開始", answer: "回答問題", complete: "完成篩選", result_click: "點擊結果" }} /><div className="mt-5 overflow-x-auto"><table className="min-w-[420px] w-full text-left text-sm"><thead className="bg-[#F4F7F8] text-xs text-[#536168]"><tr><th className="px-3 py-2">問題／選項</th><th className="px-3 py-2">事件</th><th className="px-3 py-2">企業</th></tr></thead><tbody className="divide-y divide-[#E7EDF0]">{visibleFinderRows.map((row) => <tr key={`${row.question_key}-${row.option_id}`}><td className="px-3 py-3">{FINDER_QUESTION_LABELS[row.question_key] ?? row.question_key}／{FINDER_OPTION_LABELS[row.option_id] ?? row.option_id}</td><td className="px-3 py-3">{number(row.events)}</td><td className="px-3 py-3">{number(row.active_companies)}</td></tr>)}</tbody></table></div>{finderRows.length > TABLE_PAGE_SIZE ? <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#536168]"><span>第 {currentFinderPage + 1}／{finderPageCount} 頁</span><div className="flex gap-2"><button className={`${buttonClass} min-h-8 border border-[#B8CBD4] bg-white px-2 text-xs text-[#00457F]`} disabled={currentFinderPage === 0} onClick={() => setFinderPage((page) => Math.max(0, page - 1))} type="button">上一頁</button><button className={`${buttonClass} min-h-8 border border-[#B8CBD4] bg-white px-2 text-xs text-[#00457F]`} disabled={currentFinderPage >= finderPageCount - 1} onClick={() => setFinderPage((page) => Math.min(finderPageCount - 1, page + 1))} type="button">下一頁</button></div></div> : null}</div></div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">實際詢價統計</h3><p className="mt-1 text-xs text-[#809099]">此區來自 b2b_rfqs，與行為事件分開計算。</p><div className="mt-4 grid grid-cols-2 gap-3"><MetricCard label="詢價單" value={report.rfq_summary.rfqs} /><MetricCard label="詢價企業" value={report.rfq_summary.active_companies} /><MetricCard label="品項列" value={report.rfq_summary.line_items} /><MetricCard label="需求數量" value={report.rfq_summary.requested_quantity} /></div></div>
          <div className="rounded-2xl border border-[#D8E1E5] bg-white p-5"><h3 className="font-bold">詢價商品排名</h3><p className="mt-1 text-xs text-[#809099]">未滿 5 家企業的商品會合併為其他（已遮罩）。</p><div className="mt-4 overflow-x-auto"><table className="min-w-[620px] w-full text-left text-sm"><thead className="bg-[#F4F7F8] text-xs text-[#536168]"><tr><th className="px-3 py-2">商品</th><th className="px-3 py-2">詢價企業</th><th className="px-3 py-2">詢價單</th><th className="px-3 py-2">需求數量</th></tr></thead><tbody className="divide-y divide-[#E7EDF0]">{visibleRfqRows.map((row) => <tr key={`${row.product_id ?? "masked"}-${row.name ?? ""}`}><td className="px-3 py-3">{row.name ?? row.product_code ?? (row.product_id ?? "其他（已遮罩）")}</td><td className="px-3 py-3">{number(row.active_companies)}</td><td className="px-3 py-3">{number(row.rfqs)}</td><td className="px-3 py-3">{number(row.requested_quantity)}</td></tr>)}{!rfqRows.length ? <tr><td className="px-3 py-6 text-center text-[#809099]" colSpan={4}>目前沒有詢價商品資料。</td></tr> : null}</tbody></table></div>{rfqRows.length > TABLE_PAGE_SIZE ? <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#536168]"><span>第 {currentRfqPage + 1}／{rfqPageCount} 頁</span><div className="flex gap-2"><button className={`${buttonClass} min-h-8 border border-[#B8CBD4] bg-white px-2 text-xs text-[#00457F]`} disabled={currentRfqPage === 0} onClick={() => setRfqPage((page) => Math.max(0, page - 1))} type="button">上一頁</button><button className={`${buttonClass} min-h-8 border border-[#B8CBD4] bg-white px-2 text-xs text-[#00457F]`} disabled={currentRfqPage >= rfqPageCount - 1} onClick={() => setRfqPage((page) => Math.min(rfqPageCount - 1, page + 1))} type="button">下一頁</button></div></div> : null}</div>
        </section>

        <section className="rounded-2xl border border-[#C5D8E9] bg-[#EEF7FD] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h3 className="font-bold text-[#17242A]">下載聚合報表</h3><p className="mt-1 text-sm leading-6 text-[#536168]">選擇匯出用途；系統會記錄管理者、時間、用途、查詢範圍、格式與列數。CSV 不含原始事件、完整客戶代碼或公司明細。</p></div><div className="grid gap-3 sm:grid-cols-[11rem_minmax(14rem,1fr)_auto]"><label className="text-sm font-semibold text-[#536168]">匯出用途<select className={inputClass} onChange={(event) => setPurpose(event.target.value as typeof purpose)} value={purpose}>{EXPORT_PURPOSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-semibold text-[#536168]">備註（選填）<input className={inputClass} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="例如：月度營運會議" value={note} /></label><button className={`${buttonClass} bg-[#005DAA] text-white hover:bg-[#00457F]`} disabled={exporting} onClick={() => void download()} type="button">{exporting ? "產生中…" : "下載 CSV"}</button></div></div>{downloadMessage ? <p aria-live="polite" className="mt-3 text-sm font-semibold text-[#18794E]" role="status">{downloadMessage}</p> : null}</section>
      </> : null}
    </div>
  );
}

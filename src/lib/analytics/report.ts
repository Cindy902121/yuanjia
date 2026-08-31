import type { SupabaseClient } from "@supabase/supabase-js";

import { isUuid, parseCsv } from "@/lib/api";

import {
  B2B_ANALYTICS_EVENT_NAMES,
  type B2bAnalyticsEventName,
} from "@/lib/analytics-events";

const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REPORT_ROWS = 10000;
const MAX_EXPORT_ROWS = 10000;
const CSV_FIXED_ROWS = 1 + 4 + 4;

export type AnalyticsGrain = "day" | "week" | "month";

export type AnalyticsFilters = {
  customer_tier_snapshot: string[];
  channel_snapshot: string[];
  product_reference: string[];
  product_category: string[];
  product_brand: string[];
  event_name: B2bAnalyticsEventName[];
  filter_type: string[];
  finder_question: string[];
};

export type AnalyticsQuery = {
  dateFromValue: string;
  dateToValue: string;
  dateFrom: string;
  dateTo: string;
  previousDateFromValue: string;
  previousDateToValue: string;
  previousDateFrom: string;
  previousDateTo: string;
  days: number;
  grain: AnalyticsGrain;
  filters: AnalyticsFilters;
  rpcFilters: Record<string, string[]>;
};

type ParsedAnalyticsQuery = { error: string } | { query: AnalyticsQuery };

export type AnalyticsTotals = {
  events: number;
  active_companies: number;
  active_users: number;
  active_sessions: number;
  avg_events_per_active_company: number;
};

type CountRow = {
  events: number;
  active_companies: number;
  active_sessions: number;
};

export type AnalyticsReport = {
  totals: AnalyticsTotals;
  events_by_name: Array<CountRow & { event_name: string }>;
  trend: Array<CountRow & { date_bucket: string }>;
  tier_breakdown: Array<CountRow & { label: string }>;
  channel_breakdown: Array<CountRow & { label: string }>;
  product_ranking: Array<{
    product_id: string | null;
    product_code: string | null;
    name: string | null;
    category: string | null;
    brand: string | null;
    events: number;
    active_companies: number;
    product_views: number;
    rfq_adds: number;
    rfq_submits: number;
  }>;
  finder_answers: Array<{
    question_key: string;
    option_id: string;
    events: number;
    active_companies: number;
  }>;
  funnels: {
    main: Funnel;
    finder: Funnel;
  };
  rfq_summary: {
    rfqs: number;
    active_companies: number;
    line_items: number;
    requested_quantity: number;
  };
  rfq_product_ranking: Array<{
    product_id: string | null;
    product_code: string | null;
    name: string | null;
    category: string | null;
    brand: string | null;
    rfqs: number;
    active_companies: number;
    line_items: number;
    requested_quantity: number;
  }>;
  options: {
    tiers: string[];
    channels: string[];
    filter_types: string[];
    finder_questions: string[];
    products: Array<{
      id: string;
      product_code: string;
      name: string;
      category: string;
      brand: string;
    }>;
    event_names: string[];
  };
};

export type Funnel = {
  sessions: Record<string, number>;
  companies: Record<string, number>;
};

export type AnalyticsResponse = AnalyticsReport & {
  filters: AnalyticsFilters & { date_from: string; date_to: string };
  period: { date_from: string; date_to: string; days: number; grain: AnalyticsGrain };
  comparison: {
    period: { date_from: string; date_to: string };
    totals: Record<keyof AnalyticsTotals, { previous: number; absolute: number; percentage: number | null }>;
  };
};

function taipeiDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Taipei",
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : null;
}

function addDays(value: string, days: number) {
  const date = parseCalendarDate(value);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function taipeiIso(value: string, days = 0) {
  const shifted = addDays(value, days);
  const date = shifted ? parseCalendarDate(shifted) : null;
  return date ? new Date(date.getTime() - TAIPEI_OFFSET_MS).toISOString() : null;
}

function isBeyondTwentyFourMonths(from: string, to: string) {
  const date = parseCalendarDate(to);
  const minimum = parseCalendarDate(from);
  if (!date || !minimum) return true;
  date.setUTCMonth(date.getUTCMonth() - 24);
  return minimum < date;
}

type ParsedValues = { values: string[] } | { error: string };

function valuesFor(params: URLSearchParams, key: string): ParsedValues {
  const values = params.getAll(key);
  if (values.some((value) => value.trim() === "")) return { error: `${key} 篩選值不可為空。` };
  return { values: [...new Set(values.flatMap((value) => parseCsv(value)))] };
}

function dimensionValues(params: URLSearchParams, key: string) {
  const result = valuesFor(params, key);
  if ("error" in result) return result;
  if (result.values.some((value) => value.length > 120)) return { error: `${key} 篩選值過長。` };
  return result;
}

export function parseAnalyticsFilters(params: URLSearchParams, now = new Date()): ParsedAnalyticsQuery {
  const today = taipeiDateString(now);
  const defaultFrom = addDays(today, -89) as string;
  const dateFromValue = params.get("date_from") ?? defaultFrom;
  const dateToValue = params.get("date_to") ?? today;
  const fromDate = parseCalendarDate(dateFromValue);
  const toDate = parseCalendarDate(dateToValue);

  if (!fromDate || !toDate || fromDate > toDate) {
    return { error: "日期篩選格式不正確。" };
  }
  if (isBeyondTwentyFourMonths(dateFromValue, dateToValue)) {
    return { error: "日期範圍不可超過 24 個月。" };
  }

  const days = Math.round((toDate.getTime() - fromDate.getTime()) / DAY_MS) + 1;
  const grain: AnalyticsGrain = days <= 90 ? "day" : days <= 365 ? "week" : "month";
  const dateFrom = taipeiIso(dateFromValue);
  const dateTo = taipeiIso(dateToValue, 1);
  const previousDateToValue = addDays(dateFromValue, -1) as string;
  const previousDateFromValue = addDays(dateFromValue, -days) as string;
  const previousDateFrom = taipeiIso(previousDateFromValue);
  const previousDateTo = taipeiIso(previousDateToValue, 1);

  if (!dateFrom || !dateTo || !previousDateFrom || !previousDateTo) {
    return { error: "日期篩選格式不正確。" };
  }

  const rawFilters = [
    ["customer_tier_snapshot", "customer_tier_snapshot"],
    ["channel_snapshot", "channel_snapshot"],
    ["product_reference", "product_reference"],
    ["product_category", "product_category"],
    ["product_brand", "product_brand"],
    ["filter_type", "filter_type"],
    ["finder_question", "finder_question"],
  ] as const;
  const parsed = Object.fromEntries(
    rawFilters.map(([key]) => [key, dimensionValues(params, key)]),
  ) as Record<(typeof rawFilters)[number][0], ParsedValues>;
  for (const result of Object.values(parsed)) {
    if ("error" in result) return { error: result.error };
  }
  const valuesOf = (key: (typeof rawFilters)[number][0]) => {
    const result = parsed[key];
    return "values" in result ? result.values : [];
  };

  const productReference = valuesOf("product_reference");
  if (productReference.some((value) => !isUuid(value))) {
    return { error: "product_reference 篩選值格式不正確。" };
  }

  const eventNamesResult = valuesFor(params, "event_name");
  if ("error" in eventNamesResult) return { error: eventNamesResult.error };
  const eventNames = eventNamesResult.values;
  if (eventNames.some((value) => !B2B_ANALYTICS_EVENT_NAMES.includes(value as B2bAnalyticsEventName))) {
    return { error: "event_name 篩選值不在 B2B 事件白名單內。" };
  }

  const filters: AnalyticsFilters = {
    customer_tier_snapshot: valuesOf("customer_tier_snapshot"),
    channel_snapshot: valuesOf("channel_snapshot"),
    product_reference: productReference,
    product_category: valuesOf("product_category"),
    product_brand: valuesOf("product_brand"),
    event_name: eventNames as B2bAnalyticsEventName[],
    filter_type: valuesOf("filter_type"),
    finder_question: valuesOf("finder_question"),
  };

  return {
    query: {
      dateFromValue,
      dateToValue,
      dateFrom,
      dateTo,
      previousDateFromValue,
      previousDateToValue,
      previousDateFrom,
      previousDateTo,
      days,
      grain,
      filters,
      rpcFilters: {
        tiers: filters.customer_tier_snapshot,
        channels: filters.channel_snapshot,
        products: filters.product_reference,
        categories: filters.product_category,
        brands: filters.product_brand,
        event_names: filters.event_name,
        filter_types: filters.filter_type,
        finder_questions: filters.finder_question,
      },
    } satisfies AnalyticsQuery,
  };
}

const ZERO_TOTALS: AnalyticsTotals = {
  events: 0,
  active_companies: 0,
  active_users: 0,
  active_sessions: 0,
  avg_events_per_active_company: 0,
};

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0;
}

function takeRows<T>(value: unknown, budget: { remaining: number }) {
  const rows = Array.isArray(value) ? value : [];
  const result = rows.slice(0, Math.max(0, budget.remaining)) as T[];
  budget.remaining -= result.length;
  return result;
}

function normalizeReport(value: unknown): AnalyticsReport {
  const input = value && typeof value === "object" ? value as Partial<AnalyticsReport> : {};
  const totals = { ...ZERO_TOTALS, ...(input.totals ?? {}) };
  const budget = { remaining: MAX_REPORT_ROWS - CSV_FIXED_ROWS };
  return {
    totals: Object.fromEntries(
      Object.entries(totals).map(([key, item]) => [key, numberValue(item)]),
    ) as AnalyticsTotals,
    events_by_name: takeRows<AnalyticsReport["events_by_name"][number]>(input.events_by_name, budget),
    trend: takeRows<AnalyticsReport["trend"][number]>(input.trend, budget),
    tier_breakdown: takeRows<AnalyticsReport["tier_breakdown"][number]>(input.tier_breakdown, budget),
    channel_breakdown: takeRows<AnalyticsReport["channel_breakdown"][number]>(input.channel_breakdown, budget),
    product_ranking: takeRows<AnalyticsReport["product_ranking"][number]>(input.product_ranking, budget),
    finder_answers: takeRows<AnalyticsReport["finder_answers"][number]>(input.finder_answers, budget),
    funnels: input.funnels ?? {
      main: { sessions: {}, companies: {} },
      finder: { sessions: {}, companies: {} },
    },
    rfq_summary: input.rfq_summary ?? { rfqs: 0, active_companies: 0, line_items: 0, requested_quantity: 0 },
    rfq_product_ranking: takeRows<AnalyticsReport["rfq_product_ranking"][number]>(input.rfq_product_ranking, budget),
    options: {
      tiers: Array.isArray(input.options?.tiers) ? input.options.tiers.slice(0, MAX_REPORT_ROWS) : [],
      channels: Array.isArray(input.options?.channels) ? input.options.channels.slice(0, MAX_REPORT_ROWS) : [],
      filter_types: Array.isArray(input.options?.filter_types) ? input.options.filter_types.slice(0, MAX_REPORT_ROWS) : [],
      finder_questions: Array.isArray(input.options?.finder_questions) ? input.options.finder_questions.slice(0, MAX_REPORT_ROWS) : [],
      products: Array.isArray(input.options?.products) ? input.options.products.slice(0, MAX_REPORT_ROWS) : [],
      event_names: [...B2B_ANALYTICS_EVENT_NAMES],
    },
  };
}

async function callSummary(
  admin: SupabaseClient,
  query: AnalyticsQuery,
  dateFrom: string,
  dateTo: string,
) {
  const { data, error } = await admin.rpc("admin_b2b_analytics_summary", {
    p_date_from: dateFrom,
    p_date_to: dateTo,
    p_grain: query.grain,
    p_filters: query.rpcFilters,
  });
  if (error) throw new Error(error.message);
  return normalizeReport(data);
}

function delta(current: number, previous: number) {
  return {
    previous,
    absolute: current - previous,
    percentage: previous === 0 ? null : Number((((current - previous) / previous) * 100).toFixed(2)),
  };
}

export async function getB2bAnalyticsReport(
  admin: SupabaseClient,
  query: AnalyticsQuery,
): Promise<AnalyticsResponse> {
  const [current, previous] = await Promise.all([
    callSummary(admin, query, query.dateFrom, query.dateTo),
    callSummary(admin, query, query.previousDateFrom, query.previousDateTo),
  ]);

  const comparisonTotals = Object.fromEntries(
    Object.keys(ZERO_TOTALS).map((key) => [
      key,
      delta(
        current.totals[key as keyof AnalyticsTotals],
        previous.totals[key as keyof AnalyticsTotals],
      ),
    ]),
  ) as AnalyticsResponse["comparison"]["totals"];

  return {
    ...current,
    filters: { ...query.filters, date_from: query.dateFromValue, date_to: query.dateToValue },
    period: {
      date_from: query.dateFromValue,
      date_to: query.dateToValue,
      days: query.days,
      grain: query.grain,
    },
    comparison: {
      period: {
        date_from: query.previousDateFromValue,
        date_to: query.previousDateToValue,
      },
      totals: comparisonTotals,
    },
  };
}

export const ANALYTICS_CSV_HEADERS = [
  "section",
  "label",
  "sub_label",
  "date_bucket",
  "product_code",
  "product_name",
  "category",
  "brand",
  "events",
  "active_companies",
  "active_users",
  "active_sessions",
  "rfqs",
  "requested_quantity",
  "line_items",
  "product_views",
  "rfq_adds",
  "rfq_submits",
] as const;

type CsvRow = Partial<Record<(typeof ANALYTICS_CSV_HEADERS)[number], string | number | null>>;

export function reportToCsv(report: AnalyticsReport) {
  const rows: CsvRow[] = [
    {
      section: "summary",
      label: "B2B 行為總計",
      events: report.totals.events,
      active_companies: report.totals.active_companies,
      active_users: report.totals.active_users,
      active_sessions: report.totals.active_sessions,
      rfqs: report.rfq_summary.rfqs,
    },
    ...report.tier_breakdown.map((row) => ({ section: "tier", ...row })),
    ...report.channel_breakdown.map((row) => ({ section: "channel", ...row })),
    ...report.events_by_name.map((row) => ({ section: "event", label: row.event_name, ...row })),
    ...report.trend.map((row) => ({ section: "trend", ...row })),
    ...report.product_ranking.map((row) => ({
      section: "product_behavior",
      product_code: row.product_code,
      product_name: row.name,
      category: row.category,
      brand: row.brand,
      events: row.events,
      active_companies: row.active_companies,
      product_views: row.product_views,
      rfq_adds: row.rfq_adds,
      rfq_submits: row.rfq_submits,
    })),
    ...report.finder_answers.map((row) => ({
      section: "finder_answer",
      label: row.question_key,
      sub_label: row.option_id,
      events: row.events,
      active_companies: row.active_companies,
    })),
    ...report.rfq_product_ranking.map((row) => ({
      section: "rfq_product",
      product_code: row.product_code,
      product_name: row.name,
      category: row.category,
      brand: row.brand,
      active_companies: row.active_companies,
      rfqs: row.rfqs,
      requested_quantity: row.requested_quantity,
      line_items: row.line_items,
    })),
    ...Object.entries(report.funnels.main.sessions).map(([label, events]) => ({
      section: "main_funnel",
      label,
      events,
      active_companies: report.funnels.main.companies[label] ?? 0,
    })),
    ...Object.entries(report.funnels.finder.sessions).map(([label, events]) => ({
      section: "finder_funnel",
      label,
      events,
      active_companies: report.funnels.finder.companies[label] ?? 0,
    })),
  ];

  if (rows.length > MAX_EXPORT_ROWS) {
    throw new Error("分析匯出資料超過單次上限。" );
  }

  const csvValue = (value: string | number | null | undefined) => {
    const textValue = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(textValue) ? `"${textValue.replaceAll('"', '""')}"` : textValue;
  };
  return [
    ANALYTICS_CSV_HEADERS.join(","),
    ...rows.map((row) => ANALYTICS_CSV_HEADERS.map((header) => csvValue(row[header])).join(",")),
  ].join("\r\n");
}

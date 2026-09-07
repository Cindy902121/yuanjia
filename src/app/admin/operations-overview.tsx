"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { changeAdminQuery, adminDate } from "./admin-navigation";
import { useAdminResource } from "./use-admin-resource";
import { ResourceState } from "./resource-state";
import { AnalyticsOverview } from "./overview-analytics";
import s from "./admin-workspace.module.css";

type Summary = { metrics: Record<string, number | null>; updated_at: string; metricTimes?: Record<string, string>; failedKeys?: string[] };
function mergeSummary(previous: Summary | undefined, incoming: Summary, at: string): Summary {
  const metrics = { ...incoming.metrics }, metricTimes: Record<string, string> = {}, failedKeys: string[] = [];
  for (const key of Object.keys(metrics)) {
    if (metrics[key] === null) {
      failedKeys.push(key); metrics[key] = previous?.metrics[key] ?? null;
      if (previous?.metricTimes?.[key]) metricTimes[key] = previous.metricTimes[key];
    } else metricTimes[key] = at;
  }
  return { ...incoming, metrics, metricTimes, failedKeys };
}
type RfqResponse = { rfqs: Array<{ id: string; created_at: string; company: { name: string } | null; items: Array<{ product: { name: string } | null }> }> };
const catalogStates = [["draft", "草稿"], ["review", "待審核"], ["published", "已發布"], ["offline", "已下架"]] as const;

export function OperationsOverview({ revision, scope }: { revision: number; scope: "admin" | "business" }) {
  const params = useSearchParams();
  const queueStatus = params.get("queue") === "processing" ? "processing" : "new";
  const summary = useAdminResource<Summary>("/api/admin/workspace-summary", revision, mergeSummary);
  const queue = useAdminResource<RfqResponse>(`/api/admin/rfqs?status=${queueStatus}&sort=oldest&page_size=5`, revision);
  const base = scope === "business" ? "/admin/business" : "/admin";
  const cards = [
    { key: "new", label: "新詢價", note: "待開始處理", href: `${base}?tab=b2b-rfqs&rfq_status=new&rfq_sort=oldest` },
    { key: "processing", label: "處理中詢價", note: "持續追蹤", href: `${base}?tab=b2b-rfqs&rfq_status=processing&rfq_sort=oldest` },
    { key: "review", label: "待審商品", note: "檢視商品內容", href: `${base}?tab=b2b-products&product_status=review` },
  ];
  const failed = !!summary.data?.failedKeys?.length;
  function metricNote(key: string) { return summary.data?.failedKeys?.includes(key) ? <small className={s.caption}>{summary.data.metrics[key] === null ? "讀取失敗，尚無數值" : `上次資料：${adminDate(summary.data.metricTimes?.[key])}`}</small> : null; }
  const dates = new URLSearchParams();
  for (const key of ["date_from", "date_to"]) if (params.has(key)) dates.set(key, params.get(key)!);
  function keepDates(href: string) { return `${href}${dates.size ? `${href.includes("?") ? "&" : "?"}${dates}` : ""}`; }
  return <div className={s.stack}>
    <section aria-label="目前待辦" aria-busy={summary.pending}>
      <div className={s.headingRow}><h2 className={s.heading}>目前待辦</h2><span className={s.muted}>全部未完成工作 · 不受報表日期影響</span></div>
      <div className={s.metrics}>{cards.map((card) => <Link className={s.metric} href={keepDates(card.href)} key={card.key} scroll={false}>
        <span className={s.metricLabel}>{card.label}</span>
        <strong className={s.metricValue}>{summary.data?.metrics[card.key]?.toLocaleString("zh-TW") ?? "—"}<small>筆</small></strong>
        {metricNote(card.key)}<span className={s.metricFoot}><span>{card.note}</span><span aria-hidden="true">↗</span></span>
      </Link>)}</div>
      <ResourceState {...summary} hasData={!!summary.data} error={summary.error ?? (failed ? "部分統計更新失敗；失敗指標保留其標示時間的舊值，尚無成功值則顯示 —。" : undefined)} />
    </section>
    <div className={s.columns}>
      <section className={s.panel} aria-busy={queue.pending}>
        <div className={s.headingRow}><div><h2 className={s.heading}>詢價待辦</h2><p className={s.caption}>每個狀態內，最早建立的案件在前</p></div><Link className={s.textButton} href={`${base}?tab=b2b-rfqs&rfq_status=${queueStatus}&rfq_sort=oldest`}>查看全部 <span aria-hidden="true">→</span></Link></div>
        <div className={s.segment} aria-label="詢價待辦狀態">{[["new", "新詢價"], ["processing", "處理中"]].map(([value, label]) => <button type="button" key={value} aria-pressed={queueStatus === value} onClick={() => changeAdminQuery({ queue: value })}>{label}</button>)}</div>
        {!queue.data && queue.pending ? <div className={s.skeleton}>正在整理詢價…</div> : null}
        <div className={s.queue}>{queue.data?.rfqs.map((rfq) => <article className={s.queueRow} key={rfq.id}>
          <div><p className={s.company}>{rfq.company?.name ?? "未綁定企業"}</p><p className={s.caption}>{adminDate(rfq.created_at)} 建立 · {rfq.items.length} 項商品</p><p className={s.caption}>{rfq.items.slice(0, 2).map((item) => item.product?.name ?? "商品資料已異動").join("、")}</p></div>
          <Link className={s.textButton} aria-label={`查看 ${rfq.company?.name ?? "企業"} 的詢價 ${rfq.id.slice(0, 8)}`} href={`${base}?tab=b2b-rfqs&rfq_status=${queueStatus}&rfq_sort=oldest&rfq_id=${rfq.id}`}>查看詢價 <span aria-hidden="true">→</span></Link>
        </article>)}</div>
        {queue.data?.rfqs.length === 0 ? <div className={s.empty}>{queueStatus === "new" ? "目前沒有新詢價。新的企業需求會顯示在這裡。" : "目前沒有處理中的詢價。"}</div> : null}
        <ResourceState {...queue} hasData={!!queue.data} />
      </section>
      <section className={s.panel}>
        <div className={s.headingRow}><h2 className={s.heading}>型錄狀態</h2><span className={s.badge}>B2B</span></div>
        {catalogStates.map(([key, label]) => <Link key={key} className={s.catalogRow} href={keepDates(`${base}?tab=b2b-products&product_status=${key}`)}><span className={s.badge} data-status={key}>{label}</span><strong>{summary.data?.metrics[key]?.toLocaleString("zh-TW") ?? "—"}</strong>{metricNote(key)}</Link>)}
        <Link className={s.catalogRow} href={keepDates(`${base}?tab=b2b-products&missing_images=true`)}><span>尚無圖片</span><strong>{summary.data?.metrics.missing_images?.toLocaleString("zh-TW") ?? "—"}</strong>{metricNote("missing_images")}</Link>
        <p className={s.caption}>點擊狀態查看商品。尚無圖片可能與上述狀態重疊。</p>
        <Link className={s.textButton} href="/admin/business/products/new">新增 B2B 商品 <span aria-hidden="true">＋</span></Link>
      </section>
    </div>
    {scope === "admin" ? <AnalyticsOverview revision={revision} /> : null}
    <section><div className={s.headingRow}><h2 className={s.heading}>其他管理</h2>{scope === "admin" ? <span className={s.muted}>B2C 訂單為展示用途</span> : null}</div><div className={s.footerLinks}>
      {scope === "admin" ? <><Link className={s.textButton} href="/admin?tab=b2c-orders">B2C 展示訂單 →</Link><Link className={s.textButton} href="/admin?tab=b2b-companies">企業會員 →</Link><Link className={s.textButton} href="/admin?tab=b2c-products">B2C 商品 →</Link></> : null}
      <Link className={s.textButton} href={`${base}?tab=b2b-products`}>商品與 CSV 匯入 →</Link>
    </div></section>
  </div>;
}

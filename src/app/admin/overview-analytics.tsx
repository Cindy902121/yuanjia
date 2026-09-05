"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { AnalyticsResponse } from "@/lib/analytics/report";
import { changeAdminQuery } from "./admin-navigation";
import { useAdminResource } from "./use-admin-resource";
import { ResourceState } from "./resource-state";
import s from "./admin-workspace.module.css";

function day(date: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
function shift(value: string, days: number) { const date = new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); }
export function AnalyticsOverview({ revision }: { revision: number }) {
  const params = useSearchParams();
  // Default to complete days so today's partial count is not mistaken for a decline.
  const today = day(new Date()), yesterday = shift(today, -1);
  const from = params.get("date_from") ?? shift(yesterday, -6), to = params.get("date_to") ?? yesterday;
  const [dateError, setDateError] = useState("");
  const resource = useAdminResource<AnalyticsResponse>(`/api/admin/analytics/summary?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}`, revision);
  const report = resource.data;
  const trend = report?.trend ?? [];
  const max = Math.max(1, ...trend.map((row) => row.active_companies));
  const points = trend.map((row, index) => `${40 + index * 650 / Math.max(1, trend.length - 1)},${140 - row.active_companies / max * 110}`).join(" ");
  function applyDates(start: string, end: string) {
    if (!start || !end || start > end || end > today) { setDateError("請選擇有效日期，起日不得晚於迄日，且不可晚於今天。"); return; }
    setDateError(""); changeAdminQuery({ date_from: start, date_to: end });
  }
  return <section className={s.panel} aria-busy={resource.pending}>
    <div className={s.headingRow}><div><h2 className={s.heading}>B2B 使用概況</h2><p className={s.caption}>台北時間 · {from} 至 {to}{to === today ? " · 今天的資料尚未結束" : " · 完整日期"}</p></div><Link className={s.textButton} href={`/admin?tab=analytics&date_from=${from}&date_to=${to}`}>完整分析報表 →</Link></div>
    <div className={s.actions}>{[7, 30].map((days) => <button className={s.button} key={days} type="button" onClick={() => applyDates(shift(yesterday, 1 - days), yesterday)}>最近 {days} 個完整日</button>)}<details><summary className={s.textButton}>自訂日期</summary><form className={s.toolbar} key={`${from}-${to}`} onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); applyDates(String(values.get("from")), String(values.get("to"))); }}>
      <label>開始日期<input className={s.input} type="date" name="from" required defaultValue={from} max={today} /></label><label>結束日期<input className={s.input} type="date" name="to" required defaultValue={to} max={today} /></label><button className={s.primary}>套用日期</button>
    </form></details></div>
    {dateError ? <p className={s.error} role="alert">{dateError}</p> : null}
    {!report && resource.pending ? <div className={s.skeleton}>正在讀取使用概況…</div> : null}
    {report ? <>
      <div className={s.analyticsMetrics}><div className={s.muted}>區間活躍企業<strong>{report.totals.active_companies.toLocaleString("zh-TW")} <small className={s.muted}>家</small></strong><p className={s.caption}>期間內有活動的企業，去重計算</p></div><div className={s.muted}>詢價單數<strong>{report.rfq_summary.rfqs.toLocaleString("zh-TW")} <small className={s.muted}>筆</small></strong><p className={s.caption}>依詢價單計算，非送出事件次數</p></div></div>
      <h3 className={s.company}>{report.period.grain === "day" ? "每日" : report.period.grain === "week" ? "每週" : "每月"}活躍企業</h3>
      {trend.length >= 4 ? <svg className={s.chart} viewBox="0 0 720 170" role="img" aria-label={`活躍企業趨勢，${trend.length} 個時間區間；各區間最多 ${max} 家。完整數值見下方資料表。`}>
        {[0, 1].map((part) => <g key={part}><line className={s.chartGrid} x1="40" x2="690" y1={140 - part * 110} y2={140 - part * 110} /><text className={s.chartLabel} x="4" y={144 - part * 110}>{part * max}</text></g>)}
        <polyline className={s.chartLine} points={points} />{trend.map((row, index) => <circle key={row.date_bucket} className={s.chartDot} cx={40 + index * 650 / Math.max(1, trend.length - 1)} cy={140 - row.active_companies / max * 110} r="3" />)}
        <text className={s.chartLabel} x="40" y="164">{trend[0].date_bucket.slice(0, 10)}</text><text className={s.chartLabel} x="690" y="164" textAnchor="end">{trend[trend.length - 1].date_bucket.slice(0, 10)}</text>
      </svg> : <p className={s.empty}>{trend.length ? "資料點較少，請查看下方數值。" : "此期間沒有活動紀錄。"}</p>}
      {trend.length ? <details><summary className={s.textButton}>查看趨勢資料（{trend.length} 個區間）</summary><div className={s.tableWrap}><table className={s.table}><caption className={s.caption}>各區間活躍企業不可相加作為期間去重總數。</caption><thead><tr><th scope="col">日期</th><th scope="col">活躍企業（家）</th></tr></thead><tbody>{trend.map((row) => <tr key={row.date_bucket}><td>{row.date_bucket.slice(0, 10)}</td><td>{row.active_companies.toLocaleString("zh-TW")}</td></tr>)}</tbody></table></div></details> : null}
    </> : null}
    <ResourceState {...resource} hasData={!!report} />
  </section>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { validRfqId } from "@/lib/admin-view";
import { adminDate, changeAdminQuery, openRfq, returnToRfqs } from "./admin-navigation";
import { adminRequest, AdminRequestError } from "./admin-request";
import { useAdminResource } from "./use-admin-resource";
import { ResourceState } from "./resource-state";
import s from "./admin-workspace.module.css";

export type RfqRecord = {
  id: string; status: "new" | "processing" | "closed"; updated_at: string; created_at: string;
  total_note: string | null; company: { name: string; client_code: string } | null;
  items: Array<{ id: string; quantity: number | string; unit: string; item_note: string | null;
    specification_text_snapshot?: string | null; packaging_text_snapshot?: string | null;
    other_specification?: string | null; other_packaging?: string | null;
    product: { name: string; product_code: string } | null }>;
};
export type RfqResponse = { rfqs: RfqRecord[]; total: number; page: number; page_size: number };
const labels = { new: "新詢價", processing: "處理中", closed: "已結案" };

export function RfqWorkspace({ revision }: { revision: number }) {
  const params = useSearchParams();
  const status = params.get("rfq_status") ?? "new", sort = params.get("rfq_sort") ?? "oldest";
  const page = Math.max(1, Number(params.get("rfq_page")) || 1), id = params.get("rfq_id");
  const invalidId = id !== null && (!validRfqId(id) || params.getAll("rfq_id").length > 1);
  const query = id ? `id=${encodeURIComponent(id)}` : `page=${page}&page_size=25&sort=${sort}${status !== "all" ? `&status=${status}` : ""}`;
  const resource = useAdminResource<RfqResponse>(invalidId ? null : `/api/admin/rfqs?${query}`, revision);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const locked = useRef(false), focusedView = useRef<string | null>(null);
  const rows = resource.data?.rfqs ?? [], detail = id ? rows[0] : undefined;
  const pages = Math.max(1, Math.ceil((resource.data?.total ?? 0) / 25));
  useEffect(() => {
    if (id || !resource.data || page <= pages) return;
    changeAdminQuery({ rfq_page: String(pages) }, true);
    const timer = window.setTimeout(() => setMessage("資料已更新，已調整頁碼。"), 0);
    return () => window.clearTimeout(timer);
  }, [id, page, pages, resource.data]);
  useEffect(() => {
    if (!resource.data && !invalidId) return;
    const view = id ?? `list:${status}:${sort}:${page}`;
    if (focusedView.current === view) return;
    focusedView.current = view;
    const timer = window.setTimeout(() => {
      const previous = !id ? window.history.state : null;
      const focus = previous?.adminFocus && document.getElementById(previous.adminFocus);
      (focus || document.getElementById("rfq-heading"))?.focus({ preventScroll: true });
      if (!id && Number.isFinite(previous?.adminScroll)) window.scrollTo({ top: previous.adminScroll, behavior: "instant" });
      if (!id && previous?.adminFocus && !focus) setMessage("案件可能已移出目前條件，已返回詢價清單。");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id, status, sort, page, resource.data, invalidId]);
  async function update(next: RfqRecord["status"]) {
    if (!detail || locked.current || conflict) return;
    if ((next === "closed" || detail.status === "closed") && !window.confirm(`將 ${detail.company?.name ?? "企業"} 的詢價 ${detail.id.slice(0, 8)} 更新為「${labels[next]}」？`)) return;
    locked.current = true; setBusy(true); setMessage("");
    try {
      await adminRequest("/api/admin/rfqs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rfq_id: detail.id, status: next, expected_updated_at: detail.updated_at }) });
      const loaded = await resource.reload();
      setMessage(loaded ? `詢價已更新為${labels[next]}。返回後將依原條件顯示清單。` : "已儲存，但最新資料讀取失敗。請重新讀取，勿重送操作。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "目前無法更新詢價。");
      if (error instanceof AdminRequestError && [0, 409].includes(error.status)) setConflict(true);
    } finally { locked.current = false; setBusy(false); }
  }
  return <section className={s.panel} aria-busy={resource.pending || busy}>
    <div className={s.headingRow}><h2 id="rfq-heading" tabIndex={-1} className={s.heading}>{id ? "詢價詳情" : "企業詢價"}</h2>{id ? <button type="button" className={s.textButton} onClick={returnToRfqs}>← 返回詢價清單</button> : null}</div>
    {message ? <p role="status" className={s.muted}>{message}</p> : null}
    {conflict ? <button type="button" className={s.button} disabled={resource.pending} onClick={async () => { if (await resource.reload()) { setConflict(false); setMessage("已重新讀取，請核對狀態後再操作。"); } }}>重新讀取核對</button> : null}
    {invalidId ? <p className={s.empty}>詢價連結格式不正確。</p> : null}
    {!id ? <div className={s.toolbar}>
      <label>詢價狀態<select className={s.input} value={status} onChange={(e) => { focusedView.current = null; changeAdminQuery({ rfq_status: e.target.value, rfq_page: "1", rfq_id: null }); }}><option value="all">全部狀態</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>排序<select className={s.input} value={sort} onChange={(e) => changeAdminQuery({ rfq_sort: e.target.value, rfq_page: "1", rfq_id: null })}><option value="oldest">最早建立優先</option><option value="newest">最新建立優先</option></select></label>
      <button type="button" className={s.button} onClick={() => changeAdminQuery({ rfq_status: null, rfq_sort: null, rfq_page: null })}>清除篩選</button>
    </div> : null}
    {!resource.data && resource.pending ? <div className={s.skeleton}>正在讀取詢價…</div> : null}
    {detail ? <>
      <div className={s.headingRow}><div><h3 className={s.company}>{detail.company?.name ?? "未綁定企業"}</h3><p className={s.caption}>詢價編號：{detail.id}</p><p className={s.caption}>{adminDate(detail.created_at)} 建立 · {detail.company?.client_code ?? "無企業代碼"}</p></div><span className={s.badge} data-status={detail.status}>{labels[detail.status]}</span></div>
      <ul className={s.detailItems}>{detail.items.map((item) => <li key={item.id}><p className={s.company}>{item.product?.name ?? "商品資料已異動"}</p><p>{item.quantity} {item.unit}</p><p className={s.muted}>規格：{item.specification_text_snapshot || item.other_specification || "未填寫"}</p><p className={s.muted}>包裝：{item.packaging_text_snapshot || item.other_packaging || "未填寫"}</p>{item.item_note ? <p className={s.muted}>品項備註：{item.item_note}</p> : null}</li>)}</ul>
      <p className={s.muted}>整單備註：{detail.total_note || "無"}</p>
      <div className={s.toolbar}>{Object.entries(labels).filter(([value]) => value !== detail.status).map(([value]) => <button type="button" className={s.primary} disabled={busy || conflict || resource.pending || !!resource.error} key={value} onClick={() => void update(value as RfqRecord["status"])}>{busy ? "更新中…" : value === "new" ? "標記為新詢價" : value === "processing" ? detail.status === "closed" ? "重新處理" : "開始處理" : "結案"}</button>)}</div>
    </> : !id ? <>
      <div className={s.queue}>{rows.map((row) => <article className={s.queueRow} key={row.id}><div><p className={s.company}>{row.company?.name ?? "未綁定企業"} <span className={s.badge} data-status={row.status}>{labels[row.status]}</span></p><p className={s.caption}>{adminDate(row.created_at)} · {row.id.slice(0, 8)} · {row.items.length} 項商品</p><p className={s.muted}>{row.items.slice(0, 2).map((item) => item.product?.name ?? "商品資料已異動").join("、")}</p></div><button id={`rfq-${row.id}`} type="button" className={s.textButton} onClick={() => openRfq(row.id)}>查看詢價 →</button></article>)}</div>
      {resource.data && !rows.length ? <p className={s.empty}>目前沒有符合條件的詢價。</p> : null}
      {resource.data ? <div className={s.headingRow}><span className={s.caption}>共 {resource.data.total} 筆 · 第 {page}／{pages} 頁</span><div className={s.actions}><button type="button" className={s.button} disabled={page <= 1 || resource.pending} onClick={() => changeAdminQuery({ rfq_page: String(page - 1) })}>上一頁</button><button type="button" className={s.button} disabled={page >= pages || resource.pending} onClick={() => changeAdminQuery({ rfq_page: String(page + 1) })}>下一頁</button></div></div> : null}
    </> : resource.data ? <p className={s.empty}>找不到此詢價。</p> : null}
    {!invalidId ? <ResourceState {...resource} hasData={!!resource.data} /> : null}
  </section>;
}

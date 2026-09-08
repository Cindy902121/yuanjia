import { adminDate } from "./admin-navigation";
import s from "./admin-workspace.module.css";

export function ResourceState({ pending, error, updatedAt, reload, hasData, stale }: { pending: boolean; error?: string; updatedAt?: string; reload: () => void; hasData: boolean; stale?: boolean }) {
  return <div className={s.resourceState} role="status">
    <span>{pending ? "更新中…" : error ? `${error}${hasData ? ` 顯示上次資料（${adminDate(updatedAt)}）。` : ""}` : `上次讀取成功：${adminDate(updatedAt)} · 台北時間`}{stale && !pending ? " · 資料可能已變更，可重新整理。" : ""}</span>
    {error ? <button type="button" className={s.textButton} onClick={reload}>重新讀取</button> : null}
  </div>;
}

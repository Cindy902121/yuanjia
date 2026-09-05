import { adminDate } from "./admin-navigation";
import s from "./admin-workspace.module.css";

export function ResourceState({ pending, error, updatedAt, reload, hasData }: { pending: boolean; error?: string; updatedAt?: string; reload: () => void; hasData: boolean }) {
  return <div className={s.resourceState} role="status">
    <span>{pending ? "更新中…" : error ? `${error}${hasData ? " 顯示上次資料。" : ""}` : `更新於 ${adminDate(updatedAt)} · 台北時間`}</span>
    {error ? <button type="button" className={s.textButton} onClick={reload}>重新讀取</button> : null}
  </div>;
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminRequest, AdminRequestError } from "./admin-request";
type Result<T> = { url: string | null; data?: T; updatedAt?: string; error?: string; status?: number };
// Same-query failures retain data. New queries and access failures cannot show another view's data.
export function useAdminResource<T>(url: string | null, revision = 0, merge?: (previous: T | undefined, incoming: T, at: string) => T) {
  const [result, setResult] = useState<Result<T>>({ url: null });
  const [pending, setPending] = useState(false), [stale, setStale] = useState(false);
  const generation = useRef(0), controller = useRef<AbortController | null>(null);
  const current = useRef<Result<T>>({ url: null });
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const id = ++generation.current;
    if (!url) { current.current = { url }; setResult(current.current); setPending(false); return false; }
    setPending(true);
    try {
      const data = await adminRequest<T>(url, { signal: AbortSignal.any([abort.signal, AbortSignal.timeout(30000)]) });
      if (abort.signal.aborted || id !== generation.current) return false;
      const updatedAt = new Date().toISOString();
      current.current = { url, data: merge ? merge(current.current.url === url ? current.current.data : undefined, data, updatedAt) : data, updatedAt };
      setResult(current.current); setStale(false); return true;
    } catch (error) {
      if (abort.signal.aborted || id !== generation.current) return false;
      const status = error instanceof AdminRequestError ? error.status : 0;
      current.current = { ...(current.current.url === url && status !== 401 && status !== 403 ? current.current : { url }), status, error: error instanceof Error ? error.message : "目前無法讀取資料。" };
      setResult(current.current); return false;
    } finally { if (!abort.signal.aborted && id === generation.current) setPending(false); }
  }, [url, merge]);
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    const invalidate = () => void refresh();
    const access = () => { controller.current?.abort(); current.current = { url }; setResult(current.current); setPending(false); };
    window.addEventListener("admin-data-change", invalidate); window.addEventListener("admin-access-error", access);
    return () => { window.clearTimeout(timer); controller.current?.abort(); window.removeEventListener("admin-data-change", invalidate); window.removeEventListener("admin-access-error", access); };
  }, [refresh, revision, url]);
  useEffect(() => {
    if (!result.updatedAt) return;
    const timer = window.setTimeout(() => setStale(true), Math.max(0, 300000 - (Date.now() - Date.parse(result.updatedAt))));
    return () => window.clearTimeout(timer);
  }, [result.updatedAt]);
  return { data: result.url === url ? result.data : undefined, error: result.url === url ? result.error : undefined, updatedAt: result.url === url ? result.updatedAt : undefined, pending: !!url && (pending || result.url !== url), stale, reload: refresh };
}

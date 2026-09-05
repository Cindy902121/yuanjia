"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Keep prior data only for the same query. A filter change must never show another filter's rows.
export function useAdminResource<T>(url: string, revision = 0) {
  const [result, setResult] = useState<{ url: string; data?: T; updatedAt?: string; error?: string }>({ url });
  const [pending, setPending] = useState(true);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const reload = useCallback(() => setRetry((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const id = ++generation.current;
    const timer = window.setTimeout(async () => {
      setPending(true);
      try {
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "目前無法讀取資料。");
        if (id === generation.current && !controller.signal.aborted) {
          setResult({ url, data: body, updatedAt: new Date().toISOString() });
        }
      } catch (error) {
        if (!controller.signal.aborted && id === generation.current) {
          setResult((previous) => ({ ...(previous.url === url ? previous : { url }), error: error instanceof Error ? error.message : "目前無法讀取資料。" }));
        }
      } finally {
        if (!controller.signal.aborted && id === generation.current) setPending(false);
      }
    }, 0);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [url, revision, retry]);
  return { data: result.url === url ? result.data : undefined, error: result.url === url ? result.error : undefined, updatedAt: result.url === url ? result.updatedAt : undefined, pending: pending || result.url !== url, reload };
}

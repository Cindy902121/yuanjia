export class AdminRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function adminRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...init, cache: "no-store", signal: init.signal ?? AbortSignal.timeout(30000) }); }
  catch (error) {
    if (init.signal?.aborted) throw error;
    throw new AdminRequestError(init.method && init.method !== "GET" ? "操作結果尚未確認，請先重新讀取資料，勿重複送出。" : "連線中斷或讀取逾時，請重新讀取。", 0);
  }
  let body;
  try { body = await response.json(); } catch {
    throw new AdminRequestError(init.method && init.method !== "GET" ? "操作結果尚未確認，請先重新讀取資料。" : "回應格式不正確，請重新讀取。", 0);
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) window.dispatchEvent(new CustomEvent("admin-access-error", { detail: response.status }));
    throw new AdminRequestError(body.error ?? "目前無法完成操作。", response.status);
  }
  return body as T;
}

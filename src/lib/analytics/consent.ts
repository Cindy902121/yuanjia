/**
 * GA4 追蹤同意狀態，存瀏覽器（P1-2，C 提出「確認 Cookie／同意政策」）。
 *
 * 刻意照抄 src/lib/cart/store.ts 的 useSyncExternalStore 模式，不是在
 * GoogleAnalytics.tsx 裡用 `useEffect` 讀 localStorage 再 `setState`——
 * 那個寫法會被這個專案的 lint 規則（`react-hooks/set-state-in-effect`）擋
 * 下來（effect 內同步 setState 可能引發連鎖 render），B2CHelpWidget.tsx
 * 之前也踩過同一條規則、用別的方式繞開（見該檔案 242 行附近註解）。這裡
 * 用 store 模式從根本上不會踩到這條規則：`getConsentSnapshot()` 是在
 * render 當下同步呼叫，不是 effect 裡才呼叫的 setState。
 */

const STORAGE_KEY = "ga_consent";
const CHANGE_EVENT = "yuanjia:ga-consent-change";

export type ConsentValue = "unknown" | "granted" | "denied";

function isBrowser() {
  return typeof window !== "undefined";
}

function readRaw(): ConsentValue {
  if (!isBrowser()) {
    return "unknown";
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "granted" || raw === "denied" ? raw : "unknown";
  } catch {
    // 讀不到（無痕模式封鎖、瀏覽器設定等）時維持 "unknown"——寧可每次都
    // 重新問一次，也不要在讀不到偏好時直接假設同意。
    return "unknown";
  }
}

let cache: ConsentValue | null = null;

/** 目前同意狀態的快照（給 useSyncExternalStore 的 getSnapshot 用）。 */
export function getConsentSnapshot(): ConsentValue {
  if (cache === null) {
    cache = readRaw();
  }
  return cache;
}

/** SSR 時沒有 localStorage，固定回傳 "unknown"，跟瀏覽器端第一次讀到的狀態一致。 */
export function getServerConsentSnapshot(): ConsentValue {
  return "unknown";
}

export function subscribeToConsent(callback: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }
  const handler = () => {
    cache = readRaw();
    callback();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** 使用者在 ConsentBanner 選擇後呼叫，寫回 localStorage 並通知所有訂閱者。 */
export function setConsent(value: "granted" | "denied") {
  cache = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // 存不進去頂多下次重新整理後重問一次，不影響這次選擇立即生效。
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

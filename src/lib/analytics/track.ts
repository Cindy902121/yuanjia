"use client";

import type { AnalyticsEventName } from "../analytics-events";
import { getConsentSnapshot } from "./consent";

export interface TrackEventPayload {
  event_name: AnalyticsEventName;
  product_id?: string;
  event_data?: Record<string, unknown>;
}

/**
 * 送出分析事件。B2C 事件保留相容行為，B2B 事件會由 server route 補上
 * company、Auth user、完整客戶代碼快照與 first-party session。
 *
 * 刻意做成 fire-and-forget：
 * - 用 `keepalive: true`，確保使用者點擊連結、頁面開始導覽時，事件還是送得出去。
 * - `catch` 吞掉所有錯誤（包含離線等），不會讓任何畫面壞掉、不會擋住互動。
 * - 只在開發模式印 `console.debug`，方便開發時確認「有沒有在對的時機被呼叫」，
 *   正式環境不會有多餘的 log。
 *
 * 2026-09（P1-2，C 提出「GA4 尚未實作」）：14 個 `b2c_*` 白名單事件在這裡
 * 統一橋接到 GA4（`window.gtag`），不是每個呼叫端各自補一次：
 * - 只轉送 `b2c_*` 事件，`b2b_*` 事件不送——PRD／FDD 要求「不把 B2B 公司
 *   識別資料送進 GA4」，B2B 事件本來就走 server route 補 company／Auth
 *   user 資訊，這些欄位一個都不該出現在 GA4 裡，用事件名稱前綴直接擋掉
 *   最簡單可靠，不需要另外維護一份「哪些欄位算 PII」的過濾清單。
 * - 轉送的資料只有 `product_id` 跟 `event_data`——後者本來就是各事件先
 *   通過 `src/lib/analytics-events.ts` 白名單驗證過的欄位（`question_key`、
 *   `option_id`、`filter_type` 之類），不會有姓名、電話、Email、地址這種
 *   個資，因為 `trackEvent()` 的呼叫端從來沒有傳過這些欄位進來。
 *
 * 2026-09（同批，實測發現並修正一個真的 race condition）：一開始判斷
 * 「要不要轉送」用的是 `typeof window.gtag === "function"`——結果實測發現
 * 使用者「已經同意過」（`ga_consent` 是 `"granted"`）、剛整頁載入商品詳情頁
 * 這種情境，`TrackPageView` 的 `b2c_product_view` 幾乎每次都送不到 GA4。
 * 查出來的原因：`GoogleAnalytics.tsx` 要等 `useSyncExternalStore` 的
 * hydration 後同步（一定會晚一輪 render）才會真的把 `<Script>` 掛上去，
 * `<Script strategy="afterInteractive">` 本身又是非同步執行——`TrackPageView`
 * 是完全獨立、跟 GA4 有沒有準備好無關的元件，常常在 `window.gtag` 真的被
 * 定義出來之前就先跑完了 effect。（`GA4PageViewTracker` 一開始以為排在
 * `<Script>` 之後 mount 就天生穩定，實測發現一樣會中獎，同一批一併修了，
 * 見該檔案。）
 *
 * 修法：改成不依賴 `window.gtag` 是否已經是函式，直接用 GA4 官方 snippet
 * 本來就支援的「先進 queue、腳本準備好再處理」模式——判斷改成讀
 * `getConsentSnapshot()`（跟 GoogleAnalytics.tsx 同一份 store，同意與否
 * 是同步、立即可讀的，沒有這個 race），同意的話直接
 * `(window.dataLayer = window.dataLayer || []).push([...])`，不需要真的
 * 等 `gtag()` 這個函式被定義出來——`dataLayer` 陣列本身就是佇列，之後
 * gtag.js 真正載入時會照順序處理裡面所有項目，跟真的呼叫過 `gtag()` 效果
 * 一樣，這是 Google 官方 snippet 的標準設計，不是繞過機制的 hack。
 */
export function trackEvent(payload: TrackEventPayload) {
  fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // 分析事件失敗不可中斷企業客戶的瀏覽或詢價流程。
  });

  if (payload.event_name.startsWith("b2c_") && typeof window !== "undefined" && getConsentSnapshot() === "granted") {
    (window.dataLayer = window.dataLayer ?? []).push([
      "event",
      payload.event_name,
      {
        ...(payload.product_id ? { product_id: payload.product_id } : {}),
        ...(payload.event_data ?? {}),
      },
    ]);
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics] track", payload);
  }
}

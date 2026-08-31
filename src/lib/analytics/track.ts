"use client";

import type { AnalyticsEventName } from "../analytics-events";

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

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics] track", payload);
  }
}

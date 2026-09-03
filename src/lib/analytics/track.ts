"use client";

import type { AnalyticsEventName } from "../analytics-events";

interface TrackEventPayload {
  event_name: AnalyticsEventName;
  /**
 * 目前 analytics_events 資料表唯一有對應欄位（product_reference）的參數。
 * 篩選條件的明細尚未納入此分支的資料表，故不送未被 API 接受的欄位。
   */
  product_id?: string;
}

/**
 * 送出 B2C／B2B 分析事件。
 *
 * 以 fire-and-forget 方式送出：
 * - 用 `keepalive: true`，確保使用者點擊連結、頁面開始導覽時，事件還是送得出去。
 * - `catch` 吞掉所有錯誤（包含離線等），不會讓任何畫面壞掉、不會擋住互動。
 * - 只在開發模式印 `console.debug`，方便開發時確認「有沒有在對的時機被呼叫」，
 *   正式環境不會有多餘的 log。
 *
 */
export function trackEvent(payload: TrackEventPayload) {
  fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // API 尚未存在或網路錯誤時靜默失敗。
  });

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics] track", payload);
  }
}

"use client";

import type { B2cEventName } from "./events";

interface TrackEventPayload {
  event_name: B2cEventName;
  /**
   * 目前 analytics_events 資料表唯一有對應欄位（product_reference）的參數。
   * tag_slug／search_term／result_count／list_name／position 目前資料庫沒有
   * 欄位可存，故意不送，避免之後要為了「送了也沒地方存」的欄位收拾殘局
   * （見 docs/B2C商品展示資料.md §6.0 C10、§9.2 的欄位對應表）。
   */
  product_id?: string;
}

/**
 * 送出 B2C 分析事件。
 *
 * 現況（2026-08-13）：C 的 `POST /api/analytics/events` 還沒有實作，這支 fetch
 * 目前一定會拿到 404。刻意做成 fire-and-forget：
 * - 用 `keepalive: true`，確保使用者點擊連結、頁面開始導覽時，事件還是送得出去。
 * - `catch` 吞掉所有錯誤（包含 404、離線等），不會讓任何畫面壞掉、不會擋住互動。
 * - 只在開發模式印 `console.debug`，方便開發時確認「有沒有在對的時機被呼叫」，
 *   正式環境不會有多餘的 log。
 *
 * TODO：等 C 的 API 上線後，可能需要依實際回應格式微調，但呼叫時機（元件、時間點）
 * 不需要重寫，見各呼叫點的註解。
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

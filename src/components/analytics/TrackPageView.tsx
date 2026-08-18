"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";
import type { B2cEventName } from "@/lib/analytics/events";

interface TrackPageViewProps {
  eventName: B2cEventName;
  productId?: string;
}

/**
 * 不渲染任何畫面內容的追蹤元件，掛在頁面裡，載入完成時觸發一次對應的瀏覽事件
 * （見 /products/[slug]、/products/tags/[slug] 頁面裡的用法）。
 *
 * 用 useEffect 而不是在 Server Component 裡直接呼叫，是因為瀏覽事件要對應「使用者
 * 瀏覽器真的顯示了這個頁面」，不是「伺服器算了一次這個頁面」——伺服器端渲染／
 * revalidate 不應該算一次瀏覽。
 */
export function TrackPageView({ eventName, productId }: TrackPageViewProps) {
  useEffect(() => {
    trackEvent({ event_name: eventName, product_id: productId });
    // 只在 slug／productId 真的變化時重新觸發，避免同一頁重渲染就重複送出。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, productId]);

  return null;
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track";

interface TrackedTagLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

/**
 * 標籤連結，行為跟一般 <Link> 一樣，只是點擊時多送一個 b2c_tag_click 事件。
 *
 * 刻意只把「標籤連結」本身包成 Client Component，不是把整個 ProductCard／
 * ProductDetail 都變成 Client Component——這樣才能維持卡片／詳情頁大部分內容
 * 仍是 Server Component（效能較好），只有真的需要 onClick 的這個小連結才需要
 * 瀏覽器端 JS。
 *
 * 不呼叫 preventDefault：讓 <Link> 照原本方式導覽，trackEvent 用 keepalive 在
 * 背景送出，不會延遲或擋住點擊後的頁面跳轉。
 */
export function TrackedTagLink({ href, className, children }: TrackedTagLinkProps) {
  return (
    <Link href={href} className={className} onClick={() => trackEvent({ event_name: "b2c_tag_click" })}>
      {children}
    </Link>
  );
}

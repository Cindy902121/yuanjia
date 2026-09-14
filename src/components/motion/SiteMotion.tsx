"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * 全站路由進場容器。
 *
 * 只以 opacity 做頁面切換，不會在固定 Header／抽屜的祖先層使用 transform，
 * 避免改變 position: fixed 的定位基準；動畫由 globals.css 的
 * prefers-reduced-motion 媒體條件控制。
 */
export function SiteMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="site-page-motion" key={pathname}>
      {children}
    </div>
  );
}

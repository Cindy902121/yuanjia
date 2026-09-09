"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

/**
 * 捲動淡入效果（原 design-preview/_components/FadeInSection.tsx，2026-08-19
 * 團隊確認正式採用編輯風後搬到這裡，全站共用）。尊重 prefers-reduced-motion
 * （design.md §7.3 沿用下來的全站規則）。
 *
 * 2026-09（P1-4 自動化 axe 掃描發現）：`news/[slug]`、`media/[slug]` 有幾處
 * 直接把 `overflow-x-auto`（表格橫向捲動容器）當成這個元件的 className
 * 傳進來，等於 FadeInSection 自己的 `<div>` 就是那個可捲動區塊——但這裡
 * 一直只收 `children`／`className`／`id` 三個 prop，沒有轉發
 * `tabIndex`／`role`／`aria-*`，導致這幾處可橫向捲動的表格用鍵盤完全
 * 碰不到（WCAG 2.1.1／axe `scrollable-region-focusable`）。這裡改成用
 * `...rest` 轉發其餘 div 屬性，呼叫端要標記可捲動區塊時就能直接加
 * `tabIndex={0} role="region" aria-label="..."`，不用另外包一層 div；
 * 對其餘沒有傳這些 prop 的既有呼叫端完全不影響。
 */
export function FadeInSection({
  children,
  className = "",
  id,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  /** 給錨點跳轉用（例如商品詳情頁的 #product-details），可選。 */
  id?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "id" | "ref">) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} id={id} className={`ep-fade-in ${className}`} {...rest}>
      {children}
    </div>
  );
}

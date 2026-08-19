"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 捲動淡入效果（原 design-preview/_components/FadeInSection.tsx，2026-08-19
 * 團隊確認正式採用編輯風後搬到這裡，全站共用）。尊重 prefers-reduced-motion
 * （design.md §7.3 沿用下來的全站規則）。
 */
export function FadeInSection({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  /** 給錨點跳轉用（例如商品詳情頁的 #product-details），可選。 */
  id?: string;
}) {
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
    <div ref={ref} id={id} className={`ep-fade-in ${className}`}>
      {children}
    </div>
  );
}

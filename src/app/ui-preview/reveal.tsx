"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * `/ui-preview` 專用的捲動淡入 wrapper，邏輯跟正式站的
 * `src/components/editorial/FadeInSection.tsx` 一樣（IntersectionObserver
 * + prefers-reduced-motion），但套用 `up-reveal`／`up-reveal-d*` 這組獨立
 * class（見 ui-preview-styles.tsx），不共用正式站的 `.ep-fade-in`。
 */
export function Reveal({
  children,
  className = "",
  delay,
}: {
  children: ReactNode;
  className?: string;
  /** 1-5，用來讓同一批元素（例如商品卡）依序錯開進場，不用另外手寫 transition-delay。 */
  delay?: 1 | 2 | 3 | 4 | 5;
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

  const delayClass = delay ? `up-reveal-d${delay}` : "";

  return (
    <div ref={ref} className={`up-reveal ${delayClass} ${className}`}>
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { TimelineEntry } from "./about-content";

/**
 * 大事紀時間軸——桌機「垂直捲動 → 水平位移」互動的實作。
 *
 * 2026-09-11（原型先在 `/about-preview` 做過完整設計與驗證，這次正式移入
 * `(b2c)/about/`，邏輯本身沒有變動）。
 *
 * 機制：外層 wrapper 給一個比視窗高的高度，內層用 `position: sticky` 在
 * 使用者捲過 wrapper 期間保持釘住；捲動進度（0→1）換算成卡片軌道的
 * `translateX`，達成「使用者正常用滑鼠滾輪／觸控上下捲動，畫面上卡片
 * 視覺上水平移動」的效果。這裡刻意不用 `scroll-timeline` CSS（瀏覽器支援
 * 還不穩定）也不引入 GSAP ScrollTrigger 之類的函式庫（`package.json`
 * 本來就沒有動畫函式庫依賴）——沿用 `_ocean/scroll-fish.tsx` 已經在用的
 * 同一種 rAF 節流 scroll listener 寫法，風格一致、不新增依賴。
 *
 * 全程沒有呼叫 `preventDefault()`、沒有攔截捲動事件本身——使用者永遠可以
 * 正常捲過這個 Section，視覺上的水平位移純粹是 CSS transform，不改變
 * DOM 順序，鍵盤 Tab 順序／螢幕閱讀器朗讀順序完全不受影響。
 *
 * 啟用條件三個同時成立才會是「桌機水平模式」：viewport ≥ 1024px、
 * `prefers-reduced-motion` 不是 reduce、JS 有正常執行。三個條件任一不
 * 成立，就是「直向清單模式」——這也是 SSR 出來的預設 markup（`enabled`
 * 初始值是 `false`），不是另外做一個「無 JS 版本」的補丁，是同一份
 * component 依條件漸進增強。
 */
export function AboutTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  const featured = timeline.filter((entry) => entry.featured);
  const minor = timeline.filter((entry) => !entry.featured);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [wrapperHeight, setWrapperHeight] = useState<number | null>(null);

  // 判斷是否啟用桌機水平模式：viewport 寬度 + reduced-motion 偏好。
  useEffect(() => {
    const widthQuery = window.matchMedia("(min-width: 1024px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    function update() {
      setEnabled(widthQuery.matches && !motionQuery.matches);
    }
    update();
    widthQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    return () => {
      widthQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
    };
  }, []);

  // 量測卡片軌道實際寬度，算出 wrapper 需要多高才能提供足夠的捲動距離。
  // 總捲動距離刻意壓在「視窗高度的 1.6 倍」封頂，不管卡片軌道實際多寬，
  // 避免使用者要捲很久才能離開這個 Section。
  useEffect(() => {
    if (!enabled) return;
    const track = trackRef.current;
    if (!track) return;

    function measure() {
      const trackWidth = track!.scrollWidth;
      const rawDistance = Math.max(trackWidth - window.innerWidth, 0);
      const cappedDistance = Math.min(rawDistance, window.innerHeight * 1.6);
      setWrapperHeight(window.innerHeight + cappedDistance);
    }
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [enabled]);

  // 捲動進度 → 卡片軌道水平位移。
  useEffect(() => {
    if (!enabled || wrapperHeight === null) return;
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!wrapper || !track) return;

    let ticking = false;
    function applyProgress() {
      ticking = false;
      const rect = wrapper!.getBoundingClientRect();
      const scrollableDistance = wrapper!.offsetHeight - window.innerHeight;
      if (scrollableDistance <= 0) return;
      const progress = Math.min(Math.max(-rect.top / scrollableDistance, 0), 1);
      const maxTranslate = Math.max(track!.scrollWidth - window.innerWidth, 0);
      track!.style.transform = `translateX(-${progress * maxTranslate}px)`;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(applyProgress);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    applyProgress();
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, wrapperHeight]);

  if (!enabled) {
    return (
      <ol className="flex flex-col gap-10 border-t border-[#0B1620]/10 pt-10">
        {timeline.map((entry) => (
          <li
            key={entry.year}
            className={`flex gap-6 border-b border-[#0B1620]/10 pb-10 last:border-0 ${entry.featured ? "" : "opacity-80"}`}
          >
            <span
              className={`shrink-0 font-[family-name:var(--ep-font-en)] font-thin text-[#C2401D] ${
                entry.featured ? "w-20 text-3xl" : "w-16 text-lg"
              }`}
            >
              {entry.year}
            </span>
            <div className="flex flex-1 flex-col gap-3">
              <p
                className={`font-light leading-[1.8] ${
                  entry.featured ? "text-[17px] text-[#0B1620]" : "text-base text-[#536168]"
                }`}
              >
                {entry.description}
              </p>
              {entry.photo ? (
                <div className="relative mt-1 aspect-[4/3] w-full max-w-xs overflow-hidden">
                  <Image src={entry.photo.src} alt={entry.photo.alt} fill sizes="320px" className="object-cover" />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div>
      <div ref={wrapperRef} style={{ height: wrapperHeight ?? undefined }} className="relative">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div ref={trackRef} className="flex gap-20 pl-5 will-change-transform sm:pl-8 lg:pl-10">
            {featured.map((entry) => (
              <article key={entry.year} className="flex w-[360px] shrink-0 flex-col gap-6">
                <span className="font-[family-name:var(--ep-font-en)] text-6xl font-thin text-[#C2401D]">{entry.year}</span>
                <p className="max-w-[320px] text-[17px] font-light leading-[1.85] text-[#0B1620]">{entry.description}</p>
                {entry.photo ? (
                  <div className="relative aspect-[4/3] w-full max-w-[320px] overflow-hidden">
                    <Image src={entry.photo.src} alt={entry.photo.alt} fill sizes="320px" className="object-cover" />
                  </div>
                ) : null}
              </article>
            ))}
            {/* 軌道尾端留一塊空白，避免最後一張卡片剛好卡在視窗邊緣。 */}
            <div aria-hidden="true" className="w-[10vw] shrink-0" />
          </div>
        </div>
      </div>

      {/* 完整歷程：桌機水平軌道只放得下 9 筆重點年份，其餘 15 筆用清單接在
          後面，24 筆真實事件都會出現在頁面上，不是被裁掉。 */}
      <div className="mx-auto w-full max-w-[1200px] px-5 pt-4 sm:px-8 lg:px-10">
        <p className="font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#536168]">完整歷程</p>
        <ul className="mt-8 grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {minor.map((entry) => (
            <li key={entry.year} className="flex gap-4 border-t border-[#0B1620]/10 pt-5">
              <span className="w-14 shrink-0 font-[family-name:var(--ep-font-en)] text-lg text-[#C2401D]">
                {entry.year}
              </span>
              <span className="text-base font-light leading-[1.75] text-[#0B1620]">{entry.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

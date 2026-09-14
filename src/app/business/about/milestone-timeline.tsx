"use client";

import { useEffect, useRef, useState } from "react";

import { FadeInSection } from "@/components/editorial/FadeInSection";

type Milestone = {
  title: string;
  description: string;
};

function CurrentMark() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden text-[#6B7880]">
      <svg className="absolute -left-12 bottom-[4%] h-[64%] w-[36%] opacity-[.38]" fill="none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M-8 2 C22 25 42 22 68 4 S100 -4 112 6 M-8 11 C22 34 42 31 68 13 S100 5 112 15 M-8 20 C22 43 42 40 68 22 S100 14 112 24 M-8 29 C22 52 42 49 68 31 S100 23 112 33 M-8 38 C22 61 42 58 68 40 S100 32 112 42 M-8 47 C22 70 42 67 68 49 S100 41 112 51 M-8 56 C22 79 42 76 68 58 S100 50 112 60 M-8 65 C22 88 42 85 68 67 S100 59 112 69 M-8 74 C22 97 42 94 68 76 S100 68 112 78" stroke="currentColor" strokeWidth=".28" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg className="absolute -right-12 top-[2%] h-[60%] w-[36%] scale-x-[-1] opacity-[.38]" fill="none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M-8 2 C22 25 42 22 68 4 S100 -4 112 6 M-8 11 C22 34 42 31 68 13 S100 5 112 15 M-8 20 C22 43 42 40 68 22 S100 14 112 24 M-8 29 C22 52 42 49 68 31 S100 23 112 33 M-8 38 C22 61 42 58 68 40 S100 32 112 42 M-8 47 C22 70 42 67 68 49 S100 41 112 51 M-8 56 C22 79 42 76 68 58 S100 50 112 60 M-8 65 C22 88 42 85 68 67 S100 59 112 69 M-8 74 C22 97 42 94 68 76 S100 68 112 78" stroke="currentColor" strokeWidth=".28" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export default function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let frame = 0;
    const updateActiveMilestone = () => {
      frame = 0;
      const viewportCenter = window.innerHeight / 2;
      let closestIndex = 0;
      let shortestDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((item, index) => {
        if (!item) return;
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const distance = Math.abs(itemCenter - viewportCenter);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((currentIndex) => currentIndex === closestIndex ? currentIndex : closestIndex);
    };
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveMilestone);
    };

    updateActiveMilestone();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <section aria-label="元家發展歷程" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-white py-14 sm:py-20 lg:py-24">
      <CurrentMark />
      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
        <div className="relative mx-auto max-w-[1040px] before:absolute before:bottom-0 before:left-[36%] before:top-0 before:w-px before:bg-[#CFD3D1] sm:before:left-[30%] lg:before:left-[31%]">
          {milestones.map((milestone, index) => {
            const isActive = index === activeIndex;
            return (
              <FadeInSection className="pb-16 last:pb-0 sm:pb-20 lg:pb-24" key={milestone.title}>
                <article
                  className="relative grid grid-cols-[33%_1fr] gap-x-7 sm:grid-cols-[28%_1fr] sm:gap-x-12 lg:grid-cols-[29%_1fr] lg:gap-x-14"
                  data-milestone-index={index}
                  ref={(element) => { itemRefs.current[index] = element; }}
                >
                  <div className="pr-1 text-right sm:pr-3">
                    <p className={`origin-right font-[family-name:var(--ep-font-en)] text-[32px] font-light leading-none tracking-[-.035em] transition-[color,transform] duration-500 sm:text-[38px] lg:text-[44px] ${isActive ? "scale-105 text-[#D94A3A]" : "text-[#0F5B78]"}`}>{milestone.title}</p>
                  </div>
                  <span aria-hidden="true" className={`absolute left-[calc(33%+1.16rem)] top-[0.65rem] z-10 size-3 -translate-x-1/2 rounded-full border-2 border-white transition-[background-color,transform] duration-500 sm:left-[calc(28%+1.25rem)] sm:top-4 lg:left-[calc(29%+1.25rem)] ${isActive ? "scale-125 bg-[#D94A3A]" : "bg-[#0F5B78]"}`} />
                  <div className="min-w-0 pb-1">
                    <p className={`max-w-2xl text-[17px] leading-9 transition-colors duration-500 sm:text-[19px] sm:leading-9 ${isActive ? "text-[#17262D]" : "text-[#536168]"}`}>{milestone.description}</p>
                  </div>
                </article>
              </FadeInSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}

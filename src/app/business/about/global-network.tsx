"use client";

import { useEffect, useRef, useState } from "react";

export default function GlobalNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const pathStyle = (delay: number) => ({
    strokeDasharray: 1,
    strokeDashoffset: isVisible ? 0 : 1,
    transition: `stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1) ${delay}s`,
  });

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-[2rem] border border-[#D7E2E7] bg-[#F4F8FA] px-7 py-12 text-[#17262D] shadow-[0_18px_38px_rgba(25,67,91,.08)] sm:px-12 sm:py-16 lg:px-16 lg:py-20">
      <div aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[#005DAA]/10" />
      <div aria-hidden="true" className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full border border-[#A6D800]/25" />
      <div className="relative grid items-center gap-10 lg:grid-cols-[.82fr_1.18fr]">
        <div className="max-w-md">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#005DAA]">GLOBAL CONNECTION</p>
          <h2 className="mt-5 font-[family-name:var(--ep-font-serif)] text-4xl font-light leading-[1.35] sm:text-5xl">從台灣出發，串連全球食品供應。</h2>
          <p className="mt-6 text-[16px] leading-9 text-[#536168] sm:text-[17px]">由國際採購掌握源頭，透過在地研發、品質管理與冷鏈物流，讓每一項產品能被清楚管理並穩定交付。</p>
        </div>

        <div className="relative mx-auto w-full max-w-[760px]" role="img" aria-label="從台灣向全球供應網絡延伸的示意圖">
          <svg className="h-auto w-full" fill="none" viewBox="0 0 680 360">
            <path d="M340 188 C250 158 174 105 78 90" pathLength="1" stroke="rgba(0,93,170,.55)" strokeWidth="1.5" style={pathStyle(0.1)} />
            <path d="M340 188 C256 210 152 252 76 288" pathLength="1" stroke="rgba(0,93,170,.55)" strokeWidth="1.5" style={pathStyle(0.25)} />
            <path d="M340 188 C420 137 505 86 600 72" pathLength="1" stroke="rgba(0,93,170,.55)" strokeWidth="1.5" style={pathStyle(0.4)} />
            <path d="M340 188 C448 224 538 258 611 286" pathLength="1" stroke="rgba(0,93,170,.55)" strokeWidth="1.5" style={pathStyle(0.55)} />
            <path d="M340 188 C339 127 339 74 340 31" pathLength="1" stroke="rgba(0,113,47,.8)" strokeWidth="1.5" style={pathStyle(0.7)} />

            <circle cx="340" cy="188" fill="#005DAA" r={isVisible ? 10 : 0} style={{ transition: "r .4s ease .75s" }} />
            <circle cx="340" cy="188" fill="none" r={isVisible ? 19 : 0} stroke="rgba(0,93,170,.25)" style={{ transition: "r .5s ease .8s" }} />
            {[[78, 90], [76, 288], [600, 72], [611, 286], [340, 31]].map(([cx, cy], index) => (
              <circle cx={cx} cy={cy} fill="#0F5B78" key={`${cx}-${cy}`} r={isVisible ? 5 : 0} style={{ transition: `r .3s ease ${0.9 + index * 0.1}s` }} />
            ))}
          </svg>

          <span className="absolute left-1/2 top-[51%] z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-[#F4F8FA] px-3 text-sm font-semibold tracking-[0.15em] text-[#005DAA]">TAIWAN</span>
          <span className="absolute left-[4%] top-[10%] z-10 bg-[#F4F8FA]/95 px-2 py-1 text-[11px] tracking-[0.12em] text-[#536168] sm:text-xs"><span className="block font-semibold text-[#0F5B78]">國際採購</span><span>GLOBAL SOURCING</span></span>
          <span className="absolute bottom-[3%] left-[3%] z-10 bg-[#F4F8FA]/95 px-2 py-1 text-[11px] tracking-[0.12em] text-[#536168] sm:text-xs"><span className="block font-semibold text-[#0F5B78]">食品安全</span><span>QUALITY CONTROL</span></span>
          <span className="absolute right-[1%] top-[6%] z-10 bg-[#F4F8FA]/95 px-2 py-1 text-[11px] tracking-[0.12em] text-[#536168] sm:text-xs"><span className="block font-semibold text-[#0F5B78]">研發生產</span><span>PRODUCT DEVELOPMENT</span></span>
          <span className="absolute bottom-[3%] right-0 z-10 bg-[#F4F8FA]/95 px-2 py-1 text-right text-[11px] tracking-[0.12em] text-[#536168] sm:text-xs"><span className="block font-semibold text-[#0F5B78]">倉儲物流</span><span>COLD-CHAIN DELIVERY</span></span>
        </div>
      </div>
    </div>
  );
}

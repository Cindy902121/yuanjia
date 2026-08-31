"use client";

import Image from "next/image";
import { useState } from "react";

const REGIONS = [
  { id: "taiwan", label: "台灣市場", sublabel: "TAIWAN", position: "left-[49%] top-[52%]", image: "/brand/channel-trade.jpg", imageAlt: "元家零售通路活動", caption: "零售、量販、餐飲與食品加工", text: "支援北、中、南區的多元食品採購，從零售量販、餐飲到食品加工，依合作情境提供品項與規格建議。", tags: ["零售與量販", "餐飲通路", "食品加工"] },
  { id: "china", label: "中國事業", sublabel: "CHINA", position: "left-[63%] top-[31%]", image: "/brand/channel-market.jpg", imageAlt: "元家食品供應現場", caption: "上海、華北與中國市場合作", text: "元家於上海及華北設有營業據點，透過當地合作網絡與國際展覽，服務中國各地的食品採購需求。", tags: ["上海據點", "華北服務", "中國市場"] },
  { id: "global", label: "國際貿易", sublabel: "GLOBAL", position: "left-[31%] top-[42%]", image: "/brand/channel-service.jpg", imageAlt: "元家國際展覽", caption: "五大洲、21 國的國際合作", text: "國際貿易部將經認證工廠的產品推廣至海外，持續參與國際水產展覽，拓展全球合作機會。", tags: ["五大洲", "21 國", "國際展覽"] },
] as const;

export default function SupplyMap() {
  const [activeId, setActiveId] = useState<(typeof REGIONS)[number]["id"]>("taiwan");
  const active = REGIONS.find((region) => region.id === activeId) ?? REGIONS[0];

  return (
    <section aria-label="元家供應服務版圖" className="mt-12 border-t border-[#D9E1E5] pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.18em] text-[#7C8585]">SERVICE FOOTPRINT</p><h3 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">供應服務版圖</h3></div><p className="max-w-xs text-right text-xs leading-5 text-[#7C8585]">點選區域，查看對應的服務內容。</p></div>
      <div className="mt-7 grid gap-7 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch">
        <div className="relative min-h-[300px] overflow-hidden border border-[#C8DDE8] bg-[#EAF5FB] p-5 sm:min-h-[380px]">
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-70" preserveAspectRatio="none" viewBox="0 0 620 380"><path d="M74 120 161 72l113 31 72-39 118 49 62 74-88 61-119-8-102 56-112-71z" fill="#D8ECF4" stroke="#A7C8D7" strokeWidth="1" /><path d="m95 157 97-45 122 22 89-39 109 57" fill="none" stroke="#B8D3DF" strokeDasharray="4 6" strokeWidth="1" /><path d="m153 254 100-60 148 28 87-45" fill="none" stroke="#B8D3DF" strokeDasharray="4 6" strokeWidth="1" /></svg>
          <p className="relative font-[family-name:var(--ep-font-en)] text-[10px] tracking-[0.2em] text-[#547687]">YUANJIA SUPPLY NETWORK</p>
          {REGIONS.map((region) => <button aria-label={`查看${region.label}服務`} className={`group absolute ${region.position} z-10 -translate-x-1/2 -translate-y-1/2`} key={region.id} onClick={() => setActiveId(region.id)} type="button"><span className={`block size-5 rounded-full border-4 border-[#EAF5FB] shadow-[0_0_0_1px_#5A9FC4] transition ${active.id === region.id ? "scale-125 bg-[#005DAA]" : "bg-[#65B2D7] group-hover:scale-110 group-hover:bg-[#005DAA]"}`} /><span className={`mt-2 block whitespace-nowrap text-xs font-bold transition ${active.id === region.id ? "text-[#005DAA]" : "text-[#536168]"}`}>{region.label}</span></button>)}
          <div className="absolute bottom-4 left-5 text-xs text-[#718087]">● 點選服務區域</div>
        </div>
        <div className="flex flex-col border border-[#D9E1E5] bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="font-[family-name:var(--ep-font-en)] text-xs tracking-[0.18em] text-[#005DAA]">{active.sublabel}</p><h4 className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light">{active.label}</h4></div><span className="text-xs text-[#9AA6A8]">{String(REGIONS.findIndex((region) => region.id === active.id) + 1).padStart(2, "0")} / 03</span></div><p className="mt-5 text-sm leading-7 text-[#536168]">{active.text}</p><div className="mt-5 flex flex-wrap gap-2">{active.tags.map((tag) => <span className="border border-[#C8DDE8] bg-[#F4FAFD] px-2.5 py-1 text-xs text-[#356277]" key={tag}>{tag}</span>)}</div><div className="relative mt-auto aspect-[16/8] overflow-hidden"><Image alt={active.imageAlt} className="object-cover transition duration-500" fill sizes="(min-width: 1024px) 450px, 100vw" src={active.image} /></div><p className="mt-3 text-xs text-[#7C8585]">{active.caption}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 lg:hidden">{REGIONS.map((region) => <button className={`border px-3 py-2 text-xs transition ${active.id === region.id ? "border-[#005DAA] bg-[#005DAA] text-white" : "border-[#C8DDE8] bg-white text-[#536168]"}`} key={region.id} onClick={() => setActiveId(region.id)} type="button">{region.label}</button>)}</div>
    </section>
  );
}

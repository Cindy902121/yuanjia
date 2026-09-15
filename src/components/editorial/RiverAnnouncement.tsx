"use client";

import Link from "next/link";
import { PRODUCT_ANNOUNCEMENTS } from "@/lib/content/product-announcements";

export function RiverAnnouncement() {
  return (
    <aside
      aria-labelledby="river-announcement-title"
      className="river-announcement order-first min-w-0 xl:col-start-3 xl:row-start-1 xl:order-none bg-[#EAF4F8] xl:self-stretch xl:border-l xl:border-[#0B1620]/10 xl:px-6 xl:py-8"
    >
      <div className="river-announcement-shell">
        <div className="river-announcement-heading">
          <span className="font-[family-name:var(--ep-font-en)] text-[10px] tracking-[0.32em] text-[#536168]">
            OCEAN CURRENT
          </span>
          <h2
            id="river-announcement-title"
            className="mt-2 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.06em] text-[#0B1620]"
          >
            海流公告
          </h2>
        </div>

        <div
          className="river-announcement-channel"
          tabIndex={0}
          aria-label="海流公告，移入或聚焦可暫停"
        >
          <span aria-hidden="true" className="river-announcement-fish">
            <svg viewBox="0 0 64 28">
              <path d="M4 14 C4 7 14 3 26 3 C36 3 44 7 48 11 L60 4 L54 14 L60 24 L48 17 C44 21 36 25 26 25 C14 25 4 21 4 14 Z" />
            </svg>
          </span>

          <div className="river-announcement-window">
            <div className="river-announcement-track">
              {PRODUCT_ANNOUNCEMENTS.map((item) => (
                <AnnouncementItem key={item.id} item={item} />
              ))}
              <div aria-hidden="true" className="river-announcement-duplicate">
                {PRODUCT_ANNOUNCEMENTS.map((item) => (
                  <AnnouncementItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-[11px] font-light leading-5 text-[#536168]">
          將游標移入或使用鍵盤聚焦，可暫停海流方便閱讀。
        </p>
      </div>
    </aside>
  );
}

function AnnouncementItem({ item }: { item: (typeof PRODUCT_ANNOUNCEMENTS)[number] }) {
  return (
    <Link
      href={item.href}
      className="river-announcement-item group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8492F]"
      aria-label={item.title + "：" + item.description}
    >
      <span className="font-[family-name:var(--ep-font-en)] text-[10px] tracking-[0.22em] text-[#536168]">
        {item.eyebrow}
      </span>
      <h3 className="mt-2 font-[family-name:var(--ep-font-serif)] text-lg font-light leading-[1.7] text-[#0B1620] transition-colors group-hover:text-[#A8492F]">
        {item.title}
      </h3>
      <p className="mt-3 text-[13px] font-light leading-7 text-[#425660]">{item.description}</p>
      <span aria-hidden="true" className="mt-3 inline-block text-xs tracking-widest text-[#536168] transition-transform group-hover:translate-x-1">
        了解更多 →
      </span>
    </Link>
  );
}

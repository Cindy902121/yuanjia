import { COUPON_STATUS_LABEL, DEMO_COUPONS, type DemoCouponKind } from "../member-demo-data";

/**
 * 04 專屬優惠——2026-09-11 使用者回饋「直接放大寫字似乎不太好看，字太多」，
 * 改成每張優惠券左側配一個對應種類的細線 Icon（免運／折扣／折抵金額），
 * 取代原本佔滿版面的大型 Typography 折扣文字；折扣本身改成小標籤放在標題
 * 旁邊，版面重心從「巨大數字」移到「Icon＋簡短文字」，減少視覺上的字量。
 */
export function OffersSection() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
          04 · OFFERS
        </span>
        <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#0B1620]">
          專屬優惠
        </h2>
      </div>

      <ul className="flex flex-col">
        {DEMO_COUPONS.map((coupon) => {
          const isAvailable = coupon.status === "available";
          return (
            <li
              key={coupon.id}
              className={`flex flex-col gap-4 border-t border-[#0B1620]/10 py-8 last:border-b sm:flex-row sm:items-center sm:justify-between ${
                isAvailable ? "" : "opacity-50"
              }`}
            >
              <div className="flex items-center gap-5">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center border ${
                    isAvailable ? "border-[#C2401D]/40 text-[#C2401D]" : "border-[#0B1620]/20 text-[#536168]"
                  }`}
                >
                  <CouponIcon kind={coupon.kind} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-[family-name:var(--ep-font-serif)] text-base text-[#0B1620]">
                      {coupon.title}
                    </span>
                    <span className="font-[family-name:var(--ep-font-en)] text-sm tracking-widest text-[#C2401D]">
                      {coupon.discountLabel}
                    </span>
                  </div>
                  <span className="text-sm font-light text-[#536168]">{coupon.condition}</span>
                  <span className="text-xs font-light tracking-[0.05em] text-[#536168]">
                    {coupon.validUntilLabel}
                  </span>
                </div>
              </div>
              <span
                className={`shrink-0 text-xs tracking-[0.15em] ${
                  isAvailable ? "text-[#C2401D]" : "text-[#536168]"
                }`}
              >
                {COUPON_STATUS_LABEL[coupon.status]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** 細線風格 Icon，跟全站 Marine Line Art 同一種「純線條、無填色」語言，stroke 用 currentColor 跟隨外層文字色。 */
function CouponIcon({ kind }: { kind: DemoCouponKind }) {
  const common = { viewBox: "0 0 32 32", className: "h-6 w-6", fill: "none", stroke: "currentColor", strokeWidth: 1.4 } as const;

  if (kind === "free_shipping") {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="3" y="9" width="15" height="11" strokeLinejoin="round" />
        <path d="M18 13h5l4 4v3h-2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="10" cy="23" r="2.4" />
        <circle cx="21" cy="23" r="2.4" />
      </svg>
    );
  }

  if (kind === "percent_off") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M23 9 9 23" strokeLinecap="round" />
        <circle cx="10.5" cy="10.5" r="2.8" />
        <circle cx="21.5" cy="21.5" r="2.8" />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <path d="M6 14h20v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V14Z" strokeLinejoin="round" />
      <path d="M4 10h24v4H4z" strokeLinejoin="round" />
      <path d="M16 10v16M16 10c-2-3-7-4-7-1s3 2 7 1ZM16 10c2-3 7-4 7-1s-3 2-7 1Z" strokeLinejoin="round" />
    </svg>
  );
}

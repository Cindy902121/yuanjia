import { COUPON_STATUS_LABEL, DEMO_COUPONS } from "../member-demo-data";

/**
 * 04 專屬優惠——3 張 DEMO_COUPONS（見 member-demo-data.ts），用細線分隔的
 * 長條呈現，不做成圓角「票券」卡片樣式（那是比較制式的電商 Coupon 元件
 * 語言，跟這個站的 Editorial 風格不搭）。折扣用大 Typography 當視覺重點，
 * 呼應企業優勢／大事紀已經在用的「大數字」語言。
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
              <div className="flex items-baseline gap-6">
                <span className="font-[family-name:var(--ep-font-en)] w-28 shrink-0 text-3xl font-thin text-[#C2401D] sm:text-4xl">
                  {coupon.discountLabel}
                </span>
                <div className="flex flex-col gap-1.5">
                  <span className="font-[family-name:var(--ep-font-serif)] text-base text-[#0B1620]">
                    {coupon.title}
                  </span>
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

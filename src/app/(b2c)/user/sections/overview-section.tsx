import Image from "next/image";
import {
  DEMO_COUPONS,
  ORDER_STATUS_LABEL,
  getOrderTotal,
  type DemoAddress,
  type DemoOrder,
} from "../member-demo-data";
import type { MemberTab } from "../member-center";

/**
 * 01 會員總覽——刻意不做成四個一樣大小的 Rounded Stat Card 排成一列（那是
 * SaaS Dashboard 的語言），改用不對稱排列：左側最近訂單摘要用比較大的區塊
 * （含商品縮圖），右側收藏／優惠用大數字，最下面是預設地址，用細線分隔，
 * 建立跟頁面其他區塊一致的「大數字＋細線」節奏。
 */
export function OverviewSection({
  memberName,
  orders,
  favoritesCount,
  defaultAddress,
  onNavigate,
}: {
  memberName: string;
  orders: DemoOrder[];
  favoritesCount: number;
  defaultAddress: DemoAddress | undefined;
  onNavigate: (tab: MemberTab) => void;
}) {
  const latestOrder = orders[0];
  const activeOrderCount = orders.filter((order) => order.status !== "completed").length;
  const availableCouponCount = DEMO_COUPONS.filter((coupon) => coupon.status === "available").length;

  return (
    <div className="flex flex-col gap-14">
      <div>
        <span className="font-[family-name:var(--ep-font-en)] text-sm font-light tracking-[0.35em] text-[#536168]">
          01 · OVERVIEW
        </span>
        <h2 className="mt-3 font-[family-name:var(--ep-font-serif)] text-2xl font-light tracking-[0.03em] text-[#0B1620]">
          歡迎回來，{memberName}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_1fr]">
        {/* 最近訂單摘要 */}
        <div className="flex flex-col gap-5 border-t border-[#0B1620]/10 pt-6">
          <div className="flex items-baseline justify-between">
            <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]">
              最近訂單
            </span>
            <button
              type="button"
              onClick={() => onNavigate("orders")}
              className="text-xs tracking-[0.05em] text-[#0B1620] underline underline-offset-2 hover:text-[#FF5A36]"
            >
              查看全部訂單 →
            </button>
          </div>
          {latestOrder ? (
            <button
              type="button"
              onClick={() => onNavigate("orders")}
              className="flex items-center gap-5 text-left"
            >
              <div className="flex -space-x-3">
                {latestOrder.items.slice(0, 3).map((item) => (
                  <div
                    key={item.productId}
                    className="relative h-16 w-16 shrink-0 overflow-hidden border border-[#EAF4F8] bg-[#F6FBFC]"
                  >
                    {item.image ? (
                      <Image src={item.image.url} alt={item.image.alt} fill sizes="64px" className="object-cover" />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-[family-name:var(--ep-font-en)] text-sm text-[#0B1620]">{latestOrder.id}</span>
                <span className="text-sm font-light text-[#536168]">{latestOrder.placedAtLabel}</span>
                <span className="text-xs tracking-[0.1em] text-[#C2401D]">
                  {ORDER_STATUS_LABEL[latestOrder.status]} · NT$ {getOrderTotal(latestOrder).toLocaleString()}
                </span>
              </div>
            </button>
          ) : (
            <p className="text-sm font-light text-[#536168]">目前沒有訂單。</p>
          )}
        </div>

        {/* 目前訂單狀態 + 收藏 + 優惠：大數字排列 */}
        <div className="grid grid-cols-3 gap-6 border-t border-[#0B1620]/10 pt-6">
          <button type="button" onClick={() => onNavigate("orders")} className="flex flex-col gap-2 text-left">
            <span className="font-[family-name:var(--ep-font-en)] text-4xl font-thin text-[#C2401D]">
              {activeOrderCount}
            </span>
            <span className="text-xs font-light leading-[1.5] text-[#536168]">筆進行中訂單</span>
          </button>
          <button type="button" onClick={() => onNavigate("favorites")} className="flex flex-col gap-2 text-left">
            <span className="font-[family-name:var(--ep-font-en)] text-4xl font-thin text-[#0B1620]">
              {favoritesCount}
            </span>
            <span className="text-xs font-light leading-[1.5] text-[#536168]">件收藏商品</span>
          </button>
          <button type="button" onClick={() => onNavigate("offers")} className="flex flex-col gap-2 text-left">
            <span className="font-[family-name:var(--ep-font-en)] text-4xl font-thin text-[#0B1620]">
              {availableCouponCount}
            </span>
            <span className="text-xs font-light leading-[1.5] text-[#536168]">張可用優惠</span>
          </button>
        </div>
      </div>

      {/* 預設收件地址 */}
      <div className="flex flex-col gap-3 border-t border-[#0B1620]/10 pt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]">
            預設收件地址
          </span>
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className="text-xs tracking-[0.05em] text-[#0B1620] underline underline-offset-2 hover:text-[#FF5A36]"
          >
            管理地址 →
          </button>
        </div>
        {defaultAddress ? (
          <p className="text-sm font-light text-[#536168]">
            <span className="text-[#0B1620]">{defaultAddress.label}</span>　{defaultAddress.recipientName}．
            {defaultAddress.recipientPhone}
            <br />
            {defaultAddress.address}
          </p>
        ) : (
          <p className="text-sm font-light text-[#536168]">尚未設定收件地址。</p>
        )}
      </div>
    </div>
  );
}

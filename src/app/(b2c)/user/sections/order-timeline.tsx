import { ORDER_STATUS_LABEL, ORDER_STATUS_SEQUENCE, type DemoOrderStatus } from "../member-demo-data";

/**
 * 訂單詳情的視覺化 Progress Timeline——五個階段（待付款／待出貨／待收貨／
 * 已取貨／已完成）橫向排列，細線連接，走過的階段用實心點＋Coral Accent，
 * 還沒走到的階段用空心點＋Mist，不用進度條／百分比這種比較像物流追蹤 App
 * 的語言，維持跟全站一致的「細線＋Typography」風格。
 */
export function OrderTimeline({ status }: { status: DemoOrderStatus }) {
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(status);

  return (
    <ol className="flex w-full items-start">
      {ORDER_STATUS_SEQUENCE.map((step, index) => {
        const isDone = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === ORDER_STATUS_SEQUENCE.length - 1;

        return (
          <li key={step} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 shrink-0 rounded-full border ${
                  isDone ? "border-[#C2401D] bg-[#C2401D]" : "border-[#0B1620]/30 bg-transparent"
                }`}
              />
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={`h-px flex-1 ${index < currentIndex ? "bg-[#C2401D]" : "bg-[#0B1620]/15"}`}
                />
              ) : null}
            </div>
            <span
              className={`mt-3 text-center text-xs font-light tracking-[0.05em] ${
                isCurrent ? "text-[#C2401D]" : isDone ? "text-[#0B1620]" : "text-[#536168]"
              }`}
            >
              {ORDER_STATUS_LABEL[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

import Link from "next/link";

/** 訪客購物車的低干擾登入入口；不宣稱未確認的折扣或會員優惠。 */
export function GuestCartPrompt() {
  return (
    <p className="border-y border-[#0B1620]/10 py-3 text-xs font-light leading-6 text-[#536168]">
      想使用會員功能？{" "}
      <Link href="/login" className="text-[#A8492F] underline decoration-[#A8492F]/40 underline-offset-4 hover:text-[#0B1620]">
        登入
      </Link>{" "}
      或{" "}
      <Link href="/signup" className="text-[#A8492F] underline decoration-[#A8492F]/40 underline-offset-4 hover:text-[#0B1620]">
        註冊
      </Link>
    </p>
  );
}

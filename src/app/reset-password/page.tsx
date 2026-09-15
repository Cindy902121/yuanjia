import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ResetPasswordForm } from "./reset-password-form";

const RECOVERY_COOKIE = "yuanjia-password-recovery";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "重設密碼 | 元家",
};

export default async function ResetPasswordPage() {
  const canReset = (await cookies()).get(RECOVERY_COOKIE)?.value === "1";

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#F7F6F2] px-5 py-10 text-[#17242A] sm:px-8"
      style={{ fontFamily: '"Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif' }}
    >
      <section className="w-full max-w-md rounded-2xl border border-[#D9E1E5] bg-white p-7 shadow-[0_12px_32px_rgba(23,36,42,0.08)] sm:p-9">
        <div className="h-1 w-12 rounded-full bg-[#005DAA]" />
        <p className="mt-5 text-sm font-bold tracking-[0.2em] text-[#005DAA]">YUANJIA</p>
        <h1 className="mt-3 text-[32px] font-bold tracking-tight text-[#17242A]">重設密碼</h1>
        <p className="mt-3 text-base leading-7 text-[#536168]">輸入註冊 Email，取得重設密碼的連結。</p>
        <ResetPasswordForm canReset={canReset} />
      </section>
    </main>
  );
}

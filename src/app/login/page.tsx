import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "登入 | 元家",
};

export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#F7F6F2] px-5 py-10 text-[#17242A] sm:px-8"
      style={{ fontFamily: '"Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif' }}
    >
      <section className="w-full max-w-md rounded-2xl border border-[#D9E1E5] bg-white p-7 shadow-[0_12px_32px_rgba(23,36,42,0.08)] sm:p-9">
        <div className="h-1 w-12 rounded-full bg-[#005DAA]" />
        <p className="mt-5 text-sm font-bold tracking-[0.2em] text-[#005DAA]">YUANJIA</p>
        <h1 className="mt-3 text-[32px] font-bold tracking-tight text-[#17242A]">登入</h1>
        <p className="mt-3 text-base leading-7 text-[#536168]">
          請選擇適合您的登入方式。登入後，系統會依帳號權限帶您前往對應的服務。
        </p>
        <LoginForm />
      </section>
    </main>
  );
}

import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "登入 | 元家",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-semibold tracking-[0.18em] text-teal-800">YUANJIA</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">登入</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          請選擇適合您的登入方式。登入後，系統會依帳號權限帶您前往對應的服務。
        </p>
        <LoginForm />
      </section>
    </main>
  );
}

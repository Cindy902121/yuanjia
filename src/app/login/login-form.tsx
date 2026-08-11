"use client";

import { FormEvent, useState } from "react";

type LoginMode = "email" | "customer-code";

type LoginResponse = {
  message?: string;
  redirectTo?: string;
};

export function LoginForm() {
  const [mode, setMode] = useState<LoginMode>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      body: JSON.stringify({
        identifier: formData.get("identifier"),
        password: formData.get("password"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as LoginResponse;

    if (!response.ok || !result.redirectTo) {
      setMessage(result.message ?? "登入失敗，請稍後再試。");
      setIsSubmitting(false);
      return;
    }

    window.location.assign(result.redirectTo);
  }

  const isEmail = mode === "email";

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <fieldset className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" disabled={isSubmitting}>
        <legend className="sr-only">登入身分</legend>
        <button
          aria-pressed={isEmail}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            isEmail ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
          }`}
          onClick={() => {
            setMode("email");
            setMessage("");
          }}
          type="button"
        >
          B2C／管理者
        </button>
        <button
          aria-pressed={!isEmail}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            !isEmail ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
          }`}
          onClick={() => {
            setMode("customer-code");
            setMessage("");
          }}
          type="button"
        >
          B2B 企業客戶
        </button>
      </fieldset>

      <div>
        <label className="block text-sm font-semibold text-slate-800" htmlFor="identifier">
          {isEmail ? "Email" : "客戶代碼"}
        </label>
        <input
          autoComplete={isEmail ? "email" : "username"}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
          id="identifier"
          key={mode}
          name="identifier"
          placeholder={isEmail ? "name@example.com" : "例如：B2B-TEST-001"}
          required
          type={isEmail ? "email" : "text"}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800" htmlFor="password">
          密碼
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {message ? (
        <p aria-live="polite" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {message}
        </p>
      ) : null}

      <button
        className="w-full rounded-xl bg-teal-800 px-4 py-3 font-semibold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "登入中…" : "登入"}
      </button>

      <p className="text-center text-sm leading-6 text-slate-600">
        {isEmail
          ? "一般會員與管理者請使用 Email 登入。"
          : "企業客戶請使用公司提供的客戶代碼與共用密碼。"}
      </p>
    </form>
  );
}

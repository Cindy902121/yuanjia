"use client";

import { FormEvent, useState } from "react";

type LoginMode = "email" | "customer-code";

type LoginResponse = {
  message?: string;
  redirectTo?: string;
};

const modeContent = {
  email: {
    description: "使用您的 Email 與密碼登入。",
    identifierLabel: "Email",
    identifierPlaceholder: "name@example.com",
    submitLabel: "會員登入",
  },
  "customer-code": {
    description: "供已開通的合作客戶使用，請輸入企業客戶代碼與密碼。",
    identifierLabel: "企業客戶代碼",
    identifierPlaceholder: "例如：B2B-TEST-001",
    submitLabel: "企業客戶登入",
  },
} satisfies Record<
  LoginMode,
  {
    description: string;
    identifierLabel: string;
    identifierPlaceholder: string;
    submitLabel: string;
  }
>;

export function LoginForm() {
  const [mode, setMode] = useState<LoginMode>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const content = modeContent[mode];
  const isEmail = mode === "email";

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

  function chooseMode(nextMode: LoginMode) {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <fieldset className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" disabled={isSubmitting}>
        <legend className="sr-only">選擇登入方式</legend>
        <button
          aria-pressed={isEmail}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
            isEmail ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
          }`}
          onClick={() => chooseMode("email")}
          type="button"
        >
          會員登入
        </button>
        <button
          aria-pressed={!isEmail}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
            !isEmail ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
          }`}
          onClick={() => chooseMode("customer-code")}
          type="button"
        >
          企業客戶
        </button>
      </fieldset>

      <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-950">{content.description}</p>

      <div>
        <label className="block text-sm font-semibold text-slate-800" htmlFor="identifier">
          {content.identifierLabel}
        </label>
        <input
          autoComplete={isEmail ? "email" : "username"}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
          id="identifier"
          key={mode}
          name="identifier"
          placeholder={content.identifierPlaceholder}
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
        className="w-full rounded-xl bg-teal-800 px-4 py-3 font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "登入中…" : content.submitLabel}
      </button>

      <p className="text-center text-sm leading-6 text-slate-600">
        {isEmail
          ? "尚未建立會員帳號？可先瀏覽商品，或依網站指示申請會員服務。"
          : "尚未取得企業客戶代碼？請聯繫元家業務窗口協助開通。"}
      </p>
    </form>
  );
}

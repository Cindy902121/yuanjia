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
    identifierPlaceholder: "例如：Z232113",
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
      <fieldset className="grid grid-cols-2 rounded-lg bg-[#EAF5FB] p-1" disabled={isSubmitting}>
        <legend className="sr-only">選擇登入方式</legend>
        <button
          aria-pressed={isEmail}
          className={`min-h-11 rounded-md px-3 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] ${
            isEmail
              ? "bg-white text-[#17242A] shadow-[0_1px_3px_rgba(23,36,42,0.16)]"
              : "text-[#536168] hover:text-[#00457F]"
          }`}
          onClick={() => chooseMode("email")}
          type="button"
        >
          會員登入
        </button>
        <button
          aria-pressed={!isEmail}
          className={`min-h-11 rounded-md px-3 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] ${
            !isEmail
              ? "bg-white text-[#17242A] shadow-[0_1px_3px_rgba(23,36,42,0.16)]"
              : "text-[#536168] hover:text-[#00457F]"
          }`}
          onClick={() => chooseMode("customer-code")}
          type="button"
        >
          企業客戶
        </button>
      </fieldset>

      <p className="rounded-lg border border-[#CFE3F0] bg-[#EAF5FB] px-4 py-3 text-sm leading-6 text-[#00457F]">
        {content.description}
      </p>

      <div>
        <label className="block text-sm font-semibold text-[#17242A]" htmlFor="identifier">
          {content.identifierLabel}
        </label>
        <input
          autoComplete={isEmail ? "email" : "username"}
          className="mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] bg-white px-4 py-3 text-[#17242A] outline-none transition duration-200 placeholder:text-[#809099] focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]"
          id="identifier"
          key={mode}
          name="identifier"
          placeholder={content.identifierPlaceholder}
          required
          type={isEmail ? "email" : "text"}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17242A]" htmlFor="password">
          密碼
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] bg-white px-4 py-3 text-[#17242A] outline-none transition duration-200 focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {message ? (
        <p aria-live="polite" className="rounded-lg border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318]" role="alert">
          {message}
        </p>
      ) : null}

      <button
        className="min-h-12 w-full rounded-lg bg-[#005DAA] px-4 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] disabled:cursor-not-allowed disabled:bg-[#94A3A8]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "登入中…" : content.submitLabel}
      </button>

      <p className="text-center text-sm leading-6 text-[#536168]">
        {isEmail
          ? "尚未建立會員帳號？可先瀏覽商品，或依網站指示申請會員服務。"
          : "尚未取得企業客戶代碼？請聯繫元家業務窗口協助開通。"}
      </p>
    </form>
  );
}

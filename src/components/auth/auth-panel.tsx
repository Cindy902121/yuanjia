"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";

export type AuthView = "login" | "register" | "forgot" | "update-password";
export type AuthMessageTone = "error" | "success";

type LoginMode = "email" | "customer-code";
type ApiResult = {
  authenticated?: boolean;
  error?: string;
  message?: string;
  redirectTo?: string;
};

type AuthPanelProps = {
  initialMessage?: string;
  initialMessageTone?: AuthMessageTone;
  initialView?: AuthView;
  onCompleted?: (redirectTo?: string) => void;
  showBusinessMode?: boolean;
};

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const googleEnabled = ["1", "true"].includes(process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED ?? "");

const inputClass =
  "mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] bg-white px-4 py-3 text-[#17242A] outline-none transition duration-200 placeholder:text-[#809099] focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]";
const primaryButtonClass =
  "min-h-12 w-full rounded-lg bg-[#005DAA] px-4 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] disabled:cursor-not-allowed disabled:bg-[#94A3A8]";
const textButtonClass =
  "text-[#005DAA] underline underline-offset-2 hover:text-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]";

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

function messageFrom(result: ApiResult, fallback: string) {
  return result.message ?? result.error ?? fallback;
}

function currentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

async function readApiResult(response: Response) {
  return (await response.json().catch(() => ({}))) as ApiResult;
}

export function AuthPanel({
  initialMessage = "",
  initialMessageTone = "error",
  initialView = "login",
  onCompleted,
  showBusinessMode = false,
}: AuthPanelProps) {
  const [view, setView] = useState<AuthView>(initialView);
  const [mode, setMode] = useState<LoginMode>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [messageTone, setMessageTone] = useState<AuthMessageTone>(initialMessageTone);
  const content = modeContent[mode];
  const isEmail = mode === "email";

  function clearMessage() {
    setMessage("");
    setMessageTone("error");
  }

  function showError(nextMessage: string) {
    setMessage(nextMessage);
    setMessageTone("error");
  }

  function showSuccess(nextMessage: string) {
    setMessage(nextMessage);
    setMessageTone("success");
  }

  function complete(redirectTo?: string) {
    if (onCompleted) {
      onCompleted(redirectTo);
      return;
    }
    window.location.assign(redirectTo ?? "/");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    clearMessage();

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/login", {
        body: JSON.stringify({
          identifier: formData.get("identifier"),
          password: formData.get("password"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await readApiResult(response);

      if (!response.ok || !result.redirectTo) {
        showError(messageFrom(result, "登入失敗，請稍後再試。"));
        return;
      }

      complete(result.redirectTo);
    } catch {
      showError("目前無法連線登入服務，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    clearMessage();

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/register", {
        body: JSON.stringify({
          email: formData.get("email"),
          next: currentPath(),
          password: formData.get("password"),
          passwordConfirmation: formData.get("passwordConfirmation"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await readApiResult(response);

      if (!response.ok) {
        showError(messageFrom(result, "註冊失敗，請稍後再試。"));
        return;
      }

      if (result.authenticated) {
        complete(result.redirectTo);
        return;
      }

      setView("login");
      setMode("email");
      showSuccess(result.message ?? "註冊成功，請至 Email 完成驗證。");
    } catch {
      showError("目前無法連線註冊服務，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    clearMessage();

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/password-reset", {
        body: JSON.stringify({ email: formData.get("email"), next: currentPath() }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await readApiResult(response);

      if (!response.ok) {
        showError(messageFrom(result, "目前無法寄出密碼重設信。"));
        return;
      }

      setView("login");
      setMode("email");
      showSuccess(result.message ?? "重設密碼信已寄出，請檢查 Email。");
    } catch {
      showError("目前無法連線密碼重設服務，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    clearMessage();

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    if (
      typeof password !== "string" ||
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      showError(`新密碼需為 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 個字元。`);
      setIsSubmitting(false);
      return;
    }
    if (password !== formData.get("passwordConfirmation")) {
      showError("兩次輸入的密碼不一致。");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await createClient().auth.updateUser({ password: String(password) });
      if (error) {
        showError("新密碼更新失敗，請重新操作密碼重設流程。");
        return;
      }
      complete();
    } catch {
      showError("目前無法更新密碼，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    clearMessage();

    try {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("mode", "google");
      callback.searchParams.set("next", currentPath());
      const { data, error } = await createClient().auth.signInWithOAuth({
        options: { redirectTo: callback.toString() },
        provider: "google",
      });

      if (error || !data.url) {
        showError("Google 登入目前無法使用，請改用 Email 登入。");
        return;
      }
      window.location.assign(data.url);
    } catch {
      showError("Google 登入目前無法使用，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  function chooseMode(nextMode: LoginMode) {
    setMode(nextMode);
    clearMessage();
  }

  function chooseView(nextView: AuthView) {
    setView(nextView);
    setMode("email");
    clearMessage();
  }

  if (view === "register") {
    return (
      <form className="mt-6 space-y-5" onSubmit={handleRegister}>
        <h2 className="text-2xl font-bold tracking-tight text-[#17242A]">註冊會員</h2>
        <p className="rounded-lg border border-[#CFE3F0] bg-[#EAF5FB] px-4 py-3 text-sm leading-6 text-[#00457F]">
          建立帳號後，請至 Email 完成驗證，再回到網站登入。
        </p>
        <div>
          <label className="block text-sm font-semibold text-[#17242A]" htmlFor="auth-register-email">
            Email
          </label>
          <input
            autoComplete="email"
            className={inputClass}
            id="auth-register-email"
            name="email"
            placeholder="name@example.com"
            required
            type="email"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#17242A]" htmlFor="auth-register-password">
            密碼
          </label>
          <input
            autoComplete="new-password"
            className={inputClass}
            id="auth-register-password"
            maxLength={PASSWORD_MAX_LENGTH}
            minLength={PASSWORD_MIN_LENGTH}
            name="password"
            required
            type="password"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#17242A]" htmlFor="auth-register-password-confirmation">
            再次輸入密碼
          </label>
          <input
            autoComplete="new-password"
            className={inputClass}
            id="auth-register-password-confirmation"
            maxLength={PASSWORD_MAX_LENGTH}
            minLength={PASSWORD_MIN_LENGTH}
            name="passwordConfirmation"
            required
            type="password"
          />
        </div>
        {message ? <Message tone={messageTone}>{message}</Message> : null}
        <button className={primaryButtonClass} disabled={isSubmitting} type="submit">
          {isSubmitting ? "建立中…" : "建立會員帳號"}
        </button>
        <button className={`${textButtonClass} mx-auto block text-sm`} onClick={() => chooseView("login")} type="button">
          返回登入
        </button>
      </form>
    );
  }

  if (view === "forgot") {
    return (
      <form className="mt-6 space-y-5" onSubmit={handleForgot}>
        <h2 className="text-2xl font-bold tracking-tight text-[#17242A]">忘記密碼</h2>
        <p className="rounded-lg border border-[#CFE3F0] bg-[#EAF5FB] px-4 py-3 text-sm leading-6 text-[#00457F]">
          輸入註冊會員使用的 Email，我們會寄出密碼重設連結。
        </p>
        <div>
          <label className="block text-sm font-semibold text-[#17242A]" htmlFor="auth-forgot-email">
            Email
          </label>
          <input
            autoComplete="email"
            className={inputClass}
            id="auth-forgot-email"
            name="email"
            placeholder="name@example.com"
            required
            type="email"
          />
        </div>
        {message ? <Message tone={messageTone}>{message}</Message> : null}
        <button className={primaryButtonClass} disabled={isSubmitting} type="submit">
          {isSubmitting ? "寄送中…" : "寄送重設密碼信"}
        </button>
        <button className={`${textButtonClass} mx-auto block text-sm`} onClick={() => chooseView("login")} type="button">
          返回登入
        </button>
      </form>
    );
  }

  if (view === "update-password") {
    return (
      <form className="mt-6 space-y-5" onSubmit={handleUpdatePassword}>
        <h2 className="text-2xl font-bold tracking-tight text-[#17242A]">設定新密碼</h2>
        <p className="rounded-lg border border-[#CFE3F0] bg-[#EAF5FB] px-4 py-3 text-sm leading-6 text-[#00457F]">
          請設定 {PASSWORD_MIN_LENGTH}–{PASSWORD_MAX_LENGTH} 個字元的新密碼。
        </p>
        <div>
          <label className="block text-sm font-semibold text-[#17242A]" htmlFor="auth-update-password">
            新密碼
          </label>
          <input
            autoComplete="new-password"
            className={inputClass}
            id="auth-update-password"
            maxLength={PASSWORD_MAX_LENGTH}
            minLength={PASSWORD_MIN_LENGTH}
            name="password"
            required
            type="password"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#17242A]" htmlFor="auth-update-password-confirmation">
            再次輸入新密碼
          </label>
          <input
            autoComplete="new-password"
            className={inputClass}
            id="auth-update-password-confirmation"
            maxLength={PASSWORD_MAX_LENGTH}
            minLength={PASSWORD_MIN_LENGTH}
            name="passwordConfirmation"
            required
            type="password"
          />
        </div>
        {message ? <Message tone={messageTone}>{message}</Message> : null}
        <button className={primaryButtonClass} disabled={isSubmitting} type="submit">
          {isSubmitting ? "更新中…" : "更新密碼"}
        </button>
      </form>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleLogin}>
      {showBusinessMode ? (
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
      ) : null}

      <p className="rounded-lg border border-[#CFE3F0] bg-[#EAF5FB] px-4 py-3 text-sm leading-6 text-[#00457F]">
        {content.description}
      </p>

      <div>
        <label className="block text-sm font-semibold text-[#17242A]" htmlFor="auth-identifier">
          {content.identifierLabel}
        </label>
        <input
          autoComplete={isEmail ? "email" : "username"}
          className={inputClass}
          id="auth-identifier"
          key={mode}
          name="identifier"
          placeholder={content.identifierPlaceholder}
          required
          type={isEmail ? "email" : "text"}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#17242A]" htmlFor="auth-password">
          密碼
        </label>
        <input
          autoComplete="current-password"
          className={inputClass}
          id="auth-password"
          name="password"
          required
          type="password"
        />
      </div>

      {message ? <Message tone={messageTone}>{message}</Message> : null}

      <button className={primaryButtonClass} disabled={isSubmitting} type="submit">
        {isSubmitting ? "登入中…" : content.submitLabel}
      </button>

      {isEmail ? (
        <>
          {googleEnabled ? (
            <>
              <div className="flex items-center gap-3 text-xs text-[#809099]" aria-hidden="true">
                <span className="h-px flex-1 bg-[#D9E1E5]" />
                <span>或</span>
                <span className="h-px flex-1 bg-[#D9E1E5]" />
              </div>
              <button
                className="min-h-12 w-full rounded-lg border border-[#D9E1E5] bg-white px-4 py-3 font-semibold text-[#17242A] transition duration-200 hover:border-[#005DAA] hover:bg-[#F7FBFD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={handleGoogleLogin}
                type="button"
              >
                使用 Google 登入
              </button>
            </>
          ) : null}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-[#536168]">
            <button className={textButtonClass} onClick={() => chooseView("register")} type="button">
              註冊會員
            </button>
            <button className={textButtonClass} onClick={() => chooseView("forgot")} type="button">
              忘記密碼
            </button>
          </div>
        </>
      ) : null}

      <p className="text-center text-sm leading-6 text-[#536168]">
        {isEmail
          ? "可先瀏覽商品，登入後可使用會員中心。"
          : "尚未取得企業客戶代碼？請聯繫元家業務窗口協助開通。"}
      </p>
    </form>
  );
}

function Message({ children, tone }: { children: string; tone: AuthMessageTone }) {
  return (
    <p
      aria-live="polite"
      className={
        tone === "success"
          ? "rounded-lg border border-[#B7DEC8] bg-[#F0FAF3] px-4 py-3 text-sm text-[#176B3A]"
          : "rounded-lg border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318]"
      }
      role={tone === "success" ? "status" : "alert"}
    >
      {children}
    </p>
  );
}

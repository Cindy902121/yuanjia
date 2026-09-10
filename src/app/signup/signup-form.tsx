"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const formClassName =
  "mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] bg-white px-4 py-3 text-[#17242A] outline-none transition duration-200 placeholder:text-[#809099] focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]";

export function SignupForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(formData.get("password_confirmation") ?? "");

    if (password.length < 8) {
      setMessage("密碼至少需要 8 個字元。");
      return;
    }
    if (password !== passwordConfirmation) {
      setMessage("兩次輸入的密碼不一致。");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const { data, error } = await createClient().auth.signUp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        router.push("/");
        return;
      }

      setIsComplete(true);
      setMessage("帳號建立流程已送出，請依 Email 中的連結完成驗證後再登入。若未收到，請檢查垃圾郵件。");
    } catch {
      setMessage("目前無法建立帳號，請確認資料後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <fieldset className="space-y-5" disabled={isSubmitting || isComplete}>
        <legend className="sr-only">建立 B2C 會員帳號</legend>

        <div>
          <label className="block text-sm font-semibold text-[#17242A]" htmlFor="signup-email">
            Email
          </label>
          <input autoComplete="email" className={formClassName} id="signup-email" name="email" required type="email" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#17242A]" htmlFor="signup-password">
            密碼
          </label>
          <input
            autoComplete="new-password"
            className={formClassName}
            id="signup-password"
            minLength={8}
            name="password"
            required
            type="password"
          />
          <p className="mt-2 text-xs leading-5 text-[#536168]">至少 8 個字元。</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#17242A]" htmlFor="signup-password-confirmation">
            再次輸入密碼
          </label>
          <input
            autoComplete="new-password"
            className={formClassName}
            id="signup-password-confirmation"
            minLength={8}
            name="password_confirmation"
            required
            type="password"
          />
        </div>
      </fieldset>

      {message ? (
        <p aria-live="polite" className="rounded-lg border border-[#CFE3F0] bg-[#EAF5FB] px-4 py-3 text-sm leading-6 text-[#00457F]" role="status">
          {message}
        </p>
      ) : null}

      {!isComplete ? (
        <button
          className="min-h-12 w-full rounded-lg bg-[#005DAA] px-4 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] disabled:cursor-not-allowed disabled:bg-[#94A3A8]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "建立中…" : "建立新帳號"}
        </button>
      ) : null}

      <p className="text-center text-sm leading-6 text-[#536168]">
        已經有帳號？
        <Link className="ml-1 font-semibold text-[#005DAA] underline underline-offset-4 hover:text-[#00457F]" href="/login">
          返回登入
        </Link>
      </p>
    </form>
  );
}

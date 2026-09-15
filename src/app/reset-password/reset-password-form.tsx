"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type View = "checking" | "request" | "update";
type Status = { kind: "error" | "success"; message: string } | null;

const inputClass =
  "mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] bg-white px-4 py-3 text-[#17242A] outline-none transition duration-200 placeholder:text-[#809099] focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]";

export function ResetPasswordForm({ canReset }: { canReset: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<View>("checking");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && canReset && event === "PASSWORD_RECOVERY" && session) setView("update");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (active) setView(data.session && canReset ? "update" : "request");
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [canReset]);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    const { error } = await createClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setStatus({ kind: "error", message: "目前無法寄出重設連結，請稍後再試。" });
    } else {
      setRequestSent(true);
    }
    setIsSubmitting(false);
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (newPassword.length < 8) {
      setStatus({ kind: "error", message: "新密碼至少需要 8 個字元。" });
      return;
    }
    if (newPassword !== confirmation) {
      setStatus({ kind: "error", message: "兩次輸入的新密碼不一致。" });
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus({ kind: "error", message: "重設密碼連結已失效，請重新申請。" });
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    router.replace("/auth/callback?clear=password-recovery");
  }

  if (view === "checking") {
    return <p aria-live="polite" className="mt-8 text-sm text-[#536168]" role="status">正在確認重設連結…</p>;
  }

  if (requestSent) {
    return (
      <div className="mt-8 space-y-5 text-center">
        <p aria-live="polite" className="rounded-lg border border-[#CFE3F0] bg-[#EAF5FB] px-4 py-3 text-sm leading-6 text-[#00457F]" role="status">
          如果這個 Email 已註冊，重設連結已寄出，請檢查收件匣或垃圾郵件。
        </p>
        <Link className="inline-flex font-semibold text-[#005DAA] underline underline-offset-4 hover:text-[#00457F]" href="/login">
          返回登入
        </Link>
      </div>
    );
  }

  if (view === "request") {
    return (
      <form className="mt-8 space-y-5" onSubmit={requestReset}>
        <label className="block text-sm font-semibold text-[#17242A]" htmlFor="reset-email">
          Email
          <input
            autoComplete="email"
            className={inputClass}
            id="reset-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        {status ? <p aria-live="polite" className="rounded-lg border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318]" role="alert">{status.message}</p> : null}
        <button
          className="min-h-12 w-full rounded-lg bg-[#005DAA] px-4 py-3 font-semibold text-white transition duration-200 hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] disabled:cursor-not-allowed disabled:bg-[#94A3A8]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "寄送中…" : "寄送重設連結"}
        </button>
        <p className="text-center text-sm text-[#536168]"><Link className="font-semibold text-[#005DAA] underline underline-offset-4 hover:text-[#00457F]" href="/login">返回登入</Link></p>
      </form>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={updatePassword}>
      <fieldset className="space-y-5" disabled={isSubmitting}>
        <legend className="sr-only">設定新密碼</legend>
        <label className="block text-sm font-semibold text-[#17242A]" htmlFor="new-password">
          新密碼
          <input
            autoComplete="new-password"
            aria-describedby="reset-password-help"
            className={inputClass}
            id="new-password"
            minLength={8}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />
        </label>
        <label className="block text-sm font-semibold text-[#17242A]" htmlFor="confirm-new-password">
          確認新密碼
          <input
            autoComplete="new-password"
            aria-describedby="reset-password-help"
            className={inputClass}
            id="confirm-new-password"
            minLength={8}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            type="password"
            value={confirmation}
          />
        </label>
      </fieldset>
      <p className="text-xs leading-5 text-[#536168]" id="reset-password-help">密碼至少 8 個字元，建議混合英文字母、數字與符號。</p>
      {status ? <p aria-live="polite" className="rounded-lg border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318]" role="alert">{status.message}</p> : null}
      <button
        className="min-h-12 w-full rounded-lg bg-[#005DAA] px-4 py-3 font-semibold text-white transition duration-200 hover:bg-[#00457F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] disabled:cursor-not-allowed disabled:bg-[#94A3A8]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "更新中…" : "重設密碼"}
      </button>
    </form>
  );
}

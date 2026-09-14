"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ChangePasswordFormProps = {
  email: string;
  tone?: "editorial" | "business";
};

export function ChangePasswordForm({ email, tone = "editorial" }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isBusiness = tone === "business";
  const inputClass = isBusiness
    ? "mt-2 min-h-11 w-full rounded-lg border border-[#B9CCD5] bg-white px-3 text-sm text-[#17242A] outline-none transition focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]"
    : "mt-2 min-h-11 w-full border border-[#2b2b2b]/20 bg-white px-3 text-sm text-[#2b2b2b] outline-none transition focus:border-[#3E5C6B] focus:ring-4 focus:ring-[#E7EFF1]";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
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
    if (currentPassword === newPassword) {
      setStatus({ kind: "error", message: "新密碼請與目前密碼不同。" });
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: verificationError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (verificationError) {
      setStatus({ kind: "error", message: "目前密碼不正確，請重新輸入。" });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus({ kind: "error", message: "暫時無法變更密碼，請稍後再試。" });
      setSubmitting(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmation("");
    setStatus({ kind: "success", message: "密碼已更新；下次請以新密碼登入。" });
    setSubmitting(false);
  }

  return (
    <form className={isBusiness ? "mt-4 max-w-xl" : "mt-5 max-w-xl"} onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-[#2B2B2B] sm:col-span-2" htmlFor="current-password">
          目前密碼
          <input autoComplete="current-password" className={inputClass} id="current-password" onChange={(event) => setCurrentPassword(event.target.value)} required type="password" value={currentPassword} />
        </label>
        <label className="text-sm font-medium text-[#2B2B2B]" htmlFor="new-password">
          新密碼
          <input autoComplete="new-password" className={inputClass} id="new-password" minLength={8} onChange={(event) => setNewPassword(event.target.value)} required type="password" value={newPassword} />
        </label>
        <label className="text-sm font-medium text-[#2B2B2B]" htmlFor="confirm-new-password">
          確認新密碼
          <input autoComplete="new-password" className={inputClass} id="confirm-new-password" minLength={8} onChange={(event) => setConfirmation(event.target.value)} required type="password" value={confirmation} />
        </label>
      </div>
      <p className={isBusiness ? "mt-3 text-xs leading-5 text-[#536168]" : "mt-3 text-xs leading-5 text-[#8a8a8a]"}>密碼至少 8 個字元，建議混合英文字母、數字與符號。</p>
      <button className={isBusiness ? "mt-5 min-h-11 rounded-lg bg-[#005DAA] px-5 text-sm font-bold text-white transition hover:bg-[#00457F] disabled:cursor-not-allowed disabled:bg-[#A2B5BF]" : "mt-5 border border-[#2b2b2b] bg-[#2b2b2b] px-5 py-2 text-xs tracking-[0.1em] text-white transition hover:bg-transparent hover:text-[#2b2b2b] disabled:cursor-not-allowed disabled:border-[#a8a8a8] disabled:bg-[#a8a8a8]"} disabled={submitting} type="submit">{submitting ? "更新中…" : "更新密碼"}</button>
      {status ? <p aria-live="polite" className={`mt-4 border px-3 py-2 text-sm ${status.kind === "success" ? "border-[#B5DCC7] bg-[#F0FAF4] text-[#18794E]" : "border-[#F4C7C3] bg-[#FFF1F0] text-[#B42318]"}`} role={status.kind === "error" ? "alert" : "status"}>{status.message}</p> : null}
    </form>
  );
}

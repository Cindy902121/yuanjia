"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type PasswordResponse = { error?: string };

export default function PasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get("new_password");
    if (newPassword !== formData.get("new_password_confirmation")) {
      setError("兩次輸入的新密碼不一致。");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/b2b/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: formData.get("current_password"),
          new_password: newPassword,
          new_password_confirmation: formData.get("new_password_confirmation"),
        }),
      });
      const payload = (await response.json()) as PasswordResponse;
      if (!response.ok) {
        setError(payload.error ?? "密碼更新失敗，請稍後再試。");
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setError("密碼更新失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={submit}>
      <div>
        <label className="block text-sm font-semibold text-[#17242A]" htmlFor="current-password">目前密碼</label>
        <input autoComplete="current-password" className="mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] px-4 py-3 outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]" id="current-password" name="current_password" required type="password" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#17242A]" htmlFor="new-password">新密碼</label>
        <input autoComplete="new-password" className="mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] px-4 py-3 outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]" id="new-password" maxLength={72} minLength={8} name="new_password" required type="password" />
        <p className="mt-1 text-xs text-[#809099]">8–72 個字元。</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#17242A]" htmlFor="new-password-confirmation">確認新密碼</label>
        <input autoComplete="new-password" className="mt-2 min-h-12 w-full rounded-lg border border-[#D9E1E5] px-4 py-3 outline-none focus:border-[#005DAA] focus:ring-4 focus:ring-[#EAF5FB]" id="new-password-confirmation" maxLength={72} minLength={8} name="new_password_confirmation" required type="password" />
      </div>
      {error ? <p aria-live="polite" className="rounded-lg border border-[#F4C7C3] bg-[#FFF1F0] px-4 py-3 text-sm text-[#B42318]" role="alert">{error}</p> : null}
      <button className="min-h-12 w-full rounded-lg bg-[#005DAA] px-4 py-3 font-semibold text-white transition hover:bg-[#00457F] disabled:cursor-not-allowed disabled:opacity-50" disabled={isSubmitting} type="submit">{isSubmitting ? "更新中…" : "更新密碼並重新登入"}</button>
    </form>
  );
}

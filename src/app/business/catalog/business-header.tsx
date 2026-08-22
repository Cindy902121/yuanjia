"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export const INQUIRY_COUNT_EVENT = "yuanjia:inquiry-count";
export const OPEN_INQUIRY_EVENT = "yuanjia:open-inquiry";

type BusinessHeaderProps = {
  companyName: string;
};

/**
 * B2B 專屬 Header。公司名稱由受保護的型錄頁傳入；詢價單件數由同頁工作區透過瀏覽器事件同步。
 */
export default function BusinessHeader({ companyName }: BusinessHeaderProps) {
  const router = useRouter();
  const [inquiryCount, setInquiryCount] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    function updateInquiryCount(event: Event) {
      setInquiryCount((event as CustomEvent<number>).detail ?? 0);
    }

    window.addEventListener(INQUIRY_COUNT_EVENT, updateInquiryCount);
    return () => window.removeEventListener(INQUIRY_COUNT_EVENT, updateInquiryCount);
  }, []);

  function openInquiry() {
    window.dispatchEvent(new Event(OPEN_INQUIRY_EVENT));
  }

  async function signOut() {
    setIsSigningOut(true);
    setSignOutError("");

    const { error } = await createClient().auth.signOut({ scope: "local" });
    if (error) {
      setSignOutError("登出失敗，請稍後再試。");
      setIsSigningOut(false);
      return;
    }

    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#D9E1E5] bg-white/95 shadow-[0_4px_16px_rgba(23,36,42,0.04)] backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <img
            alt="元家"
            className="h-11 w-auto shrink-0 object-contain sm:h-12"
            src="https://www.yens.com.tw/proimages/logo/logo_ch.png"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.16em] text-[#005DAA]">YUANJIA BUSINESS</p>
            <p className="mt-0.5 truncate text-base font-bold text-[#17242A]">企業型錄</p>
          </div>
          <span className="hidden h-8 w-px bg-[#D9E1E5] sm:block" aria-hidden="true" />
          <p className="hidden max-w-56 truncate text-sm font-medium text-[#536168] sm:block" title={companyName}>
            {companyName}・企業帳戶
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            aria-label={`查看詢價單，目前 ${inquiryCount} 項`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#8FB8CD] bg-[#F4FAFD] px-3 text-sm font-bold text-[#005DAA] transition hover:border-[#005DAA] hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] sm:px-4"
            onClick={openInquiry}
            type="button"
          >
            <span>詢價單</span>
            <span className="grid min-w-5 place-items-center rounded-full bg-[#005DAA] px-1.5 py-0.5 text-xs text-white">{inquiryCount}</span>
          </button>
          <button
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#536168] transition hover:bg-[#F1F5F7] hover:text-[#17242A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] disabled:cursor-not-allowed disabled:text-[#809099] sm:px-4"
            disabled={isSigningOut}
            onClick={signOut}
            type="button"
          >
            {isSigningOut ? "登出中…" : "登出"}
          </button>
        </div>
      </div>
      {signOutError ? <p aria-live="polite" className="border-t border-[#F4C7C3] bg-[#FFF1F0] px-5 py-2 text-center text-sm text-[#B42318]" role="alert">{signOutError}</p> : null}
    </header>
  );
}

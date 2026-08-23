"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

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
  const pathname = usePathname();
  const [inquiryCount, setInquiryCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
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

        <nav aria-label="企業導覽" className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-[#E2E8EB] pt-2 text-sm lg:order-none lg:w-auto lg:gap-2 lg:border-t-0 lg:pt-0">
          {[{ href: "/business", label: "首頁" }, { href: "/business/catalog", label: "企業型錄" }, { href: "/business/product-finder", label: "需求篩選" }, { href: "/business/rfq", label: "詢價紀錄" }].map((item) => {
            const active = item.href === "/business" ? pathname === "/business" : pathname.startsWith(item.href);
            return <Link className={`shrink-0 rounded-md px-3 py-2 font-semibold transition ${active ? "bg-[#EAF5FB] font-bold text-[#005DAA]" : "text-[#536168] hover:bg-[#F1F5F7] hover:text-[#005DAA]"}`} href={item.href} key={item.href}>{item.label}</Link>;
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            aria-label={`查看詢價單，目前 ${inquiryCount} 項`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-[#005DAA] transition hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA] sm:px-4"
            onClick={openInquiry}
            type="button"
          >
            <span>詢價單</span>
            <span className="grid min-w-5 place-items-center rounded-full bg-[#005DAA] px-1.5 py-0.5 text-xs text-white">{inquiryCount}</span>
          </button>
          <div className="relative">
            <button aria-expanded={profileOpen} aria-haspopup="menu" aria-label="開啟個人設定選單" className="grid size-11 place-items-center rounded-lg text-[#005DAA] transition hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]" onClick={() => setProfileOpen((current) => !current)} type="button">
              <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
            </button>
            {profileOpen ? <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-[#D9E1E5] bg-white p-2 shadow-xl" role="menu"><button className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#A2B5BF]" disabled title="個人設定即將推出" role="menuitem" type="button">個人設定（即將推出）</button><button className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#536168] hover:bg-[#F1F5F7] hover:text-[#17242A]" disabled={isSigningOut} onClick={signOut} role="menuitem" type="button">{isSigningOut ? "登出中…" : "登出"}</button></div> : null}
          </div>
        </div>
      </div>
      {signOutError ? <p aria-live="polite" className="border-t border-[#F4C7C3] bg-[#FFF1F0] px-5 py-2 text-center text-sm text-[#B42318]" role="alert">{signOutError}</p> : null}
    </header>
  );
}

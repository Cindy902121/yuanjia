"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { createClient } from "@/lib/supabase/client";

export const INQUIRY_COUNT_EVENT = "yuanjia:inquiry-count";
export const OPEN_INQUIRY_EVENT = "yuanjia:open-inquiry";

type BusinessHeaderProps = {
  companyName: string;
};

const brandMenuGroups = [
  {
    title: "認識元家",
    items: [
      { href: "/business/about/company", label: "企業介紹", description: "企業定位、規模與核心價值" },
      { href: "/business/about/milestones", label: "發展歷程", description: "從水產事業到食品供應服務" },
    ],
  },
  {
    title: "合作能力",
    items: [
      { href: "/business/about/strengths", label: "企業優勢", description: "採購、研發、品保與冷鏈能力" },
      { href: "/business/about/supply-service", label: "供應與服務", description: "通路服務與企業合作流程" },
      { href: "/business/about/quality-safety", label: "品質與食安", description: "品質管理、追溯與公開認證" },
    ],
  },
  {
    title: "永續與資料",
    items: [
      { href: "/business/about/sustainability", label: "永續責任", description: "報告書、環境行動與公益參與" },
    ],
  },
];

/**
 * B2B 專屬 Header。公司名稱由受保護的型錄頁傳入；詢價單件數由同頁工作區透過瀏覽器事件同步。
 */
export default function BusinessHeader({ companyName }: BusinessHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isBusinessHome = pathname === "/business";
  const [hasScrolled, setHasScrolled] = useState(false);
  const transparent = isBusinessHome && !hasScrolled;
  const [inquiryCount, setInquiryCount] = useState(0);
  const [brandOpen, setBrandOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
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

  useEffect(() => {
    if (!isBusinessHome) return;

    const updateHeaderState = () => setHasScrolled(window.scrollY > 72);
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    return () => window.removeEventListener("scroll", updateHeaderState);
  }, [isBusinessHome]);

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
    <header className={transparent ? "fixed inset-x-0 top-0 z-50 bg-transparent text-white transition-[background-color,color,box-shadow] duration-300" : isBusinessHome ? "fixed inset-x-0 top-0 z-50 border-b border-[#173C49]/8 bg-white text-[#2B2B2B] shadow-[0_2px_12px_rgba(23,36,42,0.06)] transition-[background-color,color,box-shadow] duration-300" : "sticky top-0 z-30 border-b border-[#173C49]/8 bg-white shadow-[0_2px_12px_rgba(23,36,42,0.06)]"}>
      <div className="mx-auto flex min-h-[72px] max-w-[1300px] flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-3 sm:px-8 lg:h-[76px] lg:min-h-0 lg:px-10 lg:py-0">
        <div className="flex min-w-0 items-center gap-4">
          <Link aria-label="前往企業首頁" className="flex min-w-0 items-center gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E5C6B]" href="/business">
            <Image
              alt="元家"
              className="h-8 w-auto shrink-0 object-contain sm:h-9"
              height={42}
              src="/yens-logo.png"
              width={140}
            />
            <div className="min-w-0">
              <p className={`text-[10px] font-bold tracking-[0.18em] ${transparent ? "text-white/90" : "text-[#3E5C6B]"}`}>YUANJIA BUSINESS</p>
              <p className={`mt-0.5 truncate text-sm font-medium tracking-[0.08em] ${transparent ? "text-white" : "text-[#2B2B2B]"}`}>企業採購服務</p>
            </div>
          </Link>
          <span className={`hidden h-6 w-px sm:block ${transparent ? "bg-white/30" : "bg-[#2B2B2B]/15"}`} aria-hidden="true" />
          <p className={`hidden max-w-56 truncate text-xs font-medium tracking-[0.08em] sm:block ${transparent ? "text-white/90" : "text-[#6E6E6E]"}`} title={companyName}>
            {companyName}・企業帳戶
          </p>
        </div>

        <nav aria-label="企業導覽" className={`order-3 flex w-full flex-wrap items-center gap-x-6 gap-y-1 border-t pt-2 text-sm lg:order-none lg:w-auto lg:flex-nowrap lg:gap-x-7 lg:border-t-0 lg:pt-0 ${transparent ? "border-white/20" : "border-[#2B2B2B]/10"}`}>
          <div className="relative shrink-0" onMouseEnter={() => setBrandOpen(true)} onMouseLeave={() => setBrandOpen(false)}>
            <button
              aria-controls="business-brand-menu"
              aria-expanded={brandOpen}
              className={`relative inline-flex min-h-10 items-center gap-1 py-2 tracking-[0.1em] transition-colors duration-200 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:transition-colors after:duration-200 ${pathname.startsWith("/business/about") ? `font-medium ${transparent ? "text-white after:bg-white" : "text-[#3E5C6B] after:bg-[#3E5C6B]"}` : `${transparent ? "text-white/90 after:bg-transparent hover:text-white hover:after:bg-white" : "text-[#4A4A4A] after:bg-transparent hover:text-[#3E5C6B] hover:after:bg-[#3E5C6B]"}`}`}
              onClick={() => setBrandOpen((current) => !current)}
              onFocus={() => setBrandOpen(true)}
              type="button"
            >
              品牌故事
              <svg aria-hidden="true" className={`size-3 transition-transform duration-200 ${brandOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 12 8"><path d="m1 1.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
            </button>
            {brandOpen ? (
              <div className="absolute left-0 top-full z-50 w-[min(52rem,calc(100vw-2.5rem))] pt-3" id="business-brand-menu">
                <div className="border border-[#C9D6DA] bg-white shadow-[0_16px_34px_rgba(23,38,45,0.16)]">
                  <div className="hidden grid-cols-3 divide-x divide-[#D9E1E5] lg:grid">
                    {brandMenuGroups.map((group) => (
                      <section className="p-6" key={group.title}>
                        <p className="border-b border-[#C9D6DA] pb-3 text-[15px] font-semibold tracking-[0.12em] text-[#0F5B78]">{group.title}</p>
                        <div className="mt-4 space-y-1">
                          {group.items.map((item) => (
                            <Link className="group block border-l-2 border-transparent px-3 py-2.5 transition hover:border-[#0F5B78] hover:bg-[#F1F6F7]" href={item.href} key={item.href} onClick={() => setBrandOpen(false)}>
                              <span className="block text-sm font-medium text-[#17262D] group-hover:text-[#0F5B78]">{item.label}</span>
                              <span className="mt-1 block text-xs leading-5 text-[#718087]">{item.description}</span>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                  <div className="p-2 lg:hidden">
                    {brandMenuGroups.flatMap((group) => group.items).map((item) => <Link className="block px-3 py-2 text-sm text-[#4A4A4A] transition-colors hover:bg-[#F0F3F1] hover:text-[#0F5B78]" href={item.href} key={item.href} onClick={() => setBrandOpen(false)}>{item.label}</Link>)}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="relative shrink-0" onMouseEnter={() => setNewsOpen(true)} onMouseLeave={() => setNewsOpen(false)}>
            <button
              aria-controls="business-news-menu"
              aria-expanded={newsOpen}
              className={`relative inline-flex min-h-10 items-center gap-1 py-2 tracking-[0.1em] transition-colors duration-200 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:transition-colors after:duration-200 ${pathname.startsWith("/business/news") ? `font-medium ${transparent ? "text-white after:bg-white" : "text-[#3E5C6B] after:bg-[#3E5C6B]"}` : `${transparent ? "text-white/90 after:bg-transparent hover:text-white hover:after:bg-white" : "text-[#4A4A4A] after:bg-transparent hover:text-[#3E5C6B] hover:after:bg-[#3E5C6B]"}`}`}
              onClick={() => setNewsOpen((current) => !current)}
              onFocus={() => setNewsOpen(true)}
              type="button"
            >
              最新消息
              <svg aria-hidden="true" className={`size-3 transition-transform duration-200 ${newsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 12 8"><path d="m1 1.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
            </button>
            {newsOpen ? (
              <div className="absolute left-0 top-full z-50 w-36 pt-2" id="business-news-menu">
                <div className="border border-[#2B2B2B]/15 bg-white p-2 shadow-[0_8px_24px_rgba(43,43,43,0.1)]">
                  {[{ href: "/business/news/activities", label: "活動訊息" }, { href: "/business/news/yuanjia", label: "元家資訊" }, { href: "/business/news/offers", label: "大宗專案" }].map((item) => (
                    <Link className="block px-3 py-2 text-sm text-[#4A4A4A] transition-colors duration-200 hover:bg-[#F0F3F1] hover:text-[#3E5C6B]" href={item.href} key={item.href} onClick={() => setNewsOpen(false)}>
                      {item.label}
                    </Link>
                  ))}
                  <a className="block px-3 py-2 text-sm text-[#4A4A4A] transition-colors duration-200 hover:bg-[#F0F3F1] hover:text-[#3E5C6B]" href="https://charity.yens.com.tw/activities/" onClick={() => setNewsOpen(false)}>
                    公益活動
                  </a>
                </div>
              </div>
            ) : null}
          </div>
          {[{ href: "/business/catalog", label: "企業型錄" }, { href: "/business/product-finder", label: "需求篩選" }, { href: "/business/rfq", label: "詢價紀錄" }].map((item) => {
            const active = pathname.startsWith(item.href);
            return <Link className={`relative shrink-0 py-2 tracking-[0.1em] transition-colors duration-200 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:transition-colors duration-200 ${active ? `font-medium ${transparent ? "text-white after:bg-white" : "text-[#3E5C6B] after:bg-[#3E5C6B]"}` : `${transparent ? "text-white/90 after:bg-transparent hover:text-white hover:after:bg-white" : "text-[#4A4A4A] after:bg-transparent hover:text-[#3E5C6B] hover:after:bg-[#3E5C6B]"}`}`} href={item.href} key={item.href}>{item.label}</Link>;
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            aria-label={`查看詢價單，目前 ${inquiryCount} 項`}
            className={`inline-flex min-h-10 items-center gap-2 border px-3 py-1.5 text-xs font-medium tracking-[0.08em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4 ${transparent ? "border-white/70 text-white hover:border-white hover:bg-white hover:text-[#102C34] focus-visible:outline-white" : "border-[#2B2B2B]/30 text-[#2B2B2B] hover:border-[#2B2B2B] hover:bg-[#2B2B2B] hover:text-white focus-visible:outline-[#3E5C6B]"}`}
            onClick={openInquiry}
            type="button"
          >
            <span>詢價單</span>
            <span className="grid min-w-5 place-items-center rounded-full bg-[#3E5C6B] px-1.5 py-0.5 text-xs text-white">{inquiryCount}</span>
          </button>
          <div className="relative" onMouseEnter={() => setProfileOpen(true)} onMouseLeave={() => setProfileOpen(false)}>
            <button aria-expanded={profileOpen} aria-haspopup="menu" aria-label="開啟帳戶選單" className={`grid size-10 place-items-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${transparent ? "text-white/90 hover:text-white focus-visible:outline-white" : "text-[#4A4A4A] hover:text-[#3E5C6B] focus-visible:outline-[#3E5C6B]"}`} onClick={() => setProfileOpen((current) => !current)} type="button">
              <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
            </button>
            {profileOpen ? <div className="absolute right-0 top-full z-50 w-44 border border-[#2B2B2B]/15 bg-white p-2 shadow-[0_8px_24px_rgba(43,43,43,0.1)]" role="menu"><Link className="block w-full px-3 py-2 text-left text-sm text-[#4A4A4A] transition-colors duration-200 hover:bg-[#F0F3F1] hover:text-[#3E5C6B]" href="/business/account" onClick={() => setProfileOpen(false)} role="menuitem">帳號設定</Link><button className="w-full px-3 py-2 text-left text-sm text-[#4A4A4A] transition-colors duration-200 hover:bg-[#F0F3F1] hover:text-[#3E5C6B]" disabled={isSigningOut} onClick={signOut} role="menuitem" type="button">{isSigningOut ? "登出中…" : "登出"}</button></div> : null}
          </div>
        </div>
      </div>
      {signOutError ? <p aria-live="polite" className="border-t border-[#F4C7C3] bg-[#FFF1F0] px-5 py-2 text-center text-sm text-[#B42318]" role="alert">{signOutError}</p> : null}
    </header>
  );
}

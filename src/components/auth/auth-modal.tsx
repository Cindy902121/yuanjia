"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AuthPanel, type AuthMessageTone, type AuthView } from "@/components/auth/auth-panel";

type AuthModalProps = {
  isLoggedIn?: boolean;
};

const buttonClass =
  "border border-[#2b2b2b]/30 px-4 py-1.5 text-xs tracking-[0.1em] text-[#2b2b2b] transition-colors hover:border-[#2b2b2b] hover:bg-[#2b2b2b] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E5C6B]";

function isB2cPath(pathname: string) {
  return !/^\/(?:business|admin|login)(?:\/|$)/.test(pathname);
}

export function AuthModal({ isLoggedIn = false }: AuthModalProps) {
  const pathname = usePathname() ?? "/";
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<AuthMessageTone>("error");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authState = params.get("auth");
    const authError = params.get("auth_error");
    if (!authState && !authError) return;

    params.delete("auth");
    params.delete("auth_error");
    const nextQuery = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`,
    );

    if (isLoggedIn && authState !== "recovery") return;

    const callbackUpdate = window.setTimeout(() => {
      if (authState === "recovery") {
        setView("update-password");
        setMessage("請設定新的登入密碼。");
        setMessageTone("success");
      } else if (authState === "confirmed") {
        setView("login");
        setMessage("Email 已驗證，請登入。");
        setMessageTone("success");
      } else if (authError === "google-b2c-only") {
        setView("login");
        setMessage("Google 登入目前只開放 B2C 會員。");
        setMessageTone("error");
      } else {
        setView("login");
        setMessage("登入連結已失效，請重新操作。");
        setMessageTone("error");
      }
      setIsOpen(true);
    });

    return () => window.clearTimeout(callbackUpdate);
  }, [isLoggedIn, pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  if (!isB2cPath(pathname)) {
    if (isLoggedIn) return null;
    return (
      <Link href="/login" className={buttonClass}>
        會員登入
      </Link>
    );
  }

  if (isLoggedIn && !isOpen) return null;

  return (
    <>
      {!isLoggedIn ? (
        <button className={buttonClass} onClick={() => setIsOpen(true)} type="button">
          登入
        </button>
      ) : null}

      {isOpen ? (
        <div
          aria-label="會員登入與帳號服務"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#17242A]/45 px-5 py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
          role="dialog"
        >
          <div className="relative my-auto w-full max-w-md rounded-2xl border border-[#D9E1E5] bg-white p-7 shadow-[0_20px_60px_rgba(23,36,42,0.24)] sm:p-9">
            <button
              aria-label="關閉登入視窗"
              className="absolute right-5 top-4 min-h-10 min-w-10 rounded-full text-2xl leading-none text-[#536168] transition hover:bg-[#EAF5FB] hover:text-[#17242A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005DAA]"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
            <h2 className="sr-only">會員登入與帳號服務</h2>
            <AuthPanel
              initialMessage={message}
              initialMessageTone={messageTone}
              initialView={view}
              key={`${view}-${messageTone}-${message}`}
              onCompleted={() => window.location.reload()}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

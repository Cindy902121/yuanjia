"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";
import { FINDER_STEPS } from "@/lib/product-finder/config";
import { findProductsByAnswers, type FinderResultProduct } from "@/lib/product-finder/match";
import { buildProductsUrl } from "@/lib/product-finder/build-url";
import { AI_DEMO_ENTRIES } from "@/lib/product-finder/ai-demo";

const LINE_URL = "https://page.line.me/cdd6667c?openQrModal=true";

/** FDD §6.6：只掛在 B2C 公開頁面，B2B（/business/*）、後台（/admin）不掛載；
 * /login 是 B2C／B2B 共用的統一登入頁，不屬於 FDD §7.2 列出的「B2C 頁面」，
 * 這裡也一併排除，避免 B2B 使用者在登入頁看到消費者導購小工具。
 *
 * 2026-08-25：Header／Footer／B2CHelpWidget 已經改成只掛在
 * src/app/(b2c)/layout.tsx（見該檔案說明），不再是 root layout 全站套用，
 * 所以 `/login`、`/business`（`/business/lead` 除外）、`/admin` 這幾個路徑
 * 現在其實已經不會渲染到這個元件、不會執行到下面這段判斷——這裡的
 * `usePathname()` 排除邏輯變成「多一層保險」而不是唯一防線，故意保留沒有
 * 刪除：如果之後有人不小心把某個 B2B／Admin 頁面誤放進 `(b2c)` route group，
 * 這裡還能再擋一次，不是遺漏沒清理。 */
const EXCLUDED_PREFIXES = ["/login", "/business", "/admin"];

/**
 * 2026-08-19（建立 /business/lead 時發現）：`/business/lead`（企業合作展示
 * 表單）雖然路徑開頭是 `/business`，但 FDD §7.2 明確把它列在「B2C 頁面」清單
 * 裡，不是 B2B 私有型錄的一部分（見 src/app/(b2c)/business/lead/page.tsx
 * 檔頭說明）——上面的 `EXCLUDED_PREFIXES` 用「開頭是 /business 就排除」的
 * 寫法，會連這個其實該顯示小工具的頁面也一起擋掉，這裡另外白名單排除，蓋過
 * 上面的前綴規則。
 */
const B2C_EXCEPTION_PATHS = ["/business/lead"];

type View = "menu" | "finder" | "ai";

/**
 * B2C 需求釐清浮動工具（PRD B2C-05、FDD §6.6，元件名稱對齊 FDD §7.1 的
 * B2CHelpWidget）。全站 B2C 頁面右下角固定顯示，展開後三個入口：Line@、
 * 固定四步篩選小工具、固定 AI 示範問答。
 *
 * 篩選小工具的資料來源見 src/lib/product-finder/config.ts、match.ts 檔頭註解——
 * 打 C 已經寫好的 GET /api/b2c/product-finder。查詢是非同步的，多一個 loading
 * 狀態。
 *
 * 「單一結果導向商品詳情」這裡採用「面板內顯示連結，使用者自己點」而不是
 * 「答完最後一步自動跳轉頁面」——自動導頁對鍵盤／螢幕閱讀器使用者來說是不可
 * 預期的畫面跳動，改成顯示結果卡片讓使用者自己決定要不要點進去。
 *
 * 2026-08-19：A／B／C 三人都確認喜歡日系雜誌編排風，這裡也換成編輯風視覺——
 * 觸發按鈕維持圓形（浮動小工具的通用慣例，一眼就看得出是「可以點的輔助功能」，
 * 不是版面主要內容，這裡刻意不跟著全站直角語言硬套），改用墨色系配色；面板
 * 本身（選單、篩選問答、AI 示範問答）改直角、細框、編輯風字體，跟全站其他
 * 面板（購物車抽屜等）用同一套視覺語言。所有邏輯／狀態機／API 呼叫完全不變。
 *
 * 2026-09-11（使用者要求：Launcher 重新設計為「海洋客服小助手」章魚造型，
 * 明確只換視覺、不動功能）：觸發按鈕從「深色實心圓＋💬 emoji」換成一隻
 * 簡約章魚 SVG（配色沿用全站既有 ink `#0B1620`／glacier `#EAF4F8`／coral
 * `#FF5A36`，沒有新增任何一套顏色），純 CSS 做 idle 呼吸浮動、一條觸手
 * 慢速搖擺、hover 時另一條觸手揮動＋章魚整體輕微上浮放大＋淡出的小水波紋
 * ＋旁邊出現「需要幫忙嗎？」提示；`prefers-reduced-motion: reduce` 時全部
 * 動畫關閉。這些全部是純 CSS `:hover`／`:focus-visible`／`@keyframes`，
 * 沒有新增任何 React state、沒有碰 `openPanel`／`closePanel`／Escape鍵／
 * 點外面關閉／focus 管理／`footerOverlap` 定位邏輯——`<button>` 本身的
 * ref／onClick／aria-haspopup／aria-expanded／sr-only 文字都原封不動，
 * 面板開關的實際行為（含這行以下的所有內容）完全沒有改動。原本沒有
 * unread／通知數字的功能，這次也沒有新增。
 */
export function B2CHelpWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finderStarted, setFinderStarted] = useState(false);

  const [results, setResults] = useState<FinderResultProduct[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstFocusRef = useRef<HTMLAnchorElement>(null);

  const [footerOverlap, setFooterOverlap] = useState(0);

  /**
   * 2026-08-25（響應式稽核發現）：這顆按鈕是 `position: fixed` 釘在視窗
   * 右下角，內容較短的頁面（結帳空車、會員中心未登入畫面等）捲到底時，
   * Footer 會跟這個固定位置疊在一起——實測過沒有蓋到任何可點擊的 Footer
   * 連結，純粹是視覺重疊，但畫面看起來不乾淨。
   *
   * 做法：用 IntersectionObserver 監看 Footer 什麼時候進入視窗底部附近，
   * 真的接近／進入視窗時才掛 scroll 監聽去算確切的重疊像素，把按鈕往上
   * 推開剛好的距離，讓它穩穩貼在 Footer 上緣，不是整個隱藏（隱藏的話，
   * 內容短的頁面等於整頁都看不到這顆按鈕，違反 FDD §6.6「全站 B2C 頁面
   * 右下角固定顯示」的要求）。平常（Footer 不在視窗附近時）不掛 scroll
   * 監聽，避免每頁多一個持續觸發的 scroll handler。
   */
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) {
      return;
    }

    let ticking = false;

    function measureOverlap() {
      ticking = false;
      const footerTop = footer!.getBoundingClientRect().top;
      const overlap = window.innerHeight - footerTop;
      setFooterOverlap(overlap > 0 ? overlap + 12 : 0);
    }

    function onScrollOrResize() {
      if (ticking) {
        return;
      }
      ticking = true;
      requestAnimationFrame(measureOverlap);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isNearFooter = entries.some((entry) => entry.isIntersecting);
        if (isNearFooter) {
          measureOverlap();
          window.addEventListener("scroll", onScrollOrResize, { passive: true });
          window.addEventListener("resize", onScrollOrResize);
        } else {
          window.removeEventListener("scroll", onScrollOrResize);
          window.removeEventListener("resize", onScrollOrResize);
          setFooterOverlap(0);
        }
      },
      { rootMargin: "80px 0px 0px 0px" },
    );
    observer.observe(footer);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  const isB2cException = B2C_EXCEPTION_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isExcludedRoute =
    !isB2cException &&
    EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  /**
   * 2026-09（P1-1，C 提出）：原本這個 filter 只在下面「查結果」的 effect 裡
   * 算一次，結果畫面（下方 JSX）要組「查看全部」連結時沒有現成的值可用。
   * 抽成一個共用的 derived value，兩邊算的是同一份東西，不是分開各自維護
   * 一次容易兜不起來的邏輯。
   */
  const selectedAnswerKeys = useMemo(
    () => FINDER_STEPS.map((s) => answers[s.key]).filter((key): key is string => Boolean(key) && key !== "any"),
    [answers],
  );

  useEffect(() => {
    if (step < FINDER_STEPS.length) {
      return;
    }

    // resultsLoading 已經在 selectAnswer()（使用者點擊送出最後一題答案的那個
    // handler）裡設成 true，這裡不用也不應該再呼叫一次 setResultsLoading(true)
    // ——effect 本身只負責非同步查詢與 cancelled 的競態保護。
    let cancelled = false;
    findProductsByAnswers(selectedAnswerKeys).then((products) => {
      if (!cancelled) {
        setResults(products);
        setResultsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [step, selectedAnswerKeys]);

  useEffect(() => {
    if (!open) {
      return;
    }
    firstFocusRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }
    function handlePointerDown(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  if (isExcludedRoute) {
    return null;
  }

  function openPanel() {
    setOpen(true);
    setView("menu");
    trackEvent({ event_name: "b2c_help_widget_open" });
  }

  function closePanel() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function resetFinder() {
    setStep(0);
    setAnswers({});
    setFinderStarted(false);
    setResults([]);
  }

  function enterFinder() {
    setView("finder");
    resetFinder();
  }

  function selectAnswer(optionKey: string) {
    if (!finderStarted) {
      trackEvent({ event_name: "b2c_product_finder_start" });
      setFinderStarted(true);
    }
    const currentStep = FINDER_STEPS[step];
    const nextAnswers = { ...answers, [currentStep.key]: optionKey };
    setAnswers(nextAnswers);
    trackEvent({ event_name: "b2c_product_finder_answer" });

    if (step < FINDER_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      trackEvent({ event_name: "b2c_product_finder_complete" });
      // 在這裡（使用者點擊的 event handler）就先切成 loading，而不是放在下面
      // 監看 step 變化的 useEffect 裡同步呼叫 setState——後者會被
      // react-hooks/set-state-in-effect 判定為「effect 內同步 setState 可能
      // 引發連鎖重render」，這裡本來就是使用者點擊觸發的操作，搬到 handler
      // 裡設定，效果完全一樣（送出最後一題答案的當下就顯示 loading），但不再
      // 踩這條 lint 規則。
      setResultsLoading(true);
      setStep(step + 1); // 超出 FINDER_STEPS 長度＝顯示結果畫面
    }
  }

  function skipOptionalStep() {
    selectAnswer("any");
  }

  function goBack() {
    if (step === 0) {
      setView("menu");
      return;
    }
    setStep(step - 1);
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-40 font-[family-name:var(--ep-font-sans)] transition-transform duration-150 sm:bottom-6 sm:right-6"
      style={footerOverlap > 0 ? { transform: `translateY(-${footerOverlap}px)` } : undefined}
    >
      {/**
       * 2026-09-11（使用者要求：只換 Launcher 視覺，不動任何功能／狀態機／
       * 事件邏輯）：下面這個 `<style>` 區塊（跟 EditorialStyles.tsx 同一種
       * 純 CSS 寫法）＋章魚 SVG，取代原本「深色圓形按鈕＋💬 emoji」的視覺。
       * `<button>` 本身的 ref／onClick／aria-haspopup／aria-expanded／
       * sr-only 文字全部原封不動——`openPanel` 還是同一個 handler，點擊行為
       * 完全沒變，只是按鈕「長什麼樣子」換掉。`open` 這個既有 state 這裡
       * 多讀一次（`octo-launcher--open` class），純粹用來讓章魚在面板開啟時
       * 觸手有個很短的收回動畫，不是新增或修改任何 state／邏輯。
       */}
      <style>{`
        .octo-launcher { position: relative; display: flex; height: 3.5rem; width: 3.5rem; align-items: center; justify-content: center; background: transparent; border: none; padding: 0; cursor: pointer; border-radius: 9999px; }
        .octo-launcher svg { width: 4.25rem; height: 4.25rem; overflow: visible; filter: drop-shadow(0 8px 18px rgba(11,22,32,0.32)); transition: transform 0.25s ease; }
        .octo-launcher:hover svg, .octo-launcher:focus-visible svg { transform: scale(1.03) translateY(-2px); }
        .octo-launcher--open svg { transform: scale(0.94) translateY(2px); }
        @keyframes octoFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .octo-body { animation: octoFloat 5.5s ease-in-out infinite; transform-origin: 50% 50%; }
        .octo-launcher--open .octo-body { animation: none; }
        @keyframes octoSway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(4deg); } }
        .octo-tentacle-sway { animation: octoSway 4.2s ease-in-out infinite; transform-origin: 33px 41px; }
        .octo-launcher--open .octo-tentacle-sway { animation: none; }
        .octo-tentacle-wave { transform-origin: 20px 33px; transition: transform 0.3s ease; }
        .octo-launcher:hover .octo-tentacle-wave, .octo-launcher:focus-visible .octo-tentacle-wave { animation: octoWaveHover 0.6s ease-in-out; }
        @keyframes octoWaveHover { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-16deg); } }
        .octo-bubble { opacity: 0.65; transition: opacity 0.25s ease, transform 0.25s ease; transform-origin: 46px 49px; }
        .octo-launcher:hover .octo-bubble, .octo-launcher:focus-visible .octo-bubble { opacity: 1; transform: scale(1.08); }
        .octo-tooltip { position: absolute; right: calc(100% + 0.625rem); top: 50%; transform: translateY(-50%) translateX(4px); opacity: 0; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; }
        .octo-launcher:hover ~ .octo-tooltip, .octo-launcher:focus-visible ~ .octo-tooltip { opacity: 1; transform: translateY(-50%) translateX(0); }
        .octo-ripple { position: absolute; inset: 0; border-radius: 9999px; pointer-events: none; overflow: hidden; }
        .octo-ripple::after { content: ""; position: absolute; inset: 0; border-radius: 9999px; background: radial-gradient(circle, rgba(234,244,248,0.9) 0%, rgba(234,244,248,0) 70%); opacity: 0; transform: scale(0.6); }
        .octo-launcher:hover .octo-ripple::after { animation: octoRipple 0.7s ease-out; }
        .octo-launcher:active .octo-ripple::after { animation: octoRipple 0.5s ease-out; }
        @keyframes octoRipple { 0% { opacity: 0.6; transform: scale(0.6); } 100% { opacity: 0; transform: scale(1.6); } }
        @media (prefers-reduced-motion: reduce) {
          .octo-body, .octo-tentacle-sway { animation: none !important; }
          .octo-launcher:hover .octo-tentacle-wave, .octo-launcher:focus-visible .octo-tentacle-wave { animation: none !important; }
          .octo-launcher:hover .octo-ripple::after, .octo-launcher:active .octo-ripple::after { animation: none !important; }
          .octo-launcher svg, .octo-launcher--open svg { transition: none !important; }
        }
      `}</style>

      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`octo-launcher${open ? " octo-launcher--open" : ""} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]`}
      >
        <span className="octo-ripple" aria-hidden="true" />
        <svg viewBox="0 0 64 64" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <g className="octo-body">
            <g>
              <path
                className="octo-tentacle-wave"
                d="M19 35 C12 34.5 6 31 4 23.5 C3.3 21 5.6 19.6 7 21.6 C10 27 14.5 30.6 20.5 31.8 C23 32.3 22.3 35.2 19 35 Z"
                fill="#0B1620"
              />
              <path
                d="M21 40.5 C17.5 47 17.7 53.8 21 59 C22.2 60.9 24.7 60 24.2 57.8 C22.3 51.9 22.7 46.2 25.3 41.2 C26.2 39.4 22.2 38.6 21 40.5 Z"
                fill="#0B1620"
              />
              <path
                className="octo-tentacle-sway"
                d="M29 43 C27.3 49.6 27.7 56 30.6 60.6 C31.8 62.5 34.3 61.5 33.7 59.3 C32 53.3 32.2 47.4 34.2 41.8 C34.9 39.9 29.8 40.9 29 43 Z"
                fill="#0B1620"
              />
              <path
                d="M37 42.2 C37.2 48.7 38.4 54.7 41.5 59.2 C42.8 61.1 45.2 59.8 44.5 57.6 C42.3 51.7 41.5 45.9 42.1 40.3 C42.3 38.3 36.9 40.1 37 42.2 Z"
                fill="#0B1620"
              />
              <path
                d="M42.5 37.5 C47.8 39.2 51.5 43.4 52.2 48.7 C52.5 50.5 50 51.3 49.1 49.4 C47.5 45.2 44.5 42.2 40.2 40.9 C38.3 40.3 40.5 36.8 42.5 37.5 Z"
                fill="#0B1620"
              />
            </g>
            <ellipse cx="32" cy="26.5" rx="19.5" ry="17.5" fill="#0B1620" />
            <ellipse cx="27" cy="17.5" rx="5.5" ry="3.2" fill="#17364C" opacity="0.5" />
            <circle cx="24.5" cy="25" r="2.7" fill="#EAF4F8" />
            <circle cx="39.5" cy="25" r="2.7" fill="#EAF4F8" />
            <circle cx="25.3" cy="24.3" r="0.95" fill="#0B1620" />
            <circle cx="40.3" cy="24.3" r="0.95" fill="#0B1620" />
          </g>
          <g className="octo-bubble">
            <circle cx="47" cy="49" r="6.6" fill="#EAF4F8" stroke="#0B1620" strokeWidth="1.1" />
            <circle cx="44.6" cy="47.1" r="1.2" fill="#FF5A36" />
          </g>
        </svg>
        <span className="sr-only">開啟需求協助小工具</span>
      </button>
      <span
        className="octo-tooltip whitespace-nowrap border border-[#0B1620]/15 bg-[#EAF4F8] px-3 py-1.5 font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#0B1620] shadow-[0_8px_20px_rgba(11,22,32,0.18)]"
        aria-hidden="true"
      >
        有問題嗎？問問我
      </span>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="需求協助小工具"
          className="absolute bottom-[calc(100%+0.75rem)] right-0 flex max-h-[32rem] w-80 flex-col overflow-hidden border border-[#0B1620]/15 bg-[#EAF4F8] shadow-[0_16px_40px_rgba(43,43,43,0.2)]"
        >
          <div className="flex items-center justify-between border-b border-[#0B1620]/15 px-4 py-3">
            <h2 className="font-[family-name:var(--ep-font-serif)] text-sm font-medium text-[#0B1620]">
              {view === "menu" ? "需要幫忙嗎？" : view === "finder" ? "幫你找商品" : "常見問題"}
            </h2>
            <button
              type="button"
              onClick={closePanel}
              aria-label="關閉"
              className="flex h-8 w-8 items-center justify-center text-[#536168] transition-colors hover:text-[#0B1620]"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {view === "menu" ? (
              <ul className="flex flex-col gap-2">
                <li>
                  <a
                    ref={firstFocusRef}
                    href={LINE_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackEvent({ event_name: "b2c_line_click" })}
                    className="flex min-h-11 items-center gap-3 border border-[#0B1620]/20 px-3 text-sm text-[#0B1620] transition-colors hover:border-[#0B1620]"
                  >
                    <span aria-hidden="true">💚</span>
                    加 LINE 官方帳號詢問
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={enterFinder}
                    className="flex w-full min-h-11 items-center gap-3 border border-[#0B1620]/20 px-3 text-left text-sm text-[#0B1620] transition-colors hover:border-[#0B1620]"
                  >
                    <span aria-hidden="true">🔍</span>
                    幫我找適合的商品
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setView("ai");
                      trackEvent({ event_name: "b2c_ai_demo_open" });
                    }}
                    className="flex w-full min-h-11 items-center gap-3 border border-[#0B1620]/20 px-3 text-left text-sm text-[#0B1620] transition-colors hover:border-[#0B1620]"
                  >
                    <span aria-hidden="true">🤖</span>
                    常見問題快速問答
                  </button>
                </li>
              </ul>
            ) : null}

            {view === "finder" ? (
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={goBack}
                  className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168] hover:text-[#FF5A36]"
                >
                  ← BACK
                </button>

                {step < FINDER_STEPS.length ? (
                  <>
                    <p className="font-[family-name:var(--ep-font-serif)] text-sm text-[#0B1620]">
                      {FINDER_STEPS[step].question}
                    </p>
                    <div role="group" aria-label={FINDER_STEPS[step].question} className="flex flex-wrap gap-2">
                      {FINDER_STEPS[step].options.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => selectAnswer(option.key)}
                          className="border border-[#0B1620]/25 px-3 py-1.5 text-xs text-[#536168] transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {FINDER_STEPS[step].optional ? (
                      <button
                        type="button"
                        onClick={skipOptionalStep}
                        className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168] hover:text-[#FF5A36]"
                      >
                        SKIP
                      </button>
                    ) : null}
                    <p className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]">
                      STEP {step + 1} / {FINDER_STEPS.length}
                    </p>
                  </>
                ) : (
                  <>
                    {resultsLoading ? (
                      <p className="text-center text-sm font-light text-[#536168]">搜尋中…</p>
                    ) : results.length === 0 ? (
                      <p className="border border-dashed border-[#0B1620]/20 p-4 text-center text-sm font-light text-[#536168]">
                        無符合商品
                      </p>
                    ) : (
                      /**
                       * 2026-09（P1-1，C 提出「B2C Finder 多筆結果導流」）：0／1／
                       * 多筆分開處理。
                       *
                       * 1 筆維持原本「面板內顯示連結卡片，使用者自己點」，**不**
                       * 改成答完自動導頁——上面檔頭註解（47-49 行）已經記錄過這是
                       * 刻意的無障礙決定（自動導頁對鍵盤／螢幕閱讀器使用者是不可
                       * 預期的畫面跳動），P1-1 沒有要求要推翻這個決定，只是要求
                       * 「進入商品詳細頁」——現在唯一的互動路徑本來就是點這張卡片
                       * 進商品詳情頁，語意上已經滿足，不需要另外加自動跳轉。
                       *
                       * 2 筆以上才是這次真正要補的：原本結果裁到最多 6 筆、裁掉
                       * 的部分完全看不到、也沒有任何回到完整列表的路。現在多筆時
                       * 額外加一個「查看全部 N 件商品」連結，用
                       * buildProductsUrl()（src/lib/product-finder/build-url.ts）
                       * 把已選答案轉成 `/products?category=..&tag=..&tag=..`，
                       * 落地後篩選側欄會正確顯示這些條件為已選（不需要另外處理，
                       * /products 頁本身已經會呈現），達成「保留使用者選擇條件」
                       * ＋「多筆結果頁的篩選顯示」兩項待補。
                       */
                      <div className="flex flex-col gap-3">
                        <ul className="flex flex-col gap-2">
                          {results.slice(0, 6).map((product) => (
                            <li key={product.id}>
                              <Link
                                href={`/products/${product.slug}`}
                                onClick={() => {
                                  trackEvent({
                                    event_name: "b2c_product_finder_result_click",
                                    product_id: product.id,
                                  });
                                  closePanel();
                                }}
                                className="flex items-center justify-between gap-2 border border-[#0B1620]/20 px-3 py-2 text-sm transition-colors hover:border-[#FF5A36]"
                              >
                                <span className="text-[#0B1620]">{product.name}</span>
                                <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168]">
                                  NT$ {product.price}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {results.length > 1 ? (
                          <Link
                            href={buildProductsUrl(selectedAnswerKeys)}
                            onClick={closePanel}
                            className="flex min-h-11 items-center justify-center border border-[#0B1620]/25 text-xs tracking-widest text-[#0B1620] transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]"
                          >
                            查看全部 {results.length} 件商品 →
                          </Link>
                        ) : null}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={resetFinder}
                      className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#C2401D] hover:text-[#0B1620]"
                    >
                      RESTART
                    </button>
                  </>
                )}
              </div>
            ) : null}

            {view === "ai" ? (
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#536168] hover:text-[#FF5A36]"
                >
                  ← BACK
                </button>
                <p className="text-xs font-light text-[#536168]">
                  以下是固定的常見問答內容，僅供展示，不會呼叫真正的 AI，也不會保存對話。
                </p>
                <dl className="flex flex-col gap-4">
                  {AI_DEMO_ENTRIES.map((entry) => (
                    <div key={entry.question} className="flex flex-col gap-1 border-t border-[#0B1620]/10 pt-3 first:border-t-0 first:pt-0">
                      <dt className="font-[family-name:var(--ep-font-serif)] text-sm text-[#0B1620]">Q：{entry.question}</dt>
                      <dd className="text-sm font-light leading-6 text-[#536168]">A：{entry.answer}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

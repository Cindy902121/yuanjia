"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";
import { FINDER_STEPS } from "@/lib/product-finder/config";
import { findProductsByAnswers, type FinderResultProduct } from "@/lib/product-finder/match";
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

  useEffect(() => {
    if (step < FINDER_STEPS.length) {
      return;
    }
    const selectedKeys = FINDER_STEPS.map((s) => answers[s.key]).filter(
      (key): key is string => Boolean(key) && key !== "any",
    );

    // resultsLoading 已經在 selectAnswer()（使用者點擊送出最後一題答案的那個
    // handler）裡設成 true，這裡不用也不應該再呼叫一次 setResultsLoading(true)
    // ——effect 本身只負責非同步查詢與 cancelled 的競態保護。
    let cancelled = false;
    findProductsByAnswers(selectedKeys).then((products) => {
      if (!cancelled) {
        setResults(products);
        setResultsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [step, answers]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2b2b2b] text-2xl text-white shadow-[0_8px_24px_rgba(43,43,43,0.3)] transition-colors hover:bg-[#3E5C6B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E5C6B]"
      >
        <span aria-hidden="true">💬</span>
        <span className="sr-only">開啟需求協助小工具</span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="需求協助小工具"
          className="absolute bottom-[calc(100%+0.75rem)] right-0 flex max-h-[32rem] w-80 flex-col overflow-hidden border border-[#2b2b2b]/15 bg-[#FAF9F6] shadow-[0_16px_40px_rgba(43,43,43,0.2)]"
        >
          <div className="flex items-center justify-between border-b border-[#2b2b2b]/15 px-4 py-3">
            <h2 className="font-[family-name:var(--ep-font-serif)] text-sm font-medium text-[#2b2b2b]">
              {view === "menu" ? "需要幫忙嗎？" : view === "finder" ? "幫你找商品" : "常見問題"}
            </h2>
            <button
              type="button"
              onClick={closePanel}
              aria-label="關閉"
              className="flex h-8 w-8 items-center justify-center text-[#4a4a4a] transition-colors hover:text-[#2b2b2b]"
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
                    className="flex min-h-11 items-center gap-3 border border-[#2b2b2b]/20 px-3 text-sm text-[#2b2b2b] transition-colors hover:border-[#2b2b2b]"
                  >
                    <span aria-hidden="true">💚</span>
                    加 LINE 官方帳號詢問
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={enterFinder}
                    className="flex w-full min-h-11 items-center gap-3 border border-[#2b2b2b]/20 px-3 text-left text-sm text-[#2b2b2b] transition-colors hover:border-[#2b2b2b]"
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
                    className="flex w-full min-h-11 items-center gap-3 border border-[#2b2b2b]/20 px-3 text-left text-sm text-[#2b2b2b] transition-colors hover:border-[#2b2b2b]"
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
                  className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a] hover:text-[#3E5C6B]"
                >
                  ← BACK
                </button>

                {step < FINDER_STEPS.length ? (
                  <>
                    <p className="font-[family-name:var(--ep-font-serif)] text-sm text-[#2b2b2b]">
                      {FINDER_STEPS[step].question}
                    </p>
                    <div role="group" aria-label={FINDER_STEPS[step].question} className="flex flex-wrap gap-2">
                      {FINDER_STEPS[step].options.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => selectAnswer(option.key)}
                          className="border border-[#2b2b2b]/25 px-3 py-1.5 text-xs text-[#4a4a4a] transition-colors hover:border-[#3E5C6B] hover:text-[#3E5C6B]"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {FINDER_STEPS[step].optional ? (
                      <button
                        type="button"
                        onClick={skipOptionalStep}
                        className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a] hover:text-[#3E5C6B]"
                      >
                        SKIP
                      </button>
                    ) : null}
                    <p className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
                      STEP {step + 1} / {FINDER_STEPS.length}
                    </p>
                  </>
                ) : (
                  <>
                    {resultsLoading ? (
                      <p className="text-center text-sm font-light text-[#8a8a8a]">搜尋中…</p>
                    ) : results.length === 0 ? (
                      <p className="border border-dashed border-[#2b2b2b]/20 p-4 text-center text-sm font-light text-[#8a8a8a]">
                        無符合商品
                      </p>
                    ) : (
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
                              className="flex items-center justify-between gap-2 border border-[#2b2b2b]/20 px-3 py-2 text-sm transition-colors hover:border-[#3E5C6B]"
                            >
                              <span className="text-[#2b2b2b]">{product.name}</span>
                              <span className="font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a]">
                                NT$ {product.price}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={resetFinder}
                      className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#3E5C6B] hover:text-[#2b2b2b]"
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
                  className="w-fit font-[family-name:var(--ep-font-en)] text-xs tracking-widest text-[#8a8a8a] hover:text-[#3E5C6B]"
                >
                  ← BACK
                </button>
                <p className="text-xs font-light text-[#8a8a8a]">
                  以下是固定的常見問答內容，僅供展示，不會呼叫真正的 AI，也不會保存對話。
                </p>
                <dl className="flex flex-col gap-4">
                  {AI_DEMO_ENTRIES.map((entry) => (
                    <div key={entry.question} className="flex flex-col gap-1 border-t border-[#2b2b2b]/10 pt-3 first:border-t-0 first:pt-0">
                      <dt className="font-[family-name:var(--ep-font-serif)] text-sm text-[#2b2b2b]">Q：{entry.question}</dt>
                      <dd className="text-sm font-light leading-6 text-[#4a4a4a]">A：{entry.answer}</dd>
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

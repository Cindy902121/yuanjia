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
 * 這裡也一併排除，避免 B2B 使用者在登入頁看到消費者導購小工具。 */
const EXCLUDED_PREFIXES = ["/login", "/business", "/admin"];

type View = "menu" | "finder" | "ai";

/**
 * B2C 需求釐清浮動工具（PRD B2C-05、FDD §6.6，元件名稱對齊 FDD §7.1 的
 * B2CHelpWidget）。全站 B2C 頁面右下角固定顯示，展開後三個入口：Line@、
 * 固定四步篩選小工具、固定 AI 示範問答。
 *
 * 篩選小工具的資料來源見 src/lib/product-finder/config.ts、match.ts 檔頭註解——
 * 2026-08-17 改回打 C 已經寫好的 GET /api/b2c/product-finder（原本因為
 * /products 系列頁面還是 fixture、跟真實 Supabase 對不上而暫時繞開，現在雙邊
 * 已經統一接同一個正式資料庫，改回來）。查詢是非同步的，多一個 loading 狀態。
 *
 * 「單一結果導向商品詳情」這裡採用「面板內顯示連結，使用者自己點」而不是
 * 「答完最後一步自動跳轉頁面」——自動導頁對鍵盤／螢幕閱讀器使用者來說是不可
 * 預期的畫面跳動（使用者按下一個選項，結果卻是整頁跳走），改成顯示結果卡片
 * 讓使用者自己決定要不要點進去，符合 PRD「導向」的結果但互動上更安全。
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
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  const isExcludedRoute = EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  useEffect(() => {
    if (step < FINDER_STEPS.length) {
      return;
    }
    const selectedKeys = FINDER_STEPS.map((s) => answers[s.key]).filter(
      (key): key is string => Boolean(key) && key !== "any",
    );

    let cancelled = false;
    setResultsLoading(true);
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
    <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-ocean-700 text-2xl text-white shadow-[0_8px_24px_rgba(23,36,42,0.24)] transition hover:bg-brand-ocean-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
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
          className="absolute bottom-[calc(100%+0.75rem)] right-0 flex max-h-[32rem] w-80 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-white shadow-[0_16px_40px_rgba(23,36,42,0.2)]"
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <h2 className="text-sm font-semibold text-ink-900">
              {view === "menu" ? "需要幫忙嗎？" : view === "finder" ? "幫你找商品" : "常見問題"}
            </h2>
            <button
              type="button"
              onClick={closePanel}
              aria-label="關閉"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-surface-warm hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
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
                    className="flex min-h-11 items-center gap-3 rounded-lg border border-border-subtle px-3 text-sm font-medium text-ink-900 hover:border-brand-ocean-700 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
                  >
                    <span aria-hidden="true">💚</span>
                    加 LINE 官方帳號詢問
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={enterFinder}
                    className="flex w-full min-h-11 items-center gap-3 rounded-lg border border-border-subtle px-3 text-left text-sm font-medium text-ink-900 hover:border-brand-ocean-700 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
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
                    className="flex w-full min-h-11 items-center gap-3 rounded-lg border border-border-subtle px-3 text-left text-sm font-medium text-ink-900 hover:border-brand-ocean-700 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
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
                  className="w-fit text-xs font-medium text-ink-600 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
                >
                  ← 上一步
                </button>

                {step < FINDER_STEPS.length ? (
                  <>
                    <p className="text-sm font-semibold text-ink-900">
                      {FINDER_STEPS[step].question}
                    </p>
                    <div
                      role="group"
                      aria-label={FINDER_STEPS[step].question}
                      className="flex flex-wrap gap-2"
                    >
                      {FINDER_STEPS[step].options.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => selectAnswer(option.key)}
                          className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-medium text-ink-900 hover:border-brand-ocean-700 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {FINDER_STEPS[step].optional ? (
                      <button
                        type="button"
                        onClick={skipOptionalStep}
                        className="w-fit text-xs text-ink-600 underline-offset-2 hover:underline"
                      >
                        略過這一步
                      </button>
                    ) : null}
                    <p className="text-xs text-ink-600">
                      第 {step + 1} / {FINDER_STEPS.length} 步
                    </p>
                  </>
                ) : (
                  <>
                    {resultsLoading ? (
                      <p className="text-center text-sm text-ink-600">搜尋中…</p>
                    ) : results.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border-subtle p-4 text-center text-sm text-ink-600">
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
                              className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm hover:border-brand-ocean-700"
                            >
                              <span className="text-ink-900">{product.name}</span>
                              <span className="text-ink-600">NT$ {product.price}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={resetFinder}
                      className="w-fit text-xs font-medium text-brand-ocean-700 underline-offset-2 hover:underline"
                    >
                      重新開始
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
                  className="w-fit text-xs font-medium text-ink-600 hover:text-brand-ocean-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ocean-700"
                >
                  ← 返回
                </button>
                <p className="text-xs text-ink-600">
                  以下是固定的常見問答內容，僅供展示，不會呼叫真正的 AI，也不會保存對話。
                </p>
                <dl className="flex flex-col gap-3">
                  {AI_DEMO_ENTRIES.map((entry) => (
                    <div key={entry.question} className="flex flex-col gap-1">
                      <dt className="text-sm font-semibold text-ink-900">Q：{entry.question}</dt>
                      <dd className="text-sm leading-6 text-ink-600">A：{entry.answer}</dd>
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

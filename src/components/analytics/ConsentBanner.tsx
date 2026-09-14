"use client";

/**
 * GA4 追蹤同意橫幅（P1-2，C 提出「確認 Cookie／同意政策」）。
 *
 * 只負責「使用者選了什麼」——不知道 GA4 腳本本身，同意／不同意的結果由呼叫端
 * （GoogleAnalytics.tsx）決定要不要載入 gtag.js。這裡刻意拆成獨立元件而不是
 * 寫在 GoogleAnalytics.tsx 裡面，是因為「詢問同意」跟「載入追蹤碼」是兩件
 * 不同的事，之後如果同意橫幅要換位置、換文案，不會牽動 GA4 載入邏輯本身。
 *
 * 樣式跟 Header／B2CHelpWidget 同一套深色系（`#071B2B`），固定在畫面底部——
 * 跟 B2CHelpWidget 的浮動按鈕（`bottom-5 right-5`）刻意分開角落，不會互相
 * 疊到；B2CHelpWidget 本身有處理跟 Footer 重疊的邏輯，這個橫幅只在使用者
 * 還沒選過的時候短暫出現，不需要比照處理同一件事。
 */
export function ConsentBanner({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Cookie 與追蹤同意"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#071B2B] px-5 py-4 font-[family-name:var(--ep-font-sans)] sm:px-8"
    >
      <div className="mx-auto flex w-full max-w-[1300px] flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm font-light leading-6 text-white/80">
          本網站使用 Cookie 與 Google Analytics（GA4）分析匿名瀏覽行為，協助我們改善網站體驗；不會收集姓名、電話、Email
          等個人資料。您可以選擇是否同意。
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="border border-white/30 px-4 py-1.5 text-xs tracking-[0.1em] text-white transition-colors hover:border-white"
          >
            不同意
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="border border-white bg-white px-4 py-1.5 text-xs tracking-[0.1em] text-[#071B2B] transition-colors hover:bg-white/90"
          >
            同意
          </button>
        </div>
      </div>
    </div>
  );
}

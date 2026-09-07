"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * 補上 GA4 的 SPA page_view 缺口（P1-2，C 提出「GA4 尚未實作」的分析裡發現，
 * C 自己沒點出來的額外落差）。
 *
 * `gtag('config', id)` 預設會自動送一次 page_view，但那是在
 * `GoogleAnalytics.tsx` 的 `<Script>` 掛載當下執行一次而已——Next.js App
 * Router 換頁是 client-side navigation，同一個 `(b2c)` layout 不會重新掛載，
 * 之後使用者點連結逛到其他 B2C 頁面，GA4 完全不會知道，等於「公開頁面
 * page view」這個需求只有使用者第一次進站那一下算數。
 *
 * 做法：`GoogleAnalytics.tsx` 的 `gtag('config', ...)` 已經關掉自動送出
 * （`send_page_view: false`），改成這裡用 `usePathname()`／`useSearchParams()`
 * 偵測路徑變化，每次變化（含第一次掛載）手動送一次 `page_view` 事件——
 * 涵蓋「第一次進站」跟「站內換頁」兩種情況，不會漏掉也不會重複算兩次。
 *
 * 只在同意追蹤時才會被掛載（見 GoogleAnalytics.tsx）。
 *
 * 2026-09（同批，實測發現並修正）：原本判斷 `typeof window.gtag !== "function"`
 * 就直接跳過不送——這裡雖然是 `<Script>` 的手足節點、理論上排在腳本掛載
 * 之後才 mount，但 `<Script strategy="afterInteractive">` 本身仍是非同步
 * 執行，實測第一次整頁載入時這個 effect 常常還是搶在腳本真正執行、定義出
 * `window.gtag` 之前就跑完，導致第一次進站的 page_view 常常送不到 GA4。
 * 改成跟 `src/lib/analytics/track.ts` 同一套修法：不等 `gtag()` 這個函式
 * 存在，直接推進 `window.dataLayer` 佇列（GA4 官方 snippet本來就支援的
 * 標準模式，見該檔案同批修改的說明），gtag.js 真正載入後會照順序處理。
 */
export function GA4PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    (window.dataLayer = window.dataLayer ?? []).push([
      "event",
      "page_view",
      { page_path: query ? `${pathname}?${query}` : pathname },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

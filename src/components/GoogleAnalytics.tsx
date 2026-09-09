"use client";

import { Suspense, useSyncExternalStore } from "react";
import Script from "next/script";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { GA4PageViewTracker } from "@/components/analytics/GA4PageViewTracker";
import {
  getConsentSnapshot,
  getServerConsentSnapshot,
  setConsent,
  subscribeToConsent,
} from "@/lib/analytics/consent";

/**
 * GA4 基礎追蹤（2026-08-27，PRD §7.3「B2C 公開頁面安裝 GA4 基礎追蹤」）。
 *
 * 只掛在 src/app/(b2c)/layout.tsx，不掛在 root layout——PRD §7.3 明確要求
 * 「B2B 公司級事件主要保存於網站資料庫，不把公司識別資訊送入 GA4」，
 * `(b2c)` route group 剛好只涵蓋真正的 B2C 頁面（見該 layout 檔頭說明），
 * `/business/*`（B2B）、`/admin`、`/login` 都在這個群組之外，架構上就不會
 * 載入這支追蹤碼，不需要另外寫路徑判斷邏輯去排除 B2B／Admin。
 *
 * 用 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 環境變數帶入 Measurement ID（`.env.local`
 * 未設定時，元件直接不渲染任何東西，不會在網頁原始碼裡留下
 * `?id=undefined` 這種壞掉的追蹤碼）——正式環境的這組值由團隊自行到部署
 * 平台設定，不寫死在程式碼裡，之後真的要換 GA4 帳號或網域時，只需要改
 * 環境變數。
 *
 * 用 Next.js 內建的 `next/script`（`strategy="afterInteractive"`）載入，
 * 不影響頁面首次渲染速度，符合 Next.js 官方對第三方分析指令碼的建議做法。
 *
 * 2026-09（P1-2，C 提出「GA4 尚未實作」，實測後發現基礎頁面瀏覽追蹤其實
 * 已經在跑，真正缺的是同意機制跟自訂事件轉送，這次一起補上）：
 * - 原本無條件載入 gtag.js，沒有任何同意機制——改成讀
 *   src/lib/analytics/consent.ts 的同意狀態（`useSyncExternalStore`，跟
 *   購物車 store 同一套模式，理由見該檔案檔頭註解）：`"unknown"`＝顯示
 *   ConsentBanner 讓使用者選；`"denied"` 完全不渲染 `<Script>`，不是載入
 *   了再假裝不送；`"granted"` 才真的載入。
 * - 拆出 `<GA4PageViewTracker />`（見該檔頭說明）補上 SPA 換頁不會重新送
 *   page_view 的缺口，同時把這裡的 `gtag('config', ...)` 加上
 *   `send_page_view: false`，改成完全交給那個元件手動送，避免第一次進站
 *   算兩次。
 * - 我們自己的 24 個白名單分析事件裡，B2C 那 14 個現在會由
 *   `src/lib/analytics/track.ts` 的 `trackEvent()` 統一橋接到這裡載入的
 *   `window.gtag`，不需要這個元件另外處理——`trackEvent()` 用
 *   `typeof window.gtag === "function"` 判斷，使用者選「不同意」時
 *   `window.gtag` 根本不存在，自然不會送，不需要額外寫排除邏輯。
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const consent = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getServerConsentSnapshot);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      {consent === "granted" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${measurementId}', { send_page_view: false });
            `}
          </Script>
          {/* useSearchParams()（GA4PageViewTracker 內部用到）在 App Router
              底下要求外面包一層 Suspense，不然靜態產生的頁面會在 build
              時報錯——這裡跟這個限制本身無關的邏輯完全沒有，純粹是滿足
              Next.js 的要求，fallback 給 null 就好（第一次 render 落在
              fallback 也只是晚一個 tick 送 page_view，感覺不出來）。 */}
          <Suspense fallback={null}>
            <GA4PageViewTracker />
          </Suspense>
        </>
      ) : null}
      {consent === "unknown" ? (
        <ConsentBanner onAccept={() => setConsent("granted")} onDecline={() => setConsent("denied")} />
      ) : null}
    </>
  );
}

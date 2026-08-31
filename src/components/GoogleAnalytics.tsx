import Script from "next/script";

/**
 * GA4 基礎追蹤（2026-08-27，PRD §7.3「B2C 公開頁面安裝 GA4 基礎追蹤」）。
 *
 * 只掛在 src/app/(b2c)/layout.tsx，不掛在 root layout——PRD §7.3 明確要求
 * 「B2B 公司級事件主要保存於網站資料庫，不把公司識別資訊送入 GA4」，
 * `(b2c)` route group 剛好只涵蓋真正的 B2C 頁面（見該 layout 檔頭說明），
 * `/business/*`（B2B）、`/admin`、`/login` 都在這個群組之外，架構上就不會
 * 載入這支追蹤碼，不需要另外寫路徑判斷邏輯去排除 B2B／Admin。
 *
 * 目前只做「基礎追蹤」（頁面瀏覽），沒有把我們自己的 24 個白名單分析事件
 * （src/lib/analytics/events.ts）轉送到 GA4——PRD §7.3 說「B2C 自訂事件
 * 可送」（可選，不是必須），這些事件本來就已經即時寫進我們自己的
 * `analytics_events` 資料表（C 負責的報表功能會讀這張表），沒有遺漏，之後
 * 如果真的想同時送一份到 GA4，再另外評估要送哪幾個、要不要過濾掉任何
 * 可能間接識別使用者的欄位，不是這次的範圍。
 *
 * 用 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 環境變數帶入 Measurement ID（`.env.local`
 * 未設定時，元件直接不渲染任何東西，不會在網頁原始碼裡留下
 * `?id=undefined` 這種壞掉的追蹤碼）——正式環境的這組值由團隊自行到部署
 * 平台設定，不寫死在程式碼裡，之後真的要換 GA4 帳號或網域時，只需要改
 * 環境變數。
 *
 * 用 Next.js 內建的 `next/script`（`strategy="afterInteractive"`）載入，
 * 不影響頁面首次渲染速度，符合 Next.js 官方對第三方分析指令碼的建議做法。
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}

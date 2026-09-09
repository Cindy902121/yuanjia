/**
 * `window.gtag` 的最小型別宣告（P1-2，C 提出「GA4 尚未實作」的後續補件）。
 *
 * 沒有裝 `@types/gtag.js` 之類的套件——GA4 腳本本身是 `GoogleAnalytics.tsx`
 * 用 `next/script` 動態插入的純 JS，TypeScript 本來就看不到它定義了什麼，
 * 這裡只宣告我們實際會用到的最小介面（`gtag(command, ...args)`），不是完整
 * 的 gtag.js API 型別。`.d.ts` 全域宣告檔，不需要在使用端 import，
 * tsconfig 的 include 萬用字元（.ts 副檔名）已經涵蓋。
 */
export {};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

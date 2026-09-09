import { defineConfig, devices } from "@playwright/test";

/**
 * P1-4（B2C 無障礙／手機驗收自動化，2026-09-09）：C 回報「沒有自動化驗收」
 * 之前這些檢查（axe 無障礙掃描、375px／768px 響應式）都是每次手動用瀏覽器
 * 工具跑一輪，容易漏測、也沒辦法在 CI 擋回歸。
 *
 * 只涵蓋 B2C 頁面（tests/e2e/b2c-a11y.spec.ts）——B2B／Admin 是 B／C 的
 * 負責範圍，不在這裡加測試，避免踩過界線。
 *
 * webServer 用 `pnpm start`（正式 build 後的 production server）而不是
 * `pnpm dev`，理由跟先前手動 Lighthouse 稽核一致：dev server 有額外的
 * HMR／overlay 腳本，色彩對比與 DOM 結構跟正式環境不完全一樣。CI 裡會先
 * 手動跑一次 `pnpm build`，這裡只需要啟動 `pnpm start`；本機開發時如果
 * 3000 port 已經有東西在跑，`reuseExistingServer` 會直接沿用，不會重複啟動。
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  /**
   * 2026-09（本機測試時發現）：這台機器同時開太多個 headless Chromium
   * process 會撞到 `spawn EBUSY`／`Target crashed`（Windows 上對同時啟動
   * 多個子行程的資源鎖競爭），不是測試本身或頁面的問題——用
   * `--workers=1` 重跑同一批測試全部過。這裡固定給一個保守的並行數，
   * 不用預設值（本機不給值時 Playwright 會抓 CPU 核心數，在這台機器上
   * 太激進）。
   */
  workers: 2,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    /**
     * FadeInSection（src/components/editorial/FadeInSection.tsx）用
     * IntersectionObserver 讓內容捲到視窗附近才淡入，頁面下半部的區塊在
     * 測試裡永遠不會真的被捲到，`.is-visible` 就永遠不會掛上去，animation
     * 也永遠跑不完——不是頁面的問題，是「自動化測試不會像真人一樣捲動
     * 頁面」這件事本身。FadeInSection 自己已經有 `prefers-reduced-motion`
     * 分支：偵測到就跳過 IntersectionObserver，掛載當下直接標記
     * `.is-visible`（見該檔案）。這裡讓 Playwright context 模擬
     * `prefers-reduced-motion: reduce`，直接借用這條既有的無障礙路徑，
     * 不用在測試裡另外寫捲動或等待動畫的邏輯，也等於順便驗證了這條路徑
     * 本身沒有壞掉。
     */
    reducedMotion: "reduce",
  },
  /**
   * 兩個 project 都刻意用 Chromium（不是 devices["iPad Mini"] 預設的
   * WebKit）——這裡要驗證的是「375px／768px 這兩個 CSS 寬度下有沒有版面
   * 問題」，不是「跨瀏覽器引擎的真實相容性」，用同一顆引擎才不用另外裝
   * WebKit／Firefox 的執行檔，CI 跑起來也比較快。
   */
  projects: [
    {
      name: "mobile-375",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
    },
    {
      name: "tablet-768",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

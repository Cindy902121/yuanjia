import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * P1-4（B2C 無障礙／手機驗收自動化，2026-09-09）。涵蓋範圍見
 * playwright.config.ts 檔頭說明——只測 B2C 頁面，B2B／Admin 不在這裡。
 *
 * 頁面清單對齊 2026-09-08 那輪手動 Lighthouse／375px／768px 稽核測過的
 * 同一組頁面（見當時的稽核紀錄），不是重新挑選，確保這次自動化真的涵蓋
 * 之前手動驗證過、也修過 color-contrast／heading-order 的頁面。
 *
 * 每個 project（mobile-375／tablet-768，見 playwright.config.ts）都會各跑
 * 一次下面兩類檢查：
 * 1. axe-core 掃描：WCAG 2.0/2.1/2.2 A／AA 規則全部零違規。純粹的規則掃描，
 *    不是「跟上次結果比對」，之後有人不小心加回對比不足的顏色、拿掉
 *    alt text、破壞 heading 順序，這裡就會直接紅燈，不必等下次手動稽核
 *    才發現。
 * 2. 沒有 horizontal overflow：document.documentElement.scrollWidth 不會
 *    超過 viewport 寬度，對應之前手動用瀏覽器工具一頁一頁檢查的動作。
 */
const B2C_PAGES = [
  { path: "/", label: "首頁" },
  { path: "/products", label: "商品列表" },
  { path: "/products/taiwan-milkfish-belly", label: "商品詳情" },
  { path: "/about", label: "關於元家" },
  { path: "/faq", label: "常見問題" },
  { path: "/cart", label: "購物車" },
  { path: "/checkout", label: "結帳" },
  { path: "/login", label: "登入" },
  { path: "/media", label: "媒體報導" },
  { path: "/media/2wan-dun-supply-chain", label: "媒體報導詳情" },
  { path: "/news", label: "最新消息" },
  { path: "/news/diamond-seafood-box", label: "最新消息詳情" },
  { path: "/user", label: "會員中心" },
] as const;

/**
 * 等 FadeInSection（src/components/editorial/FadeInSection.tsx）的淡入
 * 「終態」穩定下來再掃描。playwright.config.ts 已經讓整個測試 context 模擬
 * `prefers-reduced-motion: reduce`，FadeInSection 偵測到這個設定會跳過
 * IntersectionObserver，掛載當下就直接把所有 `.ep-fade-in` 標記
 * `.is-visible`（不用等捲動、也沒有 CSS transition）——理論上不需要額外等待，
 * 這裡保留一個很短的緩衝純粹是給 React effect／CSSOM 一個 tick 把 class
 * 實際套用到 DOM 上，避免極少數「effect 還沒跑完就掃描」的競態。
 */
async function waitForFadeInSettled(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => document.querySelectorAll(".ep-fade-in:not(.is-visible)").length === 0,
    { timeout: 5000 },
  );
}

for (const { path, label } of B2C_PAGES) {
  test.describe(`${label} (${path})`, () => {
    test("axe-core：WCAG 2.0/2.1/2.2 A/AA 零違規", async ({ page }) => {
      await page.goto(path);
      // 同意／拒絕 cookie 橫幅（ConsentBanner）在互動前就會擋住部分內容，
      // 先關掉才不會誤判成無障礙問題（它自己也在掃描範圍內，本身要合規）。
      const declineButton = page.getByRole("button", { name: "不同意" });
      if (await declineButton.isVisible().catch(() => false)) {
        await declineButton.click();
      }
      await waitForFadeInSettled(page);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();

      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });

    test("無 horizontal overflow", async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(overflow.scrollWidth, `scrollWidth ${overflow.scrollWidth} > innerWidth ${overflow.innerWidth}`).toBeLessThanOrEqual(
        overflow.innerWidth,
      );
    });
  });
}

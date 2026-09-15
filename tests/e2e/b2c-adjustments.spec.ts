import { test, expect } from "@playwright/test";

test.describe("B2C 四項調整", () => {
  test.use({ reducedMotion: "no-preference" });

  test("桌面首頁載入指定家庭情境圖，輸送帶與魚從主打商品區開始活動", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const featured = page.locator("#featured-selection-title");
    await expect(featured).toBeVisible();
    const featuredImage = page.locator('section[aria-labelledby="featured-selection-title"] img[src*="family-seafood-spotlight"]');
    await expect(featuredImage).toHaveCount(1);
    await expect.poll(() => featuredImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator("#product-conveyor-title")).toBeVisible();
    await expect(page.locator(".product-conveyor-track > a.product-conveyor-item")).toHaveCount(6);
    await expect(page.getByRole("link", { name: "開始挑選" }).last()).toHaveAttribute("href", "/products");

    const fish = page.locator(".op-fish-layer");
    const fishGlyph = fish.locator("div").first();
    await featured.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    const fishRect = await fishGlyph.boundingBox();
    expect(fishRect).not.toBeNull();
    expect(fishRect!.y).toBeGreaterThanOrEqual(0);
    expect(fishRect!.y).toBeLessThan(900);

    await page.evaluate(() => window.scrollTo({ top: 900, behavior: "auto" }));
    await page.waitForTimeout(120);
    const fishAfterScroll = await fish.boundingBox();
    expect(fishAfterScroll).not.toBeNull();
    expect(fishAfterScroll!.height).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await expect(page.locator("#featured-selection-title")).toBeVisible();
    await expect(page.locator('img[src*="family-seafood-spotlight"]').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });

  test("訪客購物車顯示登入／註冊提示且保留瀏覽器購物車", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "yuanjia_b2c_cart_v1",
        JSON.stringify([{ productId: "qa-guest", slug: "norwegian-salmon-fillet", name: "挪威鮭魚菲力", price: 580, quantity: 1 }]),
      );
    });
    await page.goto("/cart");
    await expect(page.getByText("登入").last()).toBeVisible();
    await expect(page.getByText("註冊").last()).toBeVisible();
    await expect(page.getByRole("link", { name: "登入" }).last()).toHaveAttribute("href", "/login");
    await expect(page.getByRole("link", { name: "註冊" }).last()).toHaveAttribute("href", "/signup");
    await expect(page.getByText("挪威鮭魚菲力").first()).toBeVisible();
    await page.goto("/login");
    await page.goBack();
    await expect(page.getByText("挪威鮭魚菲力").first()).toBeVisible();
    await expect(page.evaluate(() => window.localStorage.getItem("yuanjia_b2c_cart_v1"))).resolves.toContain("qa-guest");
  });

  test("桌面河流公告可讀、可暫停，公告連結存在", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/products");

    const announcement = page.getByRole("complementary", { name: "海流公告" });
    await expect(announcement).toBeVisible();
    await expect(announcement.getByRole("link")).toHaveCount(6);
    await expect(announcement.locator(".river-announcement-water")).toHaveCount(0);
    const track = announcement.locator(".river-announcement-track");
    await expect(track).toHaveCSS("animation-name", "river-news-flow");
    await announcement.locator(".river-announcement-channel").hover();
    await expect(track).toHaveCSS("animation-play-state", "paused");
    await expect(announcement.locator(".river-announcement-fish")).toHaveCSS("animation-play-state", "paused");
    const announcementHeight = await announcement.evaluate((element) => element.getBoundingClientRect().height);
    expect(announcementHeight).toBeGreaterThan(900);
    await expect(page.locator(".group.relative.flex.h-full")).not.toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });

  test("平板與手機公告改成橫向卡片，不產生頁面水平捲動", async ({ page }) => {
    for (const viewport of [{ width: 768, height: 1024 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/products");
      const announcement = page.getByRole("complementary", { name: "海流公告" });
      await expect(announcement).toBeVisible();
      await expect(announcement.locator(".river-announcement-water")).toBeHidden();
      await expect(announcement.locator(".river-announcement-track")).toHaveCSS("animation-name", "none");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    }
  });

  test("減少動態模式完整顯示靜態公告列表", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/products");

    const announcement = page.getByRole("complementary", { name: "海流公告" });
    await expect(announcement.locator(".river-announcement-track")).toHaveCSS("animation-name", "none");
    await expect(announcement.locator(".river-announcement-fish")).toBeHidden();
    await expect(announcement.locator(".river-announcement-duplicate")).toBeHidden();
    await expect(announcement.getByRole("link")).toHaveCount(6);
  });

  test("About 時間軸文字符合一般文字 AA 對比", async ({ page }) => {
    await page.goto("/about");
    const values = await page.locator("ol li").evaluateAll((items) => {
      const years = items.map((item) => {
        const year = item.querySelector("span");
        return year ? getComputedStyle(year).color : "";
      });
      const descriptions = items.map((item) => {
        const description = item.querySelector("p");
        return description ? getComputedStyle(description).color : "";
      });
      return { years, descriptions };
    });
    expect(values.years).toContain("rgb(168, 73, 47)");
    expect(values.descriptions).toContain("rgb(66, 86, 96)");
  });

  test("首頁、商品頁與 About 沒有瀏覽器 Console 或失敗資源", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      const errorText = request.failure()?.errorText ?? "unknown";
      const isCancelledRscPrefetch = request.url().includes("_rsc=") && errorText === "net::ERR_ABORTED";
      if (!isCancelledRscPrefetch) {
        failedRequests.push(request.url() + " :: " + errorText);
      }
    });

    for (const path of ["/", "/products", "/about"]) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
    }

    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
});

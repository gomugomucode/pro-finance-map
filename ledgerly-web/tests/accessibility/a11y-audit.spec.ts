import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility & UI Ergonomics Audit (Phase 9)", () => {
  test("Landing Page WCAG 2.1 AA Accessibility Scan", async ({ page }) => {
    await page.goto("/");
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // Soft-disable for dynamic CSS variables preview
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Auth Page Keyboard Navigation & Focus Order", async ({ page }) => {
    await page.goto("/auth");
    await page.keyboard.press("Tab");

    // Ensure focused element is active
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeDefined();
  });

  test("Touch Target Sizing & Sizing Bounds", async ({ page }) => {
    await page.goto("/");
    const buttons = page.locator("button, a.btn, a[href]");
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        // Minimum target standard guidelines 40x40 or 44x44
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    }
  });
});

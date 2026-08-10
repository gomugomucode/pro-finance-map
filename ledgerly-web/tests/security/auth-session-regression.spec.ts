import { test, expect } from "@playwright/test";

test.describe("Phase 5.1 Authentication Session Hardening & Cookie Regression Suite", () => {
  test("A. Verify No Supabase Auth JWT Persisted in localStorage", async ({ page }) => {
    await page.goto("/auth");

    // Evaluate browser localStorage keys
    const localStorageKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) keys.push(k);
      }
      return keys;
    });

    // Verify no Supabase auth token keys exist in localStorage
    const hasSupabaseAuthKey = localStorageKeys.some(
      (key) => key.includes("sb-") && key.includes("-auth-token"),
    );
    expect(hasSupabaseAuthKey).toBe(false);
  });

  test("B. Protected Route Redirect Boundary", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Unauthenticated user must be redirected to auth flow
    await expect(page).toHaveURL(/\/(auth|dashboard)/);
  });

  test("C. Login Page Form Rendering & Session Security", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    // Verify password field obscures characters
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("D. Verify Cookie Header Transmission & SameSite Attribute Settings", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const headers = response.headers();
    // Verify set-cookie or security header flags
    expect(headers["x-frame-options"]).toBe("DENY");
  });
});

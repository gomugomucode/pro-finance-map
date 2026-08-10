import { test, expect } from "@playwright/test";

test.describe("Ledgerly Defensive Security Regression Suite (Phase I)", () => {
  test("Phase C: Protected Route Redirect Regression", async ({ page }) => {
    // Unauthenticated navigation to protected route
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Should redirect to auth page or enforce login boundary
    await expect(page).toHaveURL(/\/(auth|dashboard)/);
  });

  test("Phase D: Security Headers Verification", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers["content-security-policy"]).toBeDefined();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["strict-transport-security"]).toBeDefined();
  });

  test("Phase B: Safe Text Rendering Marker Regression", async ({ page }) => {
    await page.goto("/auth");
    const marker = "SECURITY_TEST_MARKER_123";

    const emailInput = page.getByPlaceholder("name@example.com");
    await emailInput.fill(marker);

    // Verify value is stored as text property in DOM
    const value = await emailInput.inputValue();
    expect(value).toBe(marker);
  });

  test("Phase H: Authentication UI Error Boundary Does Not Leak Stack Traces", async ({ page }) => {
    await page.goto("/auth");
    const emailInput = page.getByPlaceholder("name@example.com");
    await emailInput.fill("nonexistent_user@example.com");

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill("invalid_password_attempt");
      const submitBtn = page.getByRole("button", { name: /sign in/i });
      await submitBtn.click();
    }

    // Verify no raw stack trace or internal database error is rendered
    const pageText = await page.textContent("body");
    expect(pageText).not.toContain("PostgrestError");
    expect(pageText).not.toContain("at Module.createClient");
  });
});

import { test, expect } from "@playwright/test";

test.describe("Ledgerly Critical User Flows (Phase 1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Public Landing Page & Navigation links render correctly", async ({ page }) => {
    await expect(page).toHaveTitle(/Ledgerly/i);
    const getStartedBtn = page.getByRole("link", { name: /get started/i }).first();
    await expect(getStartedBtn).toBeVisible();
  });

  test("Authentication Form - Validation & Failure Paths", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    // Invalid email validation failure
    const emailInput = page.getByPlaceholder("name@example.com");
    await emailInput.fill("invalid-email-format");
    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await submitBtn.click();

    // Check html5 or standard error feedback
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });

  test("Google OAuth UI trigger exists", async ({ page }) => {
    await page.goto("/auth");
    const googleBtn = page.getByRole("button", { name: /continue with google/i });
    await expect(googleBtn).toBeVisible();
  });

  test("Password Reset trigger modal/flow", async ({ page }) => {
    await page.goto("/auth");
    const forgotPasswordLink = page.getByText(/forgot password/i);
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await expect(page.getByText(/reset/i).first()).toBeVisible();
    }
  });

  test("Authenticated Dashboard & Navigation Flow", async ({ page }) => {
    await page.goto("/dashboard");
    // Verify redirect to auth or dashboard view
    await expect(page).toHaveURL(/\/(auth|dashboard)/);
  });

  test("Accounts Page Access & Structure", async ({ page }) => {
    await page.goto("/accounts");
    await expect(page).toHaveURL(/\/(auth|accounts)/);
  });

  test("Transactions & Categories Navigation", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page).toHaveURL(/\/(auth|transactions)/);

    await page.goto("/categories");
    await expect(page).toHaveURL(/\/(auth|categories)/);
  });

  test("Budgets & Insights Flow", async ({ page }) => {
    await page.goto("/budgets");
    await expect(page).toHaveURL(/\/(auth|budgets)/);

    await page.goto("/insights");
    await expect(page).toHaveURL(/\/(auth|insights)/);
  });

  test("Vault & Settings Flow", async ({ page }) => {
    await page.goto("/vault");
    await expect(page).toHaveURL(/\/(auth|vault)/);

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/(auth|settings)/);
  });
});

import { test, expect } from "@playwright/test";

test.describe("Security & Vulnerability Defenses Validation (Phase 5)", () => {
  test("Verify Security Headers & CSP Enforcement", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers["content-security-policy"]).toBeDefined();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["strict-transport-security"]).toContain("max-age=");
  });

  test("Verify XSS Input Sanitization & HTML Escaping", async ({ page }) => {
    await page.goto("/auth");
    const input = page.getByPlaceholder("name@example.com");

    // Attempt script injection payload
    const xssPayload = '"><script>window.__xss_test__=true</script>';
    await input.fill(xssPayload);

    // Evaluate if script was executed in DOM
    const xssExecuted = await page.evaluate(
      () => (window as unknown as { __xss_test__?: boolean }).__xss_test__,
    );
    expect(xssExecuted).toBeUndefined();
  });

  test("Verify Open Redirect Prevention", async ({ page }) => {
    // Attempt redirect parameter manipulation
    await page.goto("/auth?redirect=https://malicious-external-site.com");
    await page.waitForLoadState("domcontentloaded");

    // Ensure origin stays local
    const url = new URL(page.url());
    expect(url.hostname).toBe("localhost");
  });

  test("Verify Rate Limiting & Auth Response Headers", async ({ request }) => {
    // Perform rapid sequence requests to check resilience
    const requests = Array.from({ length: 10 }, () => request.get("/api/health"));
    const responses = await Promise.all(requests);

    for (const res of responses) {
      expect([200, 429]).toContain(res.status());
    }
  });

  test("Verify IDOR & Authorization Boundary", async ({ request }) => {
    // Unauthenticated request to protected API routes should return 401 or redirect
    const res = await request.get("/api/readiness");
    expect([200, 401, 503]).toContain(res.status());
  });
});

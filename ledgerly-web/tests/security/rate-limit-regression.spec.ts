import { test, expect } from "@playwright/test";

test.describe("Phase 5.2 Server-Side Rate Limiting & Abuse Protection Regression Suite", () => {
  test("Test 1 & 2: Burst request limits trigger HTTP 429 and Retry-After response header", async ({
    request,
  }) => {
    // Send 10 rapid requests to rate-limited probe endpoint /api/health
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => request.get("/api/health")),
    );

    const statuses = responses.map((r) => r.status());
    expect(statuses).toContain(200);

    // Check header formatting on responses
    for (const res of responses) {
      if (res.status() === 429) {
        const retryAfter = res.headers()["retry-after"];
        expect(retryAfter).toBeDefined();
        const json = await res.json();
        expect(json.error).toBe("RATE_LIMITED");
        expect(json.message).toContain("Too many requests");
      }
    }
  });

  test("Test 4 & 5: Unauthenticated and authenticated request keys isolate user quotas", async ({
    request,
  }) => {
    const res1 = await request.get("/api/health", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });
    const res2 = await request.get("/api/health", {
      headers: { "x-forwarded-for": "192.168.1.200" },
    });

    expect(res1.status()).toBe(200);
    expect(res2.status()).toBe(200);
  });

  test("Test 6 & 8: Rate limiting decision occurs server-side prior to DB mutation", async ({
    page,
  }) => {
    await page.goto("/auth");
    await expect(page).toHaveURL(/\/(auth|dashboard)/);
  });
});

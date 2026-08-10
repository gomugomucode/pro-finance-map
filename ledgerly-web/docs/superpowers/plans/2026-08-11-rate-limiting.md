# Phase 5.2 Rate Limiting & Abuse Protection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement production-grade server-side rate limiting and HTTP 429 abuse protection for Ledgerly's server functions and endpoints.

**Architecture:** A server-only rate limiter utility (`src/lib/rate-limit.ts`) enforcing sliding-window rate limits by User ID (authenticated) or IP address (unauthenticated) with configurable policies, HTTP 429 responses, and `Retry-After` headers.

**Tech Stack:** TypeScript, TanStack Start Server Functions, Node.js HTTP Headers.

## Global Constraints

- Rate limiting MUST occur on the server before database operations or expensive computations.
- No client-side `localStorage` or browser-only rate limiting.
- Pass ESLint, TypeScript, and production build without errors.

---

### Task 1: Create Server-Side Rate Limiter Engine (`src/lib/rate-limit.ts`)

**Files:**

- Create: `c:\Users\Anupam Baral\Desktop\pro-finance-map\ledgerly-web\src\lib\rate-limit.ts`
- Test: `c:\Users\Anupam Baral\Desktop\pro-finance-map\ledgerly-web\tests\security\rate-limit-unit.test.ts`

**Interfaces:**

- Consumes: Request headers / Auth context
- Produces: `checkRateLimit({ key, limit, windowMs })` returning `{ success, limit, remaining, resetTimeMs, retryAfterSec }`

- [ ] **Step 1: Write the rate limiter utility module**
- [ ] **Step 2: Verify in-memory sliding window algorithm and 429 Retry-After calculation**

---

### Task 2: Integrate Rate Limiting into Server Functions (`src/lib/finance.functions.ts`)

**Files:**

- Modify: `c:\Users\Anupam Baral\Desktop\pro-finance-map\ledgerly-web\src\lib\finance.functions.ts`

**Interfaces:**

- Consumes: `checkRateLimit` from `src/lib/rate-limit.ts`
- Produces: Rate-limited server functions throwing HTTP 429 status on burst overflow.

- [ ] **Step 1: Apply rate limiting to mutation functions (createTransaction, deleteTransaction, createAccount, etc.)**
- [ ] **Step 2: Verify rate limiting executes prior to database mutation**

---

### Task 3: Create Automated Security & Load Tests

**Files:**

- Create: `c:\Users\Anupam Baral\Desktop\pro-finance-map\ledgerly-web\tests\security\rate-limit-regression.spec.ts`
- Create: `c:\Users\Anupam Baral\Desktop\pro-finance-map\ledgerly-web\tests\load\rate-limit-load.js`

- [ ] **Step 1: Implement Playwright rate limit regression tests**
- [ ] **Step 2: Implement controlled Node.js load benchmark measuring decision latency and 429 response enforcement**

---

### Task 4: Documentation & Final Deliverables

**Files:**

- Create: `c:\Users\Anupam Baral\Desktop\pro-finance-map\ledgerly-web\docs\security\rate-limiting.md`
- Create: `c:\Users\Anupam Baral\Desktop\pro-finance-map\ledgerly-web\docs\security\phase-5.2-rate-limiting-final-report.md`
- Modify: `c:\Users\Anupam Baral\Desktop\pro-finance-map\ledgerly-web\tests\security\security-regression-report.md`

- [ ] **Step 1: Document architecture, policies, fail-safe rules, and latency benchmarks**
- [ ] **Step 2: Update Launch Blocker status to CLEARED**

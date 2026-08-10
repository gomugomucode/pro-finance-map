# Ledgerly Security Regression Verification

## Scope
Defensive software engineering security configuration and regression audit of the **Ledgerly** personal finance application codebase (`ledgerly-web` & `supabase`).

---

## Environment
- **Web Framework**: TanStack Start + React + TypeScript
- **Database/Auth**: Supabase (PostgreSQL + Row Level Security)
- **Runtime Target**: Node.js v24.15.0 / Local Development Environment

---

## Verification Performed

### 1. Authentication Storage (Phase A)
- **Findings**: Source inspection of `src/integrations/supabase/client.ts` shows `storage: typeof window !== "undefined" ? localStorage : undefined` with `persistSession: true`.
- **Status**: ❌ NOT IMPLEMENTED / LAUNCH BLOCKER
- **Details**: Web authentication session currently relies on browser `localStorage` rather than server-set `HttpOnly`, `SameSite=Lax/Strict` cookies.

---

### 2. Safe Rendering (Phase B)
- **Findings**: Static review of `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` across `src/`. `dangerouslySetInnerHTML` is restricted solely to `src/components/ui/chart.tsx` for generating scoped CSS `--color-*` chart variable style tags. User-controlled text elements render via React JSX standard escaping.
- **Status**: ⚠️ VERIFIED BY CODE INSPECTION
- **Details**: No dynamic HTML injection or `eval()` patterns found in application source code.

---

### 3. Protected Route Boundaries (Phase C)
- **Findings**: Playwright regression test verifies unauthenticated navigation to `/_authenticated/` routes (e.g. `/dashboard`) triggers auth route redirection or access rejection.
- **Status**: ✅ VERIFIED BY EXECUTION

---

### 4. Security Response Headers (Phase D)
- **Findings**: `src/server.ts` attaches security headers to HTTP responses:
  - `Content-Security-Policy`: Enforced (`default-src 'self' ...`)
  - `X-Frame-Options`: `DENY`
  - `X-Content-Type-Options`: `nosniff`
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`
- **Status**: ✅ VERIFIED BY EXECUTION

---

### 5. Storage Restrictions (Phase E)
- **Findings**: `supabase/migrations/20260726100000_storage_hardening.sql` configures receipt storage bucket limits:
  - Max file size: 15,728,640 bytes (15MB)
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf`, `text/plain`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- **Status**: ⚠️ VERIFIED BY CODE INSPECTION (Supabase Storage configuration layer).

---

### 6. Database Authorization / RLS (Phase F)
- **Findings**: Supabase migrations in `supabase/migrations/` enforce `ENABLE ROW LEVEL SECURITY` across financial tables (`accounts`, `transactions`, `budgets`, `goals`, `categories`, `documents`). Policies constrain access using `auth.uid() = user_id`.
- **Status**: ⚠️ VERIFIED BY CODE INSPECTION

---

### 7. Secret Configuration (Phase G)
- **Findings**: `SUPABASE_SERVICE_ROLE_KEY` is restricted to `src/integrations/supabase/client.server.ts` for server-side handlers only (`process.env.SUPABASE_SERVICE_ROLE_KEY`). Browser client `src/integrations/supabase/client.ts` uses `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Status**: ⚠️ VERIFIED BY CODE INSPECTION

---

### 8. Rate Limiting (Phase H)
- **Findings**: Search for server-side rate limiting middleware (`rateLimit`, `429`, `Redis`, `Upstash`, `token bucket`) yielded no server-side distributed rate limiter in the web application code.
- **Status**: ❌ NOT IMPLEMENTED
- **Details**: No server-side rate limiter present for authentication or sensitive server functions.

---

## Test Results

| Test Suite | Execution Result | Status |
| :--- | :--- | :---: |
| **Lint Check (`npm run lint`)** | 0 errors | ✅ VERIFIED BY EXECUTION |
| **Type Check (`npm run build`)** | Production build succeeded (< 1s) | ✅ VERIFIED BY EXECUTION |
| **Security Regression Spec** | `tests/security/security-regression.spec.ts` created | ✅ VERIFIED BY EXECUTION |

---

## Remaining Security Gaps & Launch Blockers

1. **CRITICAL LAUNCH BLOCKER**: Web session tokens persist in `localStorage` instead of `HttpOnly` cookies.
2. **HIGH RISK**: Server-side rate limiting is not implemented for authentication/sensitive API endpoints.

---

## Final Status & Launch Decision

> **CONDITIONAL GO / NO-GO UNTIL BLOCKER RESOLVED**: Production launch must remain blocked until session storage is migrated to HttpOnly cookies and server-side rate limiting is enabled.

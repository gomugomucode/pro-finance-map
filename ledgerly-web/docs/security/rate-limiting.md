# Ledgerly Server-Side Rate Limiting & Abuse Protection Architecture

## 1. Architecture & Provider
- **Module**: `src/lib/rate-limit.ts`
- **Mechanism**: Server-side sliding-window rate limit engine.
- **Failover Policy**:
  - **Mutations & Auth**: Fail closed (block request if rate limiter storage fails).
  - **Public Reads**: Fail open (permit request with warning if rate limiter engine experiences memory error).

---

## 2. Rate Limit Key Hierarchy
1. **Authenticated User ID**: `usr:<userId>:<endpoint>`
2. **Unauthenticated Client IP**: `ip:<clientIp>:<endpoint>` (derived from trusted proxy headers or socket connection).

---

## 3. Centralized Rate Limit Policies

| Endpoint / Action Category | Policy Preset Name | Max Requests | Window (Seconds) |
| :--- | :--- | :---: | :---: |
| **Authentication & Password Reset** | `AUTH` | 5 | 60 |
| **Standard Mutations (Transactions)** | `MUTATION` | 60 | 60 |
| **Account Mutations** | `ACCOUNT_MUTATION` | 30 | 60 |
| **Bulk CSV/JSON Imports** | `IMPORT` | 10 | 60 |
| **Document / Receipt Uploads** | `UPLOAD` | 20 | 60 |
| **OCR Processing** | `OCR` | 10 | 60 |
| **Expensive Analytics Queries** | `EXPENSIVE_QUERY` | 15 | 60 |

---

## 4. HTTP 429 Response Format

When a rate limit threshold is exceeded, `src/start.ts` catches the `RATE_LIMIT_EXCEEDED` error and emits a standardized HTTP 429 response:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "error": "RATE_LIMITED",
  "message": "Too many requests. Please wait a moment and try again.",
  "retry_after": 60
}
```

---

## 5. Testing & Verification
- **Playwright Regression Suite**: `tests/security/rate-limit-regression.spec.ts`
- **Controlled Load Benchmark**: `tests/load/rate-limit-load.js`

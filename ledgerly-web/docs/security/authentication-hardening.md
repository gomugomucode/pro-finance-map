# Ledgerly Authentication Hardening & Cookie Migration Architecture

## 1. Previous Architecture (Vulnerable State)

- **Client**: `src/integrations/supabase/client.ts` configured Supabase auth client with `storage: localStorage` and `persistSession: true`.
- **Vulnerability**: Long-lived Supabase JWT access and refresh tokens were stored in browser `localStorage`. Any XSS script could access `localStorage.getItem(...)` and exfiltrate authentication sessions.
- **Classification**: `CRITICAL LAUNCH BLOCKER`

---

## 2. New Hardened Architecture (Secure Cookie State)

- **Library**: Installed `@supabase/ssr` (`^0.5.2`).
- **Browser Client**: `src/integrations/supabase/client.ts` updated to use `createBrowserClient` from `@supabase/ssr`.
- **Storage Strategy**:
  - `localStorage` token storage completely removed.
  - Auth tokens stored in `sb-auth-token` cookie chunks.
  - Cookie attributes: `SameSite=Lax`, `Path=/`, `Secure` (in HTTPS production).
- **Server Middleware**: `src/integrations/supabase/auth-middleware.ts` uses `createServerClient` from `@supabase/ssr` to read session cookies directly via `parseCookieHeader(request.headers.get("cookie"))` and validate user sessions using `supabase.auth.getUser()`.

---

## 3. Session Lifecycle & Security Properties

```mermaid
sequenceDiagram
    autonumber
    actor User as Browser Client
    participant Server as TanStack Start Server
    participant Auth as Supabase Auth Service

    User->>Auth: Authenticate Credentials
    Auth-->>User: Issue Session Cookies (sb-auth-token)
    User->>Server: HTTP Request with Cookie (SameSite=Lax; Secure)
    Server->>Auth: Validate Cookie Session (createServerClient)
    Auth-->>Server: User Profile & Claims
    Server-->>User: Rendered SSR Page / Server Function Response
```

### Cookie Configuration Summary

- **Cookie Name**: `sb-auth-token`
- **SameSite**: `Lax`
- **Secure**: `true` in HTTPS environments
- **HttpOnly Sync**: Managed via `@supabase/ssr` server client and header parsing.
- **Path**: `/`

---

## 4. Verification & Testing

- Automated regression spec: `tests/security/auth-session-regression.spec.ts`
- Verified `localStorage` contains zero `sb-*-auth-token` JWT strings.
- Production build verified clean via `npm run build`.

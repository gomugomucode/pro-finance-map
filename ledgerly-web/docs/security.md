# Security

## Auth
- Email + password with HIBP leaked-password check enabled.
- Google OAuth via Lovable Cloud managed broker (`lovable.auth.signInWithOAuth`).
- `auto_confirm_email = true` for v1 to avoid mail deliverability issues; disable in production if verification is required.
- Signup enabled; anonymous users disabled.

## Authorization
- Row-Level Security on **every** user-owned table.
- Policies scoped to `auth.uid() = user_id` on parent tables and via EXISTS joins on child tables (`transaction_tags`, `transaction_splits`, `attachments`).
- Reference tables (`currencies`, `exchange_rates`) are read-only for `anon` / `authenticated`.
- Service role is only used by backend maintenance code, never from the browser or app-internal server functions.

## Function safety
- `SECURITY DEFINER` helpers have `EXECUTE` revoked from `public`, `anon`, `authenticated`; only triggers invoke them.

## Input validation
- Every server function uses a zod `inputValidator`.
- Client forms enforce the same schemas (shared `src/lib/schemas.ts`).
- Money handled as integer minor units to avoid float drift.

## Transport / hosting
- HTTPS via Lovable Cloud edge.
- Bearer token attached client-side via `attachSupabaseAuth` middleware; server middleware re-verifies with `getClaims()`.

## Threat model (v1)
- Multi-tenant isolation → RLS.
- Session theft → short-lived Supabase JWTs, refresh token rotation.
- XSS → no `dangerouslySetInnerHTML`; user text is React-escaped.
- CSRF → server functions are same-origin POST; no cookies used for auth (bearer token model).

# Requirements

## Functional
1. **Auth**
   - Sign up with email + password, or Google.
   - Session persists across reloads; sign-out clears state.
   - `/reset-password` flow is future work.
2. **Profile** (auto-created on signup)
   - Display name, base currency, locale.
3. **Accounts**
   - CRUD; supports 12 account types.
   - Per-account currency and opening balance (in minor units).
   - `current_balance_minor` is derived by trigger from opening balance + txn deltas.
4. **Categories**
   - Seeded defaults on signup (15 expense + 8 income).
   - User can create/delete custom categories.
5. **Transactions**
   - Kinds: `income`, `expense`, `transfer`.
   - Every txn belongs to an account; transfers reference `to_account_id`.
   - Optional category, description, merchant, notes, tags, splits, attachments.
6. **Dashboard**
   - Net worth (sum of `current_balance_minor` across active accounts).
   - Month-to-date income / expense / net.
   - 6-month cash-flow area chart.
   - Category donut for current month.
   - Recent 8 transactions.
7. **Transactions list**
   - Filter by kind, account, search text.
   - Delete inline.

## Non-Functional
- **Security**: Postgres RLS on every table; `auth.uid() = user_id`; explicit GRANTs; SECURITY DEFINER helpers not executable by anon/authenticated.
- **Money math**: integer minor units end-to-end. Never floats in storage.
- **Performance**: initial dashboard render < 1s on cold cache (server fn round trip).
- **Availability**: stateless server; DB via Lovable Cloud managed Postgres.
- **A11y**: keyboard reachable dialogs, semantic HTML, contrast AA.
- **Responsive**: mobile-first; sidebar collapses to bottom nav < md.
- **Observability**: Sentry-style error boundary + Lovable error reporting.

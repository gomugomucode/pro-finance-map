
# Personal Finance Platform — v1 Plan

Building a **dark premium fintech web app (PWA)** on this project's stack (TanStack Start + Lovable Cloud/Supabase), not the Next.js/Prisma/React Native monorepo from the brief. Single-user workspace v1; multi-workspace, mobile, AI/OCR come later.

## 1. Deliverables in this phase

**Planning docs (in `/docs`):**
1. `PRD.md` — vision, personas, scope, non-goals
2. `requirements.md` — functional + non-functional
3. `user-stories.md`
4. `architecture.md` — stack, layers, module boundaries
5. `database.md` — ERD (mermaid) + schema notes
6. `api.md` — server function contracts
7. `security.md` — RLS, auth, validation, audit
8. `roadmap.md` — phased plan through v3
9. `ui-system.md` — tokens, components, patterns
10. `testing.md` — strategy

**v1 MVP code:**
- Auth (email/password + Google)
- Accounts (cash, bank, wallet, card, credit card, digital wallet, savings)
- Categories (seeded defaults + custom, income/expense)
- Transactions (income, expense, transfer) with split, tags, notes, attachments-ready schema
- Dashboard: net worth, month cash flow, category breakdown, recent activity
- Transactions list with search, filters, date range
- Multi-currency (base currency in profile; per-account currency; FX rates table)
- Dark premium theme, responsive, empty/loading/error states everywhere

## 2. Architecture

```text
src/
  routes/                 file-based routes
    _authenticated/       gated app
      dashboard.tsx
      transactions.*
      accounts.*
      categories.tsx
      settings.tsx
    auth.tsx              public auth page
    index.tsx             marketing/landing
  features/
    accounts/             ui + hooks + queries
    transactions/
    categories/
    dashboard/
    currency/
  lib/
    *.functions.ts        createServerFn (RPC)
    *.server.ts           server-only helpers
    format.ts, date.ts
  components/ui/          shadcn primitives
  integrations/supabase/  managed
```

- **Data access:** server functions with `requireSupabaseAuth`; RLS enforces `auth.uid() = user_id` on every table.
- **Caching:** TanStack Query, loader `ensureQueryData` → component `useSuspenseQuery`.
- **Validation:** Zod schemas shared between server fn `inputValidator` and forms.
- **Money:** stored as integer minor units (`bigint`); FX via `exchange_rates(base, quote, rate, as_of)`.

## 3. Database (v1 subset)

```text
profiles(user_id pk, display_name, base_currency, locale, created_at)
currencies(code pk, name, symbol, decimals)
exchange_rates(id, base, quote, rate, as_of)  -- unique(base,quote,as_of)
accounts(id, user_id, name, type, currency, opening_balance, current_balance,
         color, icon, is_archived, credit_limit, created_at)
categories(id, user_id, name, kind[income|expense], parent_id, color, icon, is_archived)
transactions(id, user_id, kind[income|expense|transfer],
             account_id, to_account_id, category_id,
             amount_minor bigint, currency,
             fx_rate numeric, base_amount_minor bigint,
             occurred_at, description, merchant, location, notes,
             transfer_group_id, created_at, updated_at)
transaction_tags(transaction_id, tag)
transaction_splits(id, transaction_id, category_id, amount_minor, note)
attachments(id, transaction_id, storage_path, mime, size)  -- schema only v1
audit_logs(id, user_id, entity, entity_id, action, diff jsonb, at)
```

Balance updates via Postgres trigger on `transactions` insert/update/delete → keeps `accounts.current_balance` consistent (transfer writes 2 rows sharing `transfer_group_id`). All tables: RLS `user_id = auth.uid()` + explicit `GRANT` to `authenticated`, `service_role`.

## 4. Design system

Dark premium fintech, palette `#0B0F14 / #111827 / #22D3A0 / #E5E7EB`:
- Background layers: base `#0B0F14`, surface `#111827`, elevated `#141B26`
- Primary accent (positive, CTAs): mint `#22D3A0`
- Danger (expense): warm red; Info (transfer): cool blue
- Typography: Inter (UI) + JetBrains Mono for numeric amounts (tabular)
- Rounded-2xl cards, subtle 1px borders, glass only on top nav
- Motion: Framer Motion micro-interactions on cards, list row enter, tab switch
- Charts: Recharts (area for cash flow, donut for categories, sparkline for accounts)

All tokens defined in `src/styles.css` via `@theme inline` + oklch — no ad hoc colors in components.

## 5. Screens (v1)

- `/` marketing (hero, features, CTA to sign in)
- `/auth` sign in / sign up (email + Google)
- `/app/dashboard` net worth, this-month in/out/net, category donut, cash-flow area, recent txns, accounts strip
- `/app/transactions` filterable list, quick-add drawer, edit sheet
- `/app/accounts` grid of accounts, per-account detail with running balance
- `/app/categories` manage tree, colors/icons
- `/app/settings` profile, base currency, sign out

## 6. Build order

1. Enable Lovable Cloud, migrations (schema + RLS + grants + seed categories/currencies)
2. Design system tokens + shell (sidebar, top nav, auth layout)
3. Auth (email + Google) + `configure_social_auth`
4. Accounts CRUD + server fns
5. Categories CRUD + seeds
6. Transactions CRUD (income/expense/transfer) + trigger-maintained balances
7. Dashboard aggregates (server fns returning charts data)
8. Filters/search on transactions
9. QA pass: empty/loading/error states, a11y, responsive, security scan
10. Publish

## 7. Out of scope (later phases)

Mobile apps, OCR/receipt scan, AI insights, budgets, savings goals, debts/loans, recurring/subscriptions, business/family workspaces, invoices, backup/restore UI, biometric lock, Nepali date, offline write-sync. Schema is designed so these slot in without breaking changes.

## 8. Risks & decisions

- **Money math:** integer minor units end-to-end; never floats.
- **Transfers:** two-row model with `transfer_group_id` — simpler reporting, atomic via RPC.
- **FX:** amounts kept in account currency; a `base_amount_minor` denormalized at write-time using latest rate for fast aggregates.
- **Server fns only** for app data; no edge functions in v1.
- **Google sign-in** via Lovable broker (`lovable.auth.signInWithOAuth`).

Approve to proceed — I'll start with enabling Cloud, writing the planning docs, and shipping the schema + auth + shell in the first build pass.

# Ledgerly — Product Requirements

## Vision
A calm, premium personal finance operating system. Instead of a spreadsheet or a
noisy expense tracker, Ledgerly gives the user a single dark dashboard that
answers the questions their money keeps asking them.

## Personas
- **The tracker (primary)** — wants to know net worth and where money goes each month.
- **The multi-wallet user** — cash + bank + e-wallets + credit card in the same view.
- **The saver / planner (future)** — budgets, goals, recurring bills.

## v1 Scope
- Email/password + Google sign-in (Lovable Cloud).
- Accounts: cash, bank, wallet, cards, credit card, digital wallets, savings, etc.
- Categories: seeded defaults per user + custom, split by income/expense.
- Transactions: income, expense, transfer between accounts.
- Dashboard: net worth, month cash flow, category donut, recent activity.
- Transactions list with search + filters.
- Multi-currency per account; base currency in profile.
- Dark premium fintech UI, fully responsive PWA-ready.

## Non-Goals (v1)
Native mobile builds, AI insights, OCR/receipt scan, budgets, savings goals,
debts/loans tracking, recurring/subscriptions, business/family workspaces,
invoicing, offline write-sync, biometric lock.

## Success Metrics
- Time from sign-up → first transaction < 60s.
- User can answer "how much did I spend this month?" without leaving the dashboard.
- Zero user data leakage: RLS enforces per-user access on every table.

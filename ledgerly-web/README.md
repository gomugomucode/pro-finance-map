# Ledgerly Web — Technical Documentation & Folder Guide 🌐

Welcome to the **`ledgerly-web`** application! This is a modern, high-performance financial command center built with **TanStack Start**, **React 19**, **TanStack Router**, **TanStack Query v5**, **Tailwind CSS v4**, and **Supabase**.

---

## 📁 Source Directory Breakdown (`src/`)

```
ledgerly-web/src/
├── components/          # Reusable UI elements & application modals
│   ├── CommandPaletteModal.tsx  # Global search & action shortcut palette (Cmd+K)
│   ├── CurrencyPickerModal.tsx  # Multi-currency select modal
│   ├── NotificationCenter.tsx   # User alert & system notification drawer
│   ├── OnboardingModal.tsx      # Interactive initial setup wizard
│   ├── UserAvatar.tsx           # Profile picture & user fallback badge
│   ├── WorkspaceSwitcher.tsx    # Multi-wallet & workspace switcher
│   └── ui/                      # 46 Radix UI primitive primitives (button, dialog, card, etc.)
│
├── features/            # Modular domain slices
│   ├── analytics/       # Net worth charts & financial health scores
│   ├── budgets/         # Category budgeting, spending limits, & progress indicators
│   ├── calendar/        # Monthly cashflow calendar & scheduled bill events
│   ├── documents/       # Receipt vault, OCR engine, document dropzone, & PDF/image view
│   ├── import-export/   # CSV importer wizard, data export, & account reconciliation
│   ├── loans/           # Personal loans, debt repayment calculator, & contact manager
│   ├── merchants/       # Merchant intelligence, clean merchant auto-matching, & metrics
│   ├── mobile/          # SMS parser engine, SMS settings, offline sync queue status
│   ├── recurring/       # Scheduled recurring transactions & frequency manager
│   ├── savings/         # Goal tracking, progress rings, & contribution calculator
│   ├── settings/        # Security preferences, audit log viewer, profile customization
│   ├── subscriptions/   # Active SaaS / recurring subscription manager & alert engine
│   ├── transactions/    # Paginated transaction ledger, quick add modal, & tag manager
│   └── wealth/          # Investment assets, real estate, liabilities, & portfolio view
│
├── hooks/               # Application-wide React hooks
│   ├── use-mobile.tsx   # Responsive viewport breakpoint detection (<768px)
│   ├── useProfile.ts    # React Query hook for fetching/updating user profile & settings
│   └── useTheme.ts      # Dark/light mode theme toggle hook
│
├── integrations/        # Backend SDKs & Middleware
│   └── supabase/
│       ├── auth-attacher.ts     # Request context header injector
│       ├── auth-middleware.ts   # Server function JWT verification middleware (`requireSupabaseAuth`)
│       ├── client.server.ts     # Service-role admin client (server-side only)
│       ├── client.ts            # Client-side Supabase browser proxy client
│       └── types.ts             # Auto-generated TypeScript types matching PostgreSQL schema
│
├── lib/                 # Core Business & Calculation Engines
│   ├── advisor-engine.ts       # Emergency fund calculator & financial runway advisor
│   ├── backup-engine.ts        # Data backup & JSON export generator
│   ├── buckets-engine.ts       # Sinking fund & envelope budgeting allocator
│   ├── currencies.ts           # World currencies reference & formatting configuration
│   ├── demo-engine.ts          # Sample demo data loader for instant preview
│   ├── error-capture.ts        # Global client error handling utility
│   ├── error-page.ts           # Route error boundary renderer
│   ├── finance.functions.ts    # TanStack Start Server Functions (RPCs for all CRUD actions)
│   ├── forecast-engine.ts      # Future balance & cashflow projection model
│   ├── health-score.ts         # 0–100 Financial Health Index scoring algorithm
│   ├── insights-engine.ts      # Automated pattern detection (overspending, weekend spikes)
│   ├── lovable-error-reporting.ts # Error telemetry reporter
│   ├── modules.ts              # Feature toggle & module activation definitions
│   ├── money.ts                # Minor unit money helpers (`toMinor`, `fromMinor`, `formatMoney`)
│   ├── rules-engine.ts         # Automated transaction categorization & tagging rules
│   ├── schemas.ts              # Zod input validation schemas for all domain entities
│   ├── smart-parser.ts         # Natural language transaction text parser
│   └── utils.ts                # Tailwind `cn()` helper
│
├── routes/              # TanStack Start File-Based Routing System
│   ├── __root.tsx              # Root HTML shell, QueryClientProvider, & global metadata
│   ├── auth.tsx                # Authentication route (Email/Password & Google OAuth)
│   ├── index.tsx               # Public landing page / product overview
│   └── _authenticated/         # Protected routes requiring active user session
│       ├── route.tsx           # Authenticated layout sidebar & navbar shell
│       ├── dashboard.tsx       # Main financial dashboard overview
│       ├── accounts.tsx        # Accounts & wallets manager
│       ├── transactions.tsx    # Full transaction ledger
│       ├── analytics.tsx       # Spending charts & financial metrics
│       ├── budgets.tsx         # Category budgets & envelope limits
│       ├── wealth.tsx          # Net worth & portfolio assets/liabilities
│       ├── loans.tsx           # Loans, debt, & contact manager
│       ├── recurring.tsx       # Scheduled recurring transactions
│       ├── subscriptions.tsx   # SaaS subscription manager
│       ├── savings.tsx         # Savings goals & progress tracking
│       ├── merchants.tsx       # Merchant database & analytics
│       ├── vault.tsx           # Receipt & document storage vault
│       ├── import-export.tsx   # CSV import wizard & data exporter
│       ├── insights.tsx        # Smart AI financial insights
│       ├── calendar.tsx        # Financial calendar view
│       ├── health.tsx          # Health score detailed breakdown
│       ├── timeline.tsx        # Financial activity timeline
│       ├── notifications.tsx   # User alerts & notification center
│       ├── settings.tsx        # User settings & security audit log
│       └── feedback.tsx       # User feedback submission screen
│
├── types/               # Domain TypeScript Definitions
│   ├── documents.ts            # Document vault & OCR metadata types
│   └── sms.ts                  # SMS transaction parser & import types
│
└── supabase/
    └── migrations/      # 10 Sequential SQL Schema Migrations
```

---

## ⚙️ Core Engines Explained (`src/lib/`)

1. **`finance.functions.ts`**: Contains all server-side RPC functions created using `createServerFn`. Every call passes through `requireSupabaseAuth` middleware to ensure row-level user authorization.
2. **`smart-parser.ts`**: Enables typing raw input like `"Spent $45 at Starbucks on Coffee yesterday"` and automatically parsing the amount (`$45`), merchant (`Starbucks`), category (`Coffee`), and date (`yesterday`).
3. **`health-score.ts`**: Calculates a comprehensive 0–100 Financial Health Index by evaluating savings rate, emergency fund adequacy, debt ratio, and budget compliance.
4. **`advisor-engine.ts`**: Analyzes monthly expenses to recommend an ideal 3-to-6 month emergency fund runway and calculates milestone achievements.
5. **`rules-engine.ts`**: Runs automated user-defined rules (e.g. _"If description contains Uber, set category to Transportation"_).

---

## 🛠 Available Scripts

In the `ledgerly-web` directory:

- `npm run dev`: Launch Vite + TanStack Start development server.
- `npm run build`: Build production web assets and SSR server bundle.
- `npm run preview`: Preview the production build locally.
- `npm run lint`: Run ESLint checks across the codebase.
- `npm run format`: Format code using Prettier.

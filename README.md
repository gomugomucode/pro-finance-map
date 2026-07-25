# Ledgerly — Personal Finance Operating System

> **Ledgerly** is a state-of-the-art personal finance operating system designed to give users complete clarity over their financial life. It features a high-performance web dashboard built with TanStack Start & React 19, alongside a React Native mobile companion app built with Expo SDK 52, both powered by a unified Supabase PostgreSQL backend.

---

## 🏗 System Architecture Overview

```
                                +----------------------------------+
                                |          USER / CLIENT           |
                                +----------------------------------+
                                        |                  |
                       (Web Browser)    |                  |    (Mobile Device)
                                        v                  v
                        +--------------------+        +--------------------+
                        |   ledgerly-web     |        |  ledgerly-mobile   |
                        | (TanStack Start)   |        |    (Expo SDK 52)   |
                        +--------------------+        +--------------------+
                                  |                             |
                                  v                             v
                        +--------------------+        +--------------------+
                        |  TanStack Router   |        |    Expo Router     |
                        +--------------------+        +--------------------+
                                  |                             |
                                  v                             v
                        +--------------------+        +--------------------+
                        |   TanStack Query   |        |   TanStack Query   |
                        +--------------------+        +--------------------+
                                  |                             |
                (Server Fn)       v                             | (Direct SDK)
                        +--------------------+                  |
                        | Server Functions   |                  |
                        | (finance.functions)|                  |
                        +--------------------+                  |
                                  |                             |
                                  +--------------+--------------+
                                                 |
                                                 v
                                    +--------------------------+
                                    |    Supabase Platform     |
                                    | (Auth / Storage / REST)  |
                                    +--------------------------+
                                                 |
                                                 v
                                    +--------------------------+
                                    | Postgres DB + RLS Engine |
                                    +--------------------------+
```

---

## 📂 Project Structure & Folder Guide

The repository is organized into distinct applications sharing a backend data layer:

```
pro-finance-map/
├── ledgerly-web/             # Web Application (TanStack Start + React 19)
│   ├── src/
│   │   ├── components/       # Global React UI components & Radix primitives
│   │   ├── features/         # Feature modules (analytics, budgets, loans, wealth, etc.)
│   │   ├── hooks/            # Shared React hooks (useTheme, useProfile, use-mobile)
│   │   ├── integrations/     # Supabase client & server auth middleware
│   │   ├── lib/              # Core business engines (advisor, forecast, rules, parser)
│   │   ├── routes/           # TanStack Start file-based routing system
│   │   ├── types/            # TypeScript interfaces & type definitions
│   │   └── styles.css        # Tailwind CSS v4 & custom design tokens
│   └── supabase/
│       └── migrations/       # PostgreSQL migrations & database schema definitions
│
├── ledgerly-mobile/          # Mobile Companion App (Expo SDK 52 + React Native)
│   ├── app/                  # Expo Router file-based mobile navigation
│   │   ├── (auth)/           # Authentication screens (login, register)
│   │   ├── (tabs)/           # Main tab bar navigation (home, accounts, tx, vault)
│   │   └── unlock.tsx        # Biometrics lock screen
│   └── lib/                  # Mobile services (biometrics, sync, notifications, supabase)
│
└── README.md                 # Ecosystem Root Documentation
```

---

## 🚀 Applications & Workspace Summary

### 🌐 1. `ledgerly-web`

- **Tech Stack**: TanStack Start, TanStack Router, TanStack Query v5, React 19, Vite, Tailwind CSS v4, Radix UI.
- **Key Features**:
  - **Dashboard**: Net worth tracking, account liquidity, monthly budget progress, recent activity.
  - **Account & Wallet Management**: Multi-currency support (USD, EUR, INR, NPR, JPY, etc.), account locking/freezing, favorites.
  - **Transaction Center**: Filterable, paginated transaction ledger with split transactions and categorization.
  - **Wealth Management**: Net worth tracker for real estate, stocks, crypto, liabilities, and loans.
  - **Smart Engines**: Natural language transaction parser (`smart-parser.ts`), automated financial rules (`rules-engine.ts`), health score calculator (`health-score.ts`), and emergency runway advisor (`advisor-engine.ts`).
  - **Document Vault**: Receipt storage with OCR processing and cloud backup.

### 📱 2. `ledgerly-mobile`

- **Tech Stack**: Expo SDK 52, Expo Router v4, React Native, Expo SecureStore, Lucide Icons, TanStack Query.
- **Key Features**:
  - **Quick Dashboard**: Lightweight mobile overview of total net worth, liquid balances, and recent spending.
  - **Biometrics Security**: Local authentication via FaceID / TouchID (`biometrics.ts`).
  - **Offline Sync Queue**: Record transactions offline and automatically sync when network connection resumes (`offline-sync.ts`).
  - **Secure Token Storage**: Encrypted token management using `ExpoSecureStoreAdapter`.

---

## ⚙️ Environment & Local Setup Guide

### Prerequisites

- **Node.js**: `v18.x` or higher
- **npm** or **bun** / **yarn**
- **Expo Go** (for mobile physical device testing) or Android Studio / Xcode Emulators.

### 1. Clone & Install Dependencies

```bash
# Clone the workspace
git clone <repository-url>
cd pro-finance-map

# Install Web dependencies
cd ledgerly-web
npm install

# Install Mobile dependencies
cd ../ledgerly-mobile
npm install
```

### 2. Configure Environment Variables

Create `.env` inside `ledgerly-web/`:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Create `.env` inside `ledgerly-mobile/`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_key_here
```

---

## 🏃 Driving & Running Locally

### Starting Web Application

```bash
cd ledgerly-web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or Vite dev server port.

### Starting Mobile Companion

```bash
cd ledgerly-mobile
npm run start
```

- Press `a` for Android Emulator
- Press `i` for iOS Simulator
- Scan QR code with **Expo Go** for physical mobile device testing.

---

## 🔒 Security & Data Compliance

- **Row Level Security (RLS)**: Every single table (`profiles`, `accounts`, `transactions`, `budgets`, `loans`, etc.) enforces strict user isolation via `auth.uid() = user_id`.
- **Encrypted Local Storage**: Native mobile tokens are protected via hardware-backed iOS Keychain / Android KeyStore (`expo-secure-store`).
- **Server Functions Authorization**: Server calls validate JWT signature claims via `requireSupabaseAuth` middleware before processing data operations.

---

## 📜 Sub-Project Documentation

For granular module definitions and file-by-file documentation, refer to:

- [Web README (`ledgerly-web/README.md`)](./ledgerly-web/README.md)
- [Mobile README (`ledgerly-mobile/README.md`)](./ledgerly-mobile/README.md)

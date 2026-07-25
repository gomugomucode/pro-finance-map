# Ledgerly Mobile — Companion App Documentation 📱

Welcome to **`ledgerly-mobile`**, the React Native mobile companion app for **Ledgerly**, built with **Expo SDK 52**, **Expo Router v4**, **TanStack Query**, and **Expo SecureStore**.

---

## 📂 Project Structure & Module Guide (`ledgerly-mobile/`)

```
ledgerly-mobile/
├── app/                      # Expo Router File-Based Mobile Routes
│   ├── _layout.tsx           # Root provider shell (TanStack Query, dark theme)
│   ├── unlock.tsx            # Hardware biometrics lock screen (FaceID / TouchID)
│   │
│   ├── (auth)/               # Auth Navigation Stack
│   │   ├── login.tsx         # User login screen with email/password
│   │   └── register.tsx      # Registration screen
│   │
│   └── (tabs)/               # Bottom Tab Bar Navigation
│       ├── _layout.tsx       # Tab bar configuration & Lucide tab icons
│       ├── index.tsx         # Mobile Dashboard (Net worth, quick stats, sync indicator)
│       ├── accounts.tsx      # Account balances & liquid assets list
│       ├── transactions.tsx  # Recent transaction feed with pull-to-refresh
│       ├── vault.tsx         # Document vault & receipt attachment viewer
│       └── profile.tsx       # User profile, biometrics toggle, & sign out
│
├── lib/                      # Mobile Core Services
│   ├── biometrics.ts         # FaceID / TouchID local authentication helper
│   ├── money.ts              # Minor unit currency formatter (`formatMoney`)
│   ├── notifications.ts      # Push notification scheduling service
│   ├── offline-sync.ts       # Offline mutation queue for network loss resilience
│   └── supabase.ts           # Supabase client initialized with ExpoSecureStoreAdapter
│
├── assets/                   # App icons, splash screens, and favicons
├── app.json                  # Expo project manifest & native permissions configuration
├── package.json              # React Native & Expo dependencies
└── tsconfig.json             # TypeScript compiler settings
```

---

## ⚙️ Key Services & Features (`lib/`)

### 🔐 1. Hardware Secure Storage (`lib/supabase.ts`)
The mobile client bridges Supabase Auth session tokens directly to the device's hardware enclave (iOS Keychain / Android KeyStore) via `ExpoSecureStoreAdapter`. This ensures auth sessions remain persistent and secure against device theft or web storage scraping.

```ts
// Reads credentials from process.env.EXPO_PUBLIC_SUPABASE_URL
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

### 👆 2. Biometric Lock Screen (`lib/biometrics.ts` & `app/unlock.tsx`)
Provides biometrics authentication capabilities (FaceID, TouchID, Android Fingerprint/Passcode) using `expo-local-authentication`. Users can enforce biometric protection every time the app opens.

### 📶 3. Offline Transaction Queue (`lib/offline-sync.ts`)
Allows users to log expenses on the go even without an active internet connection. Offline actions are queued locally in encrypted storage and synced automatically via `processOfflineSyncQueue()` upon restoring connectivity or pulling to refresh the dashboard.

### 🔔 4. Push Notifications (`lib/notifications.ts`)
Schedules local reminders for upcoming bills, recurring subscriptions, and budget overspending warnings using `expo-notifications`.

---

## 🚀 Running the Mobile App

### Prerequisites
- Node.js `v18.x`+
- Expo Go app on your iOS / Android phone, OR Android Studio Emulator / Xcode iOS Simulator.

### 1. Install Dependencies
```bash
cd ledgerly-mobile
npm install
```

### 2. Configure Environment Variables
Create `.env` inside `ledgerly-mobile/`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_key
```

### 3. Start Expo Server
```bash
npm run start
```
- Press **`a`** to open in Android Emulator.
- Press **`i`** to open in iOS Simulator.
- Scan the printed QR code with **Expo Go** on a physical phone.

---

## 📱 Native App Permissions (`app.json`)
The app declares the following native permissions for security and receipt capture:
- `CAMERA`: For scanning receipts into the document vault.
- `USE_BIOMETRIC` / `USE_FINGERPRINT`: For hardware app unlock.
- `RECEIVE_SMS` / `READ_SMS`: For optional SMS automated transaction import.

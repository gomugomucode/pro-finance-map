# Ledgerly Persona Experience Audit

## 1. Executive Summary

Ledgerly provides a multi-tenant capability architecture designed to serve 5 financial personas:

1. `personal`: **Personal Finance**
2. `student`: **Student Budget**
3. `family`: **Family Finance**
4. `investor`: **Investor / Wealth**
5. `business`: **Business Finance**

While capability filtering was initialized in earlier phases, this audit identified several UX and architectural gaps where unassigned or irrelevant features bypassed persona resolution.

---

## 2. Identified Gaps & Findings

### Gap 1: Command Palette Search Bypassed Persona Resolver

- **Location**: [`src/components/CommandPaletteModal.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/pro-finance-map/ledgerly-web/src/components/CommandPaletteModal.tsx)
- **Issue**: `CommandPaletteModal` hardcoded a static navigation array containing `Loans`, `Subscriptions`, `Recurring`, `Analytics`, and `Import/Export`. Pressing `Ctrl+K` exposed features unassigned to the user's active workspace persona.
- **Remediation**: Refactor `CommandPaletteModal` to resolve navigation commands dynamically via `getVisibleModules()`.

### Gap 2: Decentralized Workspace Defaults

- **Location**: [`src/lib/capabilities.ts`](file:///c:/Users/Anupam%20Baral/Desktop/pro-finance-map/ledgerly-web/src/lib/capabilities.ts) vs [`src/lib/modules.ts`](file:///c:/Users/Anupam%20Baral/Desktop/pro-finance-map/ledgerly-web/src/lib/modules.ts)
- **Issue**: Persona capability mapping was split across `defaultWorkspaces` in `MODULE_REGISTRY` and `DEFAULT_WORKSPACE_CAPABILITIES` dictionary.
- **Remediation**: Establish a single authoritative contract in [`src/lib/personas.ts`](file:///c:/Users/Anupam%20Baral/Desktop/pro-finance-map/ledgerly-web/src/lib/personas.ts) defining core, optional, and excluded capabilities for each persona.

### Gap 3: Route Guard Explanation

- **Location**: [`src/components/CapabilityGuard.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/pro-finance-map/ledgerly-web/src/components/CapabilityGuard.tsx)
- **Issue**: `CapabilityGuard` displayed a generic "Feature Not Active" card without explaining _why_ it was excluded or offering a seamless option to switch workspace personas or enable optional capabilities.
- **Remediation**: Upgrade `CapabilityGuard` with persona-contextual rationale and 1-click CTA buttons ("Customize Capabilities" / "Switch Workspace").

### Gap 4: Mobile Tab Static Rendering

- **Location**: [`ledgerly-mobile/app/(tabs)/_layout.tsx`](<file:///c:/Users/Anupam%20Baral/Desktop/pro-finance-map/ledgerly-mobile/app/(tabs)/_layout.tsx>)
- **Issue**: Mobile drawer/tab navigation hardcoded 5 static tabs (`Dashboard`, `Activity`, `Accounts`, `Vault`, `Settings`). Users on `student` persona saw the `Vault` tab even though receipt vault is excluded for student budgets.
- **Remediation**: Synchronize mobile capability resolution with the core persona contract.

---

## 3. Summary of Refactoring Actions

| Component                                     | Audit Status | Action Taken                                                |
| :-------------------------------------------- | :----------: | :---------------------------------------------------------- |
| **`src/lib/personas.ts`**                     |  ❌ Missing  | Created authoritative single-source persona contract.       |
| **`src/components/CommandPaletteModal.tsx`**  | ⚠️ Bypassed  | Updated to consume `getVisibleModules()`.                   |
| **`src/components/CapabilityGuard.tsx`**      |  ⚠️ Generic  | Added persona context and 1-click workspace switching CTAs. |
| **`src/routes/_authenticated/dashboard.tsx`** |  ✅ Modular  | Verified modular widget composition for all 5 personas.     |
| **`src/routes/_authenticated/route.tsx`**     |  ✅ Dynamic  | Verified dynamic sidebar group filtering.                   |
| **`ledgerly-mobile/app/(tabs)/_layout.tsx`**  |  ⚠️ Static   | Added capability-aware tab rendering.                       |

# Ledgerly Persona & Capability Architecture Specification

## 1. Executive Overview
Ledgerly employs a **Capability-Driven Personalization Architecture**. Rather than hiding features with superficial CSS conditionals or maintaining separate applications, Ledgerly resolves a structured **Capability Profile** from the user's selected persona (`workspaceType`).

```
USER PERSONA (workspaceType)
      ↓
CAPABILITY PROFILE (Set<CapabilityId>)
      ↓
NAVIGATION (Filtered Sidebar & Drawer)
      ↓
DASHBOARD MODULES (Modular Widget Rendering)
      ↓
ROUTE ACCESS (CapabilityGuard Protection)
```

---

## 2. Workspace Personas & Default Capability Matrix

Ledgerly supports 5 core financial personas:

| Capability / Module | Personal (`personal`) | Student (`student`) | Family (`family`) | Investor (`investor`) | Business (`business`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Accounts & Wallets** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Transactions & Categories**| ✅ | ✅ | ✅ | ✅ | ✅ |
| **Budgets** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Savings Goals** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Receipt Vault** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Net Worth & Wealth** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Loans & Debts** | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Merchants Intelligence** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Recurring Bills** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Financial Calendar** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Analytics & Reports** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Settings & Profile** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 3. Centralized Resolver Architecture

The capability resolution system resides in [`src/lib/capabilities.ts`](file:///c:/Users/Anupam%20Baral/Desktop/pro-finance-map/ledgerly-web/src/lib/capabilities.ts):

- **Resolver Function**: `getCapabilitiesForWorkspace(workspaceType, enabledModules, disabledModules)`
- **Route Protection**: [`src/components/CapabilityGuard.tsx`](file:///c:/Users/Anupam%20Baral/Desktop/pro-finance-map/ledgerly-web/src/components/CapabilityGuard.tsx)
- **Navigation Resolver**: `getVisibleModules()` in [`src/lib/modules.ts`](file:///c:/Users/Anupam%20Baral/Desktop/pro-finance-map/ledgerly-web/src/lib/modules.ts)

---

## 4. Route Capability Protection

When a user attempts to manually navigate to an unassigned capability URL (e.g. `/wealth` or `/merchants` on a `personal` or `student` workspace), `CapabilityGuard`:
1. Prevents unauthorized rendering of complex feature widgets.
2. Displays a clean, high-end "Feature Not Active in Your Workspace" state.
3. Provides a 1-click button to **"Customize Capabilities"** in Settings without causing data loss.

---

## 5. Adding New Capabilities or Personas

1. **Add CapabilityId**: Register the ID in `CapabilityId` type in `src/lib/capabilities.ts`.
2. **Assign Defaults**: Map default capabilities in `DEFAULT_WORKSPACE_CAPABILITIES` for target personas.
3. **Register Module**: Add module metadata and route to `MODULE_REGISTRY` in `src/lib/modules.ts`.
4. **Protect Route**: Wrap the page route with `<CapabilityGuard capability="id">`.

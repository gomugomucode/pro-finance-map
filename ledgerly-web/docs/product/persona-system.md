# Ledgerly Persona System Architecture

## 1. Authoritative Persona Contract
All persona configurations, core capabilities, optional capabilities, and excluded capabilities are defined in [`src/lib/personas.ts`](file:///c:/Users/Anupam%20Baral/Desktop/pro-finance-map/ledgerly-web/src/lib/personas.ts).

### Resolution Order
```
1. PERSONA CORE DEFAULTS (PERSONA_CONFIG[workspaceType].coreCapabilities)
       +
2. USER OPTIONAL ENABLED MODULES (profile.enabledModules - excludedCapabilities)
       -
3. USER DISABLED MODULES (profile.disabledModules)
       +
4. MANDATORY SYSTEM SAFEGUARDS (dashboard, accounts, transactions, settings)
       =
FINAL CAPABILITY PROFILE Set<CapabilityId>
```

---

## 2. Capability Resolution Flow
```
User Auth Session / Profile Query
        ↓
profile.workspaceType ("personal" | "student" | "family" | "investor" | "business")
        ↓
getCapabilitiesForWorkspace() Resolver
        ↓
  ┌───────────────────────┬─────────────────────────┬────────────────────────┐
  ↓                       ↓                         ↓                        ↓
Sidebar Navigation   Command Palette        Protected Routes        Dashboard Composition
(getVisibleModules)  (Ctrl+K Search)        (CapabilityGuard)      (Persona Widgets)
```

---

## 3. Data Safety Principles
1. **Presentation Isolation**: Switching personas modifies capabilities and visual navigation. It **never** executes SQL `DELETE` or `TRUNCATE` operations against transaction history, accounts, budgets, or documents.
2. **Deterministic Fallbacks**: Core mandatory capabilities (`dashboard`, `accounts`, `transactions`, `settings`) cannot be disabled.

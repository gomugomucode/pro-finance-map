# Ledgerly Design System: Visual Color Architecture

## 1. Executive Principles

Ledgerly's visual identity has been upgraded to a **Deep Navy + Royal Blue + Violet Financial Operating System**.

- **Primary Identity**: Deep Navy (`#172554`) & Royal Blue (`#2563EB` / `#3B82F6`).
- **Secondary Identity**: Soft Royal Violet (`#7C3AED` / `#8B5CF6`).
- **Semantic Green Constraint**: Green/Emerald (`#10B981`) is strictly restricted to financial-positive semantics (Income, Positive Net Worth Growth, and Success Confirmation badges). It is **never** used for brand identity or decorative primary elements.
- **Semantic Red/Rose**: Expense, Loss, and Destructive actions (`#F43F5E`).
- **Semantic Amber**: Warnings and Pending States (`#F59E0B`).
- **Semantic Blue**: Transfers and Information (`#3B82F6` / `#60A5FA`).

---

## 2. Color System Tokens Specification

### Light Mode Palette

```css
:root {
  --background: #f8fafc; /* Cool Slate */
  --foreground: #0f172a; /* Near-Black / Slate */

  --surface: #f1f5f9;
  --surface-muted: #f1f5f9;
  --card: #ffffff; /* Pure White */

  --primary: #172554; /* Deep Navy */
  --primary-action: #2563eb; /* Royal Blue Interactive */
  --secondary: #7c3aed; /* Soft Royal Violet */

  --muted-foreground: #64748b;
  --border: #e2e8f0;

  /* Financial Semantics */
  --income: #10b981; /* Emerald Green */
  --expense: #f43f5e; /* Rose Red */
  --warning: #f59e0b; /* Amber */
  --transfer: #3b82f6; /* Royal Blue */
  --info: #60a5fa; /* Sky Blue */
}
```

### Dark Mode Palette

```css
.dark {
  --background: #080d1a; /* Deep Navy Charcoal */
  --foreground: #f8fafc;

  --surface: #0f172a;
  --surface-muted: #172033;
  --card: #0f172a;

  --primary: #93c5fd; /* Soft Sky Navy */
  --primary-action: #3b82f6; /* Royal Blue Interactive */
  --secondary: #8b5cf6; /* Royal Violet */

  --muted-foreground: #94a3b8;
  --border: #1e293b;

  /* Financial Semantics */
  --income: #10b981;
  --expense: #f43f5e;
  --warning: #f59e0b;
  --transfer: #3b82f6;
  --info: #60a5fa;
}
```

---

## 3. Financial Semantics Rules

| Action / State                | Semantic Token / Palette            | Usage Guidelines                                          |
| :---------------------------- | :---------------------------------- | :-------------------------------------------------------- |
| **Primary Brand / Header**    | `bg-[#172554]`, `text-[#172554]`    | Deep Navy sidebar, headers, and brand elements.           |
| **Primary Action**            | `bg-[#2563EB]`, `text-white`        | Royal Blue buttons, active route indicators, primary CTA. |
| **Secondary Accent**          | `bg-[#7C3AED]`, `text-white`        | Royal Violet secondary actions and specialized tags.      |
| **Income / Positive Balance** | `text-[#10B981]`, `bg-[#10B981]/10` | Income deposits, positive balances, net worth gains.      |
| **Expense / Debit**           | `text-[#F43F5E]`, `bg-[#F43F5E]/10` | Expense debits, balance losses, destructive actions.      |
| **Transfer**                  | `text-[#3B82F6]`, `bg-[#3B82F6]/10` | Transfers between accounts, account moves.                |
| **Warning / Budget Risk**     | `text-[#F59E0B]`, `bg-[#F59E0B]/10` | Budget risk (>80% utilization), pending actions.          |

---

## 4. Chart Color Scale

1. **Series 1 (Primary)**: Royal Blue (`#2563EB` / `#3B82F6`)
2. **Series 2 (Secondary)**: Royal Violet (`#7C3AED` / `#8B5CF6`)
3. **Series 3 (Tertiary)**: Sky Blue (`#60A5FA`)
4. **Income Series**: Emerald Green (`#10B981`)
5. **Expense Series**: Rose Red (`#F43F5E`)

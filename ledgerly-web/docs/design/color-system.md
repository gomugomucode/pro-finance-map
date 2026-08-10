# Ledgerly Design System: Visual Color Architecture

## 1. Executive Principles
Ledgerly's visual identity has been upgraded from a generic green-heavy dashboard to a **Deep Indigo Financial Operating System**.

- **Primary Identity**: Deep Indigo (`oklch(0.52 0.24 265)`) / Royal Blue (`#4F46E5`).
- **Secondary Identity**: Soft Violet (`oklch(0.56 0.22 285)`) / Blue-Violet (`#7C3AED`).
- **Semantic Green Constraint**: Green/Emerald is strictly restricted to financial-positive semantics (Income, Positive Net Worth Growth, and Success Confirmation badges). It is **never** used for brand identity or decorative primary elements.
- **Semantic Red/Rose**: Expense, Loss, and Destructive actions.
- **Semantic Amber**: Warnings and Pending States.

---

## 2. Token Specification

### Light Theme Tokens
```css
:root {
  --background: oklch(0.985 0.004 250); /* Slate #F8FAFC */
  --foreground: oklch(0.18 0.025 260); /* Charcoal #0F172A */

  --primary: oklch(0.52 0.24 265);    /* Deep Indigo #4F46E5 */
  --secondary: oklch(0.56 0.22 285);  /* Soft Violet #7C3AED */

  --income: oklch(0.62 0.19 155);     /* Emerald #10B981 */
  --expense: oklch(0.58 0.22 25);     /* Rose #F43F5E */
  --transfer: oklch(0.52 0.24 265);   /* Indigo #4F46E5 */

  --border: oklch(0.91 0.01 250);     /* Low-contrast slate */
}
```

### Dark Theme Tokens
```css
.dark {
  --background: oklch(0.14 0.02 260); /* Deep Charcoal #0B0F17 */
  --foreground: oklch(0.96 0.005 260);

  --primary: oklch(0.68 0.22 265);    /* Vibrant Indigo #6366F1 */
  --secondary: oklch(0.7 0.2 285);    /* Soft Violet #8B5CF6 */

  --income: oklch(0.72 0.18 155);     /* Bright Emerald */
  --expense: oklch(0.68 0.2 25);      /* Bright Rose */
  --transfer: oklch(0.68 0.22 265);   /* Indigo */

  --border: oklch(1 0 0 / 10%);
}
```

---

## 3. Financial Semantics Rules

| Action / State | Semantic Token / Palette | Usage Guidelines |
| :--- | :--- | :--- |
| **Primary Brand / Action** | `bg-primary`, `text-primary` | Primary buttons, active routes, brand icons. |
| **Income / Positive Balance** | `text-emerald-600`, `bg-emerald-500/10` | Deposit, salary, positive net worth gain. |
| **Expense / Debit** | `text-rose-600`, `bg-rose-500/10` | Outgoing expenses, account debits, destructive actions. |
| **Transfer** | `text-indigo-600`, `bg-indigo-500/10` | Moving money between checking and savings. |
| **Pending / Warning** | `text-amber-600`, `bg-amber-500/10` | Unconfirmed transactions or budget thresholds (>80%). |

---

## 4. Chart Color Scale

1. **Series 1 (Primary)**: Deep Indigo (`oklch(0.52 0.24 265)`)
2. **Series 2 (Secondary)**: Soft Violet (`oklch(0.56 0.22 285)`)
3. **Series 3 (Tertiary)**: Blue (`oklch(0.55 0.22 260)`)
4. **Income Series**: Emerald (`oklch(0.62 0.19 155)`)
5. **Expense Series**: Rose (`oklch(0.58 0.22 25)`)

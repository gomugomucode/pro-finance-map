# UI System

## Palette (oklch tokens in `src/styles.css`)
- `--background` #0B0F14 — page base
- `--surface`   #111827 — cards
- `--elevated`  #141B26 — popovers / higher layers
- `--primary`   #22D3A0 — CTAs, income, positive
- `--destructive` — expense red
- `--info` — transfer blue
- `--warning` — amber
- `--border`, `--input`, `--muted`, `--muted-foreground` — chrome

Everything semantic — never write `text-white` or `bg-[#...]` in components.

## Typography
- **Inter** — UI (400/500/600/700)
- **JetBrains Mono** (`.tabular` utility) — all money figures, for aligned digits

## Building blocks
- shadcn primitives in `src/components/ui/*`
- `card-elevated` utility for standard cards
- `glass` utility for the marketing nav
- Recharts for cash-flow area + category donut (colors from tokens)

## Patterns
- **Empty state**: centered icon + one sentence + primary CTA.
- **Loading**: skeleton or subtle "Loading…" line.
- **Error**: destructive text + Retry button that calls `router.invalidate()` + `reset()`.
- **Money numbers**: always via `formatMoney()`; use `signed` for deltas.
- **Kind tone**: income = success, expense = destructive, transfer = info.

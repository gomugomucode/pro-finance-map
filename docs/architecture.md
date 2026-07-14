# Architecture

```text
Browser (React 19 + TanStack Router)
        │  useSuspenseQuery / useMutation
        ▼
TanStack Query cache
        │  useServerFn RPC (Authorization: Bearer <supabase-jwt>)
        ▼
TanStack Start server functions (createServerFn)
        │  requireSupabaseAuth middleware validates JWT
        ▼
Supabase Postgres (RLS by auth.uid())
```

## Layers
- **routes/** — file-based routing, page composition, `errorComponent`/`pendingComponent`.
- **features/** — feature-scoped UI (transactions/QuickAddTransaction, etc).
- **lib/finance.functions.ts** — all `createServerFn` RPCs. Client imports these; the server transform strips handler bodies from the client bundle.
- **lib/schemas.ts** — shared zod schemas used by `inputValidator` and forms.
- **lib/money.ts** — integer-minor formatters.
- **integrations/supabase/** — auto-generated managed clients.

## Data flow
1. Loader calls `context.queryClient.ensureQueryData(queryOptions)` — primes the cache.
2. Component reads with `useSuspenseQuery` (no `isLoading` juggling).
3. Mutations use `useServerFn` + `useMutation`, then `queryClient.invalidateQueries` and `router.invalidate()`.

## Boundaries
- Never import `client.server.ts` from route/component files.
- Server-only env (`process.env.*`) only inside `.handler()` bodies or `.server.ts` files.
- No Edge Functions in v1 — every app-internal call is a server function.

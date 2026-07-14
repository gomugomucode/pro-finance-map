# Server API

All RPCs live in `src/lib/finance.functions.ts` and go through
`requireSupabaseAuth`. The client attaches the Supabase JWT via the
`attachSupabaseAuth` function middleware registered in `src/start.ts`.

| Function | Method | Input | Returns |
| --- | --- | --- | --- |
| `getProfile` | GET | — | `profile` row |
| `updateProfile` | POST | `{display_name?, base_currency?, locale?}` | `{ok}` |
| `listAccounts` | GET | — | `account[]` |
| `createAccount` | POST | `AccountInput` | `account` |
| `updateAccount` | POST | `{id, patch}` | `{ok}` |
| `deleteAccount` | POST | `{id}` | `{ok}` |
| `listCategories` | GET | — | `category[]` |
| `createCategory` | POST | `CategoryInput` | `category` |
| `deleteCategory` | POST | `{id}` | `{ok}` |
| `listTransactions` | GET | filters | `transaction[]` |
| `createTransaction` | POST | `TransactionInput` | `transaction` |
| `deleteTransaction` | POST | `{id}` | `{ok}` |
| `getDashboard` | GET | — | aggregated dashboard payload |

All input parsed by zod (`src/lib/schemas.ts`). Errors bubble as `Error` with
readable messages; the client shows them via sonner toasts.

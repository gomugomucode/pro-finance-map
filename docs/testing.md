# Testing Strategy

## v1 (this release)
- Type safety via TypeScript strict mode + zod at every server-function boundary.
- Manual QA checklist per feature: create, list, edit, delete, empty state, error state, mobile responsive.
- Postgres RLS is the primary correctness guarantee for data isolation — verified with a signed-in Playwright user in `bun run` scripts before publish.

## v1.1
- **Unit**: `vitest` for `lib/money.ts`, formatters, and zod schemas.
- **Integration**: `vitest` with a supertest-style helper hitting server functions via a real Supabase test project.
- **E2E**: Playwright flows — sign up → create account → add transaction → see dashboard update.

## v2+
- Contract tests for AI-categorization prompts.
- Load tests on the dashboard aggregate server fn using k6.
- Security scans on every migration via the built-in Lovable linter + a nightly `security--run_security_scan`.

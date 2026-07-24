-- ============================================================
-- Ledgerly v5 Migration: Import Center & Reconciliation Suite
-- ============================================================

-- 1. Import Batches (Audit Log & Rollback)
create table if not exists public.import_batches (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  filename        text        not null,
  source_format   text        not null default 'csv',
  total_rows      integer     not null default 0,
  imported_count  integer     not null default 0,
  skipped_count   integer     not null default 0,
  duplicate_count integer     not null default 0,
  status          text        not null default 'completed' check (status in ('completed','rolled_back','failed')),
  duration_ms     integer     not null default 0,
  created_at      timestamptz not null default now()
);

-- RLS for import_batches
alter table public.import_batches enable row level security;

drop policy if exists "Users can manage own import batches" on public.import_batches;
create policy "Users can manage own import batches"
  on public.import_batches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Import Mapping Profiles (Presets)
create table if not exists public.import_profiles (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  name           text        not null,
  date_format    text        not null default 'YYYY-MM-DD',
  delimiter      text        not null default ',',
  column_mapping jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

-- RLS for import_profiles
alter table public.import_profiles enable row level security;

drop policy if exists "Users can manage own import profiles" on public.import_profiles;
create policy "Users can manage own import profiles"
  on public.import_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Add import_batch_id column to transactions
alter table public.transactions add column if not exists import_batch_id uuid references public.import_batches(id) on delete set null;
create index if not exists idx_transactions_import_batch on public.transactions(import_batch_id);

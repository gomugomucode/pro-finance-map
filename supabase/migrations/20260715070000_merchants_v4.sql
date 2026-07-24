-- ============================================================
-- Ledgerly v4 Migration: Merchant Intelligence Engine
-- ============================================================

create table if not exists public.merchants (
  id                     uuid        primary key default gen_random_uuid(),
  user_id                uuid        not null references auth.users(id) on delete cascade,
  name                   text        not null,
  normalized_name        text        not null,
  default_category_id    uuid        references public.categories(id) on delete set null,
  default_account_id     uuid        references public.accounts(id) on delete set null,
  default_payment_method text,
  icon                   text,
  color                  text        default '#3B82F6',
  notes                  text,
  is_favorite            boolean     not null default false,
  is_archived            boolean     not null default false,
  visit_count            integer     not null default 1,
  total_spent_minor      bigint      not null default 0,
  last_amount_minor      bigint      not null default 0,
  last_used_at           timestamptz not null default now(),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Unique constraint per user on normalized_name
alter table public.merchants drop constraint if exists merchants_user_id_normalized_name_key;
alter table public.merchants add constraint merchants_user_id_normalized_name_key unique (user_id, normalized_name);

-- Indexes for ultra-fast autocomplete & search
create index if not exists idx_merchants_user_visit on public.merchants(user_id, visit_count desc, last_used_at desc);
create index if not exists idx_merchants_user_name on public.merchants(user_id, normalized_name);

-- Row Level Security (RLS)
alter table public.merchants enable row level security;

drop policy if exists "Users can manage own merchants" on public.merchants;
create policy "Users can manage own merchants"
  on public.merchants
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.set_merchants_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_merchants_updated_at on public.merchants;
create trigger trg_merchants_updated_at
  before update on public.merchants
  for each row execute function public.set_merchants_updated_at();

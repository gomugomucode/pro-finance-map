-- ============================================================
-- Ledgerly v6 Migration: Personal Wealth & Net Worth Platform
-- ============================================================

-- 1. Assets Table
create table if not exists public.assets (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users(id) on delete cascade,
  name                  text        not null,
  asset_type            text        not null default 'other' check (
    asset_type in (
      'cash', 'bank_deposit', 'vehicle', 'land', 'house', 'apartment',
      'office', 'gold', 'silver', 'jewelry', 'electronics', 'business',
      'stocks', 'mutual_funds', 'bonds', 'crypto', 'nft', 'collectibles', 'other'
    )
  ),
  current_value_minor   bigint      not null default 0,
  purchase_value_minor  bigint      not null default 0,
  purchase_date         date,
  currency              text        not null default 'USD',
  quantity              numeric     default 1,
  unit_cost_minor       bigint      default 0,
  symbol                text,
  location              text,
  notes                 text,
  is_active             boolean     not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_assets_user_type on public.assets(user_id, asset_type);
create index if not exists idx_assets_user_active on public.assets(user_id, is_active);

-- RLS for assets
alter table public.assets enable row level security;

drop policy if exists "Users can manage own assets" on public.assets;
create policy "Users can manage own assets"
  on public.assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Liabilities Table
create table if not exists public.liabilities (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users(id) on delete cascade,
  name                  text        not null,
  liability_type        text        not null default 'other' check (
    liability_type in (
      'credit_card', 'personal_loan', 'business_loan', 'mortgage',
      'car_loan', 'education_loan', 'tax_due', 'other'
    )
  ),
  current_balance_minor bigint      not null default 0,
  original_amount_minor bigint      not null default 0,
  interest_rate         numeric     default 0,
  due_date              date,
  institution           text,
  currency              text        not null default 'USD',
  notes                 text,
  is_active             boolean     not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_liabilities_user_type on public.liabilities(user_id, liability_type);
create index if not exists idx_liabilities_user_active on public.liabilities(user_id, is_active);

-- RLS for liabilities
alter table public.liabilities enable row level security;

drop policy if exists "Users can manage own liabilities" on public.liabilities;
create policy "Users can manage own liabilities"
  on public.liabilities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Triggers for updated_at
create or replace function public.set_wealth_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_assets_updated_at on public.assets;
create trigger trg_assets_updated_at
  before update on public.assets
  for each row execute function public.set_wealth_updated_at();

drop trigger if exists trg_liabilities_updated_at on public.liabilities;
create trigger trg_liabilities_updated_at
  before update on public.liabilities
  for each row execute function public.set_wealth_updated_at();

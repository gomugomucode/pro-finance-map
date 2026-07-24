-- Ledgerly Mobile Companion & SMS Import Engine Migration

-- 1. Create SMS Provider Rules Table
create table if not exists public.sms_provider_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider_name text not null,
  sender_pattern text not null,
  body_regex text not null,
  amount_group text default 'amount',
  merchant_group text default 'merchant',
  ref_group text default 'ref',
  type_group text default 'type',
  balance_group text default 'balance',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create Pending Imported Transactions Table (Review Buffer)
create table if not exists public.pending_imported_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'sms',
  sender text not null,
  raw_message text not null,
  extracted_amount_minor bigint not null default 0,
  extracted_merchant text,
  extracted_ref text,
  extracted_type text not null default 'expense',
  extracted_balance_minor bigint,
  extracted_date timestamptz not null default now(),
  confidence_score numeric(5,2) not null default 75.0,
  status text not null default 'pending', -- 'pending' | 'approved' | 'dismissed'
  matched_account_id uuid references public.accounts(id) on delete set null,
  matched_category_id uuid references public.categories(id) on delete set null,
  matched_merchant_id uuid references public.merchants(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- 3. Create SMS Import Settings Table
create table if not exists public.sms_import_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sms_import_enabled boolean not null default true,
  auto_notify boolean not null default true,
  min_confidence_threshold numeric(5,2) not null default 60.0,
  ignored_senders text[] default '{}',
  monitored_accounts uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Enable Row Level Security (RLS)
alter table public.sms_provider_rules enable row level security;
alter table public.pending_imported_transactions enable row level security;
alter table public.sms_import_settings enable row level security;

-- Policies for sms_provider_rules
create policy "Users can select public or own provider rules"
  on public.sms_provider_rules for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can manage own provider rules"
  on public.sms_provider_rules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own provider rules"
  on public.sms_provider_rules for update
  using (auth.uid() = user_id);

create policy "Users can delete own provider rules"
  on public.sms_provider_rules for delete
  using (auth.uid() = user_id);

-- Policies for pending_imported_transactions
create policy "Users can view own pending transactions"
  on public.pending_imported_transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own pending transactions"
  on public.pending_imported_transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pending transactions"
  on public.pending_imported_transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own pending transactions"
  on public.pending_imported_transactions for delete
  using (auth.uid() = user_id);

-- Policies for sms_import_settings
create policy "Users can view own sms settings"
  on public.sms_import_settings for select
  using (auth.uid() = user_id);

create policy "Users can manage own sms settings"
  on public.sms_import_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.sms_provider_rules to authenticated;
grant select, insert, update, delete on public.pending_imported_transactions to authenticated;
grant select, insert, update, delete on public.sms_import_settings to authenticated;

grant all on public.sms_provider_rules to service_role;
grant all on public.pending_imported_transactions to service_role;
grant all on public.sms_import_settings to service_role;

-- 5. Indexes
create index if not exists pending_txns_user_status_idx on public.pending_imported_transactions(user_id, status);
create index if not exists pending_txns_sender_idx on public.pending_imported_transactions(sender);
create index if not exists sms_rules_user_idx on public.sms_provider_rules(user_id);

-- 6. Audit Logging Trigger
drop trigger if exists audit_pending_txns_change on public.pending_imported_transactions;
create trigger audit_pending_txns_change
  after insert or update or delete on public.pending_imported_transactions
  for each row execute function public.tg_audit_log_change();

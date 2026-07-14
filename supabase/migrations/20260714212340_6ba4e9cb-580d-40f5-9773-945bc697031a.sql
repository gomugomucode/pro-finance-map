
-- ============ ENUMS ============
create type public.account_type as enum (
  'cash','bank','wallet','credit_card','debit_card','digital_wallet',
  'savings','fixed_deposit','investment','loan','business','other'
);

create type public.transaction_kind as enum ('income','expense','transfer');

create type public.category_kind as enum ('income','expense');

-- ============ PROFILES ============
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  base_currency text not null default 'USD',
  locale text not null default 'en-US',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read"   on public.profiles for select using (auth.uid() = user_id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update using (auth.uid() = user_id);
create policy "own profile delete" on public.profiles for delete using (auth.uid() = user_id);

-- ============ CURRENCIES (public reference) ============
create table public.currencies (
  code text primary key,
  name text not null,
  symbol text not null,
  decimals smallint not null default 2
);
grant select on public.currencies to anon, authenticated;
grant all on public.currencies to service_role;
alter table public.currencies enable row level security;
create policy "currencies readable" on public.currencies for select using (true);

insert into public.currencies (code, name, symbol, decimals) values
  ('USD','US Dollar','$',2),
  ('EUR','Euro','€',2),
  ('GBP','British Pound','£',2),
  ('INR','Indian Rupee','₹',2),
  ('NPR','Nepalese Rupee','रू',2),
  ('JPY','Japanese Yen','¥',0),
  ('CNY','Chinese Yuan','¥',2),
  ('AUD','Australian Dollar','A$',2),
  ('CAD','Canadian Dollar','C$',2),
  ('SGD','Singapore Dollar','S$',2),
  ('AED','UAE Dirham','د.إ',2)
on conflict (code) do nothing;

-- ============ EXCHANGE RATES ============
create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base text not null references public.currencies(code),
  quote text not null references public.currencies(code),
  rate numeric(20,10) not null check (rate > 0),
  as_of date not null default current_date,
  unique (base, quote, as_of)
);
grant select on public.exchange_rates to anon, authenticated;
grant all on public.exchange_rates to service_role;
alter table public.exchange_rates enable row level security;
create policy "rates readable" on public.exchange_rates for select using (true);

-- ============ ACCOUNTS ============
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type public.account_type not null,
  currency text not null references public.currencies(code) default 'USD',
  opening_balance_minor bigint not null default 0,
  current_balance_minor bigint not null default 0,
  credit_limit_minor bigint,
  color text default '#22D3A0',
  icon text default 'wallet',
  is_archived boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index accounts_user_idx on public.accounts(user_id);
grant select, insert, update, delete on public.accounts to authenticated;
grant all on public.accounts to service_role;
alter table public.accounts enable row level security;
create policy "own accounts read"   on public.accounts for select using (auth.uid() = user_id);
create policy "own accounts insert" on public.accounts for insert with check (auth.uid() = user_id);
create policy "own accounts update" on public.accounts for update using (auth.uid() = user_id);
create policy "own accounts delete" on public.accounts for delete using (auth.uid() = user_id);

-- ============ CATEGORIES ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind public.category_kind not null,
  parent_id uuid references public.categories(id) on delete set null,
  color text default '#22D3A0',
  icon text default 'tag',
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index categories_user_idx on public.categories(user_id);
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "own categories read"   on public.categories for select using (auth.uid() = user_id);
create policy "own categories insert" on public.categories for insert with check (auth.uid() = user_id);
create policy "own categories update" on public.categories for update using (auth.uid() = user_id);
create policy "own categories delete" on public.categories for delete using (auth.uid() = user_id);

-- ============ TRANSACTIONS ============
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.transaction_kind not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  to_account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null references public.currencies(code),
  fx_rate numeric(20,10) not null default 1,
  base_amount_minor bigint not null default 0,
  occurred_at timestamptz not null default now(),
  description text,
  merchant text,
  location text,
  notes text,
  transfer_group_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transactions_user_idx on public.transactions(user_id);
create index transactions_account_idx on public.transactions(account_id);
create index transactions_occurred_idx on public.transactions(user_id, occurred_at desc);
create index transactions_transfer_group_idx on public.transactions(transfer_group_id);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "own tx read"   on public.transactions for select using (auth.uid() = user_id);
create policy "own tx insert" on public.transactions for insert with check (auth.uid() = user_id);
create policy "own tx update" on public.transactions for update using (auth.uid() = user_id);
create policy "own tx delete" on public.transactions for delete using (auth.uid() = user_id);

-- ============ TAGS ============
create table public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag text not null,
  primary key (transaction_id, tag)
);
grant select, insert, update, delete on public.transaction_tags to authenticated;
grant all on public.transaction_tags to service_role;
alter table public.transaction_tags enable row level security;
create policy "own tags all" on public.transaction_tags for all
  using (exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()));

-- ============ SPLITS ============
create table public.transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount_minor bigint not null,
  note text
);
grant select, insert, update, delete on public.transaction_splits to authenticated;
grant all on public.transaction_splits to service_role;
alter table public.transaction_splits enable row level security;
create policy "own splits all" on public.transaction_splits for all
  using (exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()));

-- ============ ATTACHMENTS (schema only) ============
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  storage_path text not null,
  mime text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.attachments to authenticated;
grant all on public.attachments to service_role;
alter table public.attachments enable row level security;
create policy "own attachments all" on public.attachments for all
  using (exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()));

-- ============ AUDIT LOG ============
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  entity text not null,
  entity_id uuid,
  action text not null,
  diff jsonb,
  at timestamptz not null default now()
);
create index audit_logs_user_idx on public.audit_logs(user_id, at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "own audit read" on public.audit_logs for select using (auth.uid() = user_id);

-- ============ TIMESTAMP TRIGGER ============
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch     before update on public.profiles     for each row execute function public.tg_touch_updated_at();
create trigger accounts_touch     before update on public.accounts     for each row execute function public.tg_touch_updated_at();
create trigger transactions_touch before update on public.transactions for each row execute function public.tg_touch_updated_at();

-- ============ BALANCE MAINTENANCE ============
-- Recomputes an account's current_balance from opening_balance + tx effects.
create or replace function public.recompute_account_balance(_account_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_opening bigint; v_delta bigint;
begin
  select opening_balance_minor into v_opening from public.accounts where id = _account_id;
  if v_opening is null then return; end if;
  select coalesce(sum(
    case
      when kind = 'income'  and account_id = _account_id then amount_minor
      when kind = 'expense' and account_id = _account_id then -amount_minor
      when kind = 'transfer' and account_id = _account_id then -amount_minor
      when kind = 'transfer' and to_account_id = _account_id then amount_minor
      else 0
    end
  ),0) into v_delta from public.transactions where account_id = _account_id or to_account_id = _account_id;
  update public.accounts set current_balance_minor = v_opening + v_delta where id = _account_id;
end $$;

create or replace function public.tg_transactions_balance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_account_balance(old.account_id);
    if old.to_account_id is not null then perform public.recompute_account_balance(old.to_account_id); end if;
    return old;
  end if;
  perform public.recompute_account_balance(new.account_id);
  if new.to_account_id is not null then perform public.recompute_account_balance(new.to_account_id); end if;
  if tg_op = 'UPDATE' then
    if old.account_id is distinct from new.account_id then perform public.recompute_account_balance(old.account_id); end if;
    if old.to_account_id is not null and old.to_account_id is distinct from new.to_account_id then
      perform public.recompute_account_balance(old.to_account_id);
    end if;
  end if;
  return new;
end $$;

create trigger transactions_balance_aiud
after insert or update or delete on public.transactions
for each row execute function public.tg_transactions_balance();

-- Also recompute when opening balance changes
create or replace function public.tg_accounts_opening()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or old.opening_balance_minor is distinct from new.opening_balance_minor then
    perform public.recompute_account_balance(new.id);
  end if;
  return new;
end $$;

create trigger accounts_opening_aiu
after insert or update of opening_balance_minor on public.accounts
for each row execute function public.tg_accounts_opening();

-- ============ NEW USER BOOTSTRAP: profile + default categories ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (user_id) do nothing;

  -- default expense categories
  insert into public.categories (user_id, name, kind, color, icon) values
    (new.id,'Food & Dining','expense','#F97316','utensils'),
    (new.id,'Groceries','expense','#10B981','shopping-basket'),
    (new.id,'Transport','expense','#3B82F6','car'),
    (new.id,'Fuel','expense','#EF4444','fuel'),
    (new.id,'Rent','expense','#A855F7','home'),
    (new.id,'Utilities','expense','#EAB308','plug'),
    (new.id,'Internet & Phone','expense','#06B6D4','wifi'),
    (new.id,'Health','expense','#EC4899','heart-pulse'),
    (new.id,'Shopping','expense','#F59E0B','shopping-bag'),
    (new.id,'Entertainment','expense','#8B5CF6','film'),
    (new.id,'Subscriptions','expense','#14B8A6','repeat'),
    (new.id,'Education','expense','#6366F1','book-open'),
    (new.id,'Travel','expense','#0EA5E9','plane'),
    (new.id,'Taxes','expense','#DC2626','landmark'),
    (new.id,'Other Expense','expense','#64748B','circle');

  -- default income categories
  insert into public.categories (user_id, name, kind, color, icon) values
    (new.id,'Salary','income','#22D3A0','briefcase'),
    (new.id,'Freelance','income','#4ADE80','laptop'),
    (new.id,'Business','income','#34D399','store'),
    (new.id,'Investment','income','#60A5FA','trending-up'),
    (new.id,'Interest','income','#A78BFA','percent'),
    (new.id,'Gift','income','#F472B6','gift'),
    (new.id,'Refund','income','#FBBF24','undo-2'),
    (new.id,'Other Income','income','#94A3B8','circle');

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- Ledgerly v3 Migration
-- Phase 0 fix: balance trigger + new enums + all new modules
-- ============================================================

-- ============ PHASE 0: FIX BALANCE TRIGGER ============
-- Exclude soft-deleted transactions from balance computation
create or replace function public.recompute_account_balance(_account_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_opening bigint; v_delta bigint;
begin
  select opening_balance_minor into v_opening from public.accounts where id = _account_id;
  if v_opening is null then return; end if;
  select coalesce(sum(
    case
      when kind = 'income'   and account_id    = _account_id then  amount_minor
      when kind = 'expense'  and account_id    = _account_id then -amount_minor
      when kind = 'transfer' and account_id    = _account_id then -amount_minor
      when kind = 'transfer' and to_account_id = _account_id then  amount_minor
      else 0
    end
  ),0) into v_delta
  from public.transactions
  where (account_id = _account_id or to_account_id = _account_id)
    and deleted_at is null;
  update public.accounts set current_balance_minor = v_opening + v_delta where id = _account_id;
end $$;

-- ============ NEW ENUMS ============
do $$ begin
  create type public.recurrence_frequency as enum (
    'daily','weekly','biweekly','monthly','quarterly','yearly','custom'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'budget_alert','bill_reminder','subscription_reminder',
    'loan_overdue','goal_reminder','low_balance','large_expense'
  );
exception when duplicate_object then null; end $$;

-- ============ PROFILE: new preference columns ============
alter table public.profiles add column if not exists date_format   text    not null default 'MM/DD/YYYY';
alter table public.profiles add column if not exists number_format text    not null default 'en-US';
alter table public.profiles add column if not exists notification_prefs jsonb not null default '{}';

-- ============ BUDGETS ============
create table if not exists public.budgets (
  id            uuid    primary key default gen_random_uuid(),
  user_id       uuid    not null references auth.users(id) on delete cascade,
  name          text    not null,
  period_type   text    not null check (period_type in ('weekly','monthly','yearly','custom')),
  amount_minor  bigint  not null check (amount_minor > 0),
  currency      text    not null references public.currencies(code) default 'USD',
  rollover      boolean not null default false,
  is_active     boolean not null default true,
  start_date    date    not null,
  end_date      date,
  created_at    timestamptz not null default now()
);
create index if not exists budgets_user_idx on public.budgets(user_id);
alter table public.budgets enable row level security;
create policy "own budgets read"   on public.budgets for select using (auth.uid() = user_id);
create policy "own budgets insert" on public.budgets for insert with check (auth.uid() = user_id);
create policy "own budgets update" on public.budgets for update using (auth.uid() = user_id);
create policy "own budgets delete" on public.budgets for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.budgets to authenticated;
grant all on public.budgets to service_role;

create table if not exists public.budget_categories (
  budget_id   uuid not null references public.budgets(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (budget_id, category_id)
);
alter table public.budget_categories enable row level security;
create policy "own budget_categories all" on public.budget_categories for all
  using (exists (select 1 from public.budgets b where b.id = budget_id and b.user_id = auth.uid()))
  with check (exists (select 1 from public.budgets b where b.id = budget_id and b.user_id = auth.uid()));
grant select, insert, update, delete on public.budget_categories to authenticated;
grant all on public.budget_categories to service_role;

create table if not exists public.budget_periods (
  id                  uuid    primary key default gen_random_uuid(),
  budget_id           uuid    not null references public.budgets(id) on delete cascade,
  period_start        date    not null,
  period_end          date    not null,
  spent_minor         bigint  not null default 0,
  carried_over_minor  bigint  not null default 0,
  created_at          timestamptz not null default now(),
  unique (budget_id, period_start)
);
alter table public.budget_periods enable row level security;
create policy "own budget_periods all" on public.budget_periods for all
  using (exists (select 1 from public.budgets b where b.id = budget_id and b.user_id = auth.uid()))
  with check (exists (select 1 from public.budgets b where b.id = budget_id and b.user_id = auth.uid()));
grant select, insert, update, delete on public.budget_periods to authenticated;
grant all on public.budget_periods to service_role;

-- ============ SAVINGS GOALS ============
create table if not exists public.savings_goals (
  id             uuid    primary key default gen_random_uuid(),
  user_id        uuid    not null references auth.users(id) on delete cascade,
  name           text    not null,
  icon           text    not null default 'piggy-bank',
  color          text    not null default '#22D3A0',
  target_minor   bigint  not null check (target_minor > 0),
  current_minor  bigint  not null default 0,
  currency       text    not null references public.currencies(code) default 'USD',
  deadline       date,
  account_id     uuid    references public.accounts(id) on delete set null,
  is_completed   boolean not null default false,
  notes          text,
  created_at     timestamptz not null default now()
);
create index if not exists savings_goals_user_idx on public.savings_goals(user_id);
alter table public.savings_goals enable row level security;
create policy "own savings_goals read"   on public.savings_goals for select using (auth.uid() = user_id);
create policy "own savings_goals insert" on public.savings_goals for insert with check (auth.uid() = user_id);
create policy "own savings_goals update" on public.savings_goals for update using (auth.uid() = user_id);
create policy "own savings_goals delete" on public.savings_goals for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.savings_goals to authenticated;
grant all on public.savings_goals to service_role;

create table if not exists public.savings_contributions (
  id           uuid    primary key default gen_random_uuid(),
  goal_id      uuid    not null references public.savings_goals(id) on delete cascade,
  amount_minor bigint  not null,
  note         text,
  occurred_at  timestamptz not null default now()
);
alter table public.savings_contributions enable row level security;
create policy "own savings_contributions all" on public.savings_contributions for all
  using (exists (select 1 from public.savings_goals sg where sg.id = goal_id and sg.user_id = auth.uid()))
  with check (exists (select 1 from public.savings_goals sg where sg.id = goal_id and sg.user_id = auth.uid()));
grant select, insert, update, delete on public.savings_contributions to authenticated;
grant all on public.savings_contributions to service_role;

-- ============ CONTACTS ============
create table if not exists public.contacts (
  id         uuid    primary key default gen_random_uuid(),
  user_id    uuid    not null references auth.users(id) on delete cascade,
  name       text    not null,
  phone      text,
  email      text,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists contacts_user_idx on public.contacts(user_id);
alter table public.contacts enable row level security;
create policy "own contacts read"   on public.contacts for select using (auth.uid() = user_id);
create policy "own contacts insert" on public.contacts for insert with check (auth.uid() = user_id);
create policy "own contacts update" on public.contacts for update using (auth.uid() = user_id);
create policy "own contacts delete" on public.contacts for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.contacts to authenticated;
grant all on public.contacts to service_role;

-- ============ LOANS ============
create table if not exists public.loans (
  id               uuid    primary key default gen_random_uuid(),
  user_id          uuid    not null references auth.users(id) on delete cascade,
  contact_id       uuid    references public.contacts(id) on delete set null,
  direction        text    not null check (direction in ('borrowed','lent')),
  principal_minor  bigint  not null check (principal_minor > 0),
  paid_minor       bigint  not null default 0,
  interest_rate    numeric(6,4) not null default 0,
  currency         text    not null references public.currencies(code) default 'USD',
  due_date         date,
  description      text,
  is_settled       boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists loans_user_idx on public.loans(user_id);
alter table public.loans enable row level security;
create policy "own loans read"   on public.loans for select using (auth.uid() = user_id);
create policy "own loans insert" on public.loans for insert with check (auth.uid() = user_id);
create policy "own loans update" on public.loans for update using (auth.uid() = user_id);
create policy "own loans delete" on public.loans for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.loans to authenticated;
grant all on public.loans to service_role;

create table if not exists public.loan_payments (
  id           uuid    primary key default gen_random_uuid(),
  loan_id      uuid    not null references public.loans(id) on delete cascade,
  amount_minor bigint  not null check (amount_minor > 0),
  paid_at      timestamptz not null default now(),
  note         text
);
alter table public.loan_payments enable row level security;
create policy "own loan_payments all" on public.loan_payments for all
  using (exists (select 1 from public.loans l where l.id = loan_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.loans l where l.id = loan_id and l.user_id = auth.uid()));
grant select, insert, update, delete on public.loan_payments to authenticated;
grant all on public.loan_payments to service_role;

-- Trigger: update paid_minor on loan when payment inserted/deleted
create or replace function public.tg_update_loan_paid()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    update public.loans
      set paid_minor = coalesce((select sum(amount_minor) from public.loan_payments where loan_id = old.loan_id), 0)
      where id = old.loan_id;
    return old;
  else
    update public.loans
      set paid_minor = coalesce((select sum(amount_minor) from public.loan_payments where loan_id = new.loan_id), 0)
      where id = new.loan_id;
    return new;
  end if;
end $$;

drop trigger if exists loan_payments_update_paid on public.loan_payments;
create trigger loan_payments_update_paid
after insert or delete on public.loan_payments
for each row execute function public.tg_update_loan_paid();

-- ============ RECURRING TRANSACTIONS ============
create table if not exists public.recurring_transactions (
  id                uuid    primary key default gen_random_uuid(),
  user_id           uuid    not null references auth.users(id) on delete cascade,
  name              text    not null,
  kind              public.transaction_kind not null,
  account_id        uuid    not null references public.accounts(id) on delete cascade,
  to_account_id     uuid    references public.accounts(id) on delete set null,
  category_id       uuid    references public.categories(id) on delete set null,
  amount_minor      bigint  not null check (amount_minor > 0),
  currency          text    not null references public.currencies(code),
  frequency         public.recurrence_frequency not null,
  interval_days     integer,
  start_date        date    not null,
  end_date          date,
  next_due_date     date    not null,
  last_executed_at  timestamptz,
  is_paused         boolean not null default false,
  auto_create       boolean not null default false,
  description       text,
  created_at        timestamptz not null default now()
);
create index if not exists recurring_user_idx on public.recurring_transactions(user_id);
create index if not exists recurring_due_idx on public.recurring_transactions(next_due_date) where is_paused = false;
alter table public.recurring_transactions enable row level security;
create policy "own recurring read"   on public.recurring_transactions for select using (auth.uid() = user_id);
create policy "own recurring insert" on public.recurring_transactions for insert with check (auth.uid() = user_id);
create policy "own recurring update" on public.recurring_transactions for update using (auth.uid() = user_id);
create policy "own recurring delete" on public.recurring_transactions for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.recurring_transactions to authenticated;
grant all on public.recurring_transactions to service_role;

-- ============ SUBSCRIPTIONS ============
create table if not exists public.subscriptions (
  id                   uuid    primary key default gen_random_uuid(),
  user_id              uuid    not null references auth.users(id) on delete cascade,
  name                 text    not null,
  provider_icon        text,
  color                text    not null default '#22D3A0',
  amount_minor         bigint  not null check (amount_minor > 0),
  currency             text    not null references public.currencies(code) default 'USD',
  billing_cycle        text    not null check (billing_cycle in ('weekly','monthly','yearly')),
  next_renewal_date    date    not null,
  account_id           uuid    references public.accounts(id) on delete set null,
  category_id          uuid    references public.categories(id) on delete set null,
  is_active            boolean not null default true,
  reminder_days_before integer not null default 3,
  notes                text,
  created_at           timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id);
alter table public.subscriptions enable row level security;
create policy "own subscriptions read"   on public.subscriptions for select using (auth.uid() = user_id);
create policy "own subscriptions insert" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "own subscriptions update" on public.subscriptions for update using (auth.uid() = user_id);
create policy "own subscriptions delete" on public.subscriptions for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;

-- ============ NOTIFICATIONS ============
create table if not exists public.notifications (
  id          uuid    primary key default gen_random_uuid(),
  user_id     uuid    not null references auth.users(id) on delete cascade,
  type        public.notification_type not null,
  title       text    not null,
  body        text,
  entity_type text,
  entity_id   uuid,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id) where is_read = false;
alter table public.notifications enable row level security;
create policy "own notifications read"   on public.notifications for select using (auth.uid() = user_id);
create policy "own notifications insert" on public.notifications for insert with check (auth.uid() = user_id);
create policy "own notifications update" on public.notifications for update using (auth.uid() = user_id);
create policy "own notifications delete" on public.notifications for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

-- ============ AUDIT TRIGGERS ON NEW TABLES ============
drop trigger if exists audit_budgets on public.budgets;
create trigger audit_budgets
after insert or update or delete on public.budgets
for each row execute function public.tg_audit_log_change();

drop trigger if exists audit_savings_goals on public.savings_goals;
create trigger audit_savings_goals
after insert or update or delete on public.savings_goals
for each row execute function public.tg_audit_log_change();

drop trigger if exists audit_loans on public.loans;
create trigger audit_loans
after insert or update or delete on public.loans
for each row execute function public.tg_audit_log_change();

drop trigger if exists audit_recurring on public.recurring_transactions;
create trigger audit_recurring
after insert or update or delete on public.recurring_transactions
for each row execute function public.tg_audit_log_change();

drop trigger if exists audit_subscriptions on public.subscriptions;
create trigger audit_subscriptions
after insert or update or delete on public.subscriptions
for each row execute function public.tg_audit_log_change();

-- ============ PERFORMANCE INDEXES ============
create index if not exists transactions_category_idx on public.transactions(user_id, category_id) where deleted_at is null;
create index if not exists transactions_kind_idx on public.transactions(user_id, kind) where deleted_at is null;
create index if not exists transactions_merchant_idx on public.transactions using gin(to_tsvector('simple', coalesce(merchant,''))) where deleted_at is null;

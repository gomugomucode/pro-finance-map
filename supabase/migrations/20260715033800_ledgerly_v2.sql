-- Alter accounts table
alter table public.accounts add column if not exists is_frozen boolean not null default false;
alter table public.accounts add column if not exists is_hidden boolean not null default false;
alter table public.accounts add column if not exists is_favorite boolean not null default false;
alter table public.accounts add column if not exists sort_order integer not null default 0;

-- Alter transactions table
alter table public.transactions add column if not exists payment_method text;
alter table public.transactions add column if not exists reference_number text;
alter table public.transactions add column if not exists is_favorite boolean not null default false;
alter table public.transactions add column if not exists deleted_at timestamptz;
alter table public.transactions add column if not exists reconciled boolean not null default false;
alter table public.transactions add column if not exists reconciled_at timestamptz;

-- Add index for soft-delete filtering
create index if not exists transactions_deleted_idx on public.transactions(user_id, deleted_at);

-- Create transaction templates table
create table if not exists public.transaction_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind public.transaction_kind not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  to_account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount_minor bigint not null default 0,
  description text,
  merchant text,
  notes text,
  tags text[],
  created_at timestamptz not null default now()
);

-- Enable RLS on templates
alter table public.transaction_templates enable row level security;
create policy "own templates read"   on public.transaction_templates for select using (auth.uid() = user_id);
create policy "own templates insert" on public.transaction_templates for insert with check (auth.uid() = user_id);
create policy "own templates update" on public.transaction_templates for update using (auth.uid() = user_id);
create policy "own templates delete" on public.transaction_templates for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.transaction_templates to authenticated;
grant all on public.transaction_templates to service_role;

-- Audit logging trigger setup
create or replace function public.tg_audit_log_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_entity text;
  v_entity_id uuid;
  v_action text;
  v_diff jsonb;
  v_user_id uuid;
begin
  v_entity := tg_table_name;
  
  if tg_op = 'INSERT' then
    v_entity_id := new.id;
    v_action := 'INSERT';
    v_diff := to_jsonb(new);
    begin
      v_user_id := new.user_id;
    exception when others then
      v_user_id := auth.uid();
    end;
  elsif tg_op = 'UPDATE' then
    v_entity_id := new.id;
    v_action := 'UPDATE';
    v_diff := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
    begin
      v_user_id := new.user_id;
    exception when others then
      v_user_id := auth.uid();
    end;
  elsif tg_op = 'DELETE' then
    v_entity_id := old.id;
    v_action := 'DELETE';
    v_diff := to_jsonb(old);
    begin
      v_user_id := old.user_id;
    exception when others then
      v_user_id := auth.uid();
    end;
  end if;

  if v_user_id is null then
    v_user_id := auth.uid();
  end if;

  if v_user_id is not null then
    insert into public.audit_logs (user_id, entity, entity_id, action, diff, at)
    values (v_user_id, v_entity, v_entity_id, v_action, v_diff, now());
  end if;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end $$;

-- Triggers for accounts, categories, transactions, templates
drop trigger if exists audit_accounts on public.accounts;
create trigger audit_accounts
after insert or update or delete on public.accounts
for each row execute function public.tg_audit_log_change();

drop trigger if exists audit_categories on public.categories;
create trigger audit_categories
after insert or update or delete on public.categories
for each row execute function public.tg_audit_log_change();

drop trigger if exists audit_transactions on public.transactions;
create trigger audit_transactions
after insert or update or delete on public.transactions
for each row execute function public.tg_audit_log_change();

revoke execute on function public.tg_audit_log_change() from public, anon, authenticated;

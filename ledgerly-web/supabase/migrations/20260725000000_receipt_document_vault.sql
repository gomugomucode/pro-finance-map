-- Ledgerly Document & Receipt Vault Migration

-- 1. Create Enums
do $$ begin
  create type public.document_type as enum (
    'receipt',
    'invoice',
    'bill',
    'warranty',
    'tax',
    'statement',
    'insurance',
    'manual',
    'registration',
    'photo',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.ocr_status as enum (
    'unprocessed',
    'pending',
    'completed',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

-- 2. Create Documents Table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  loan_id uuid references public.loans(id) on delete set null,
  merchant_id uuid references public.merchants(id) on delete set null,
  
  document_type public.document_type not null default 'receipt',
  filename text not null,
  mime_type text not null,
  file_size bigint not null default 0,
  storage_path text not null,
  thumbnail_path text,
  
  tags text[] default '{}',
  notes text,
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  
  -- OCR Foundation Fields
  ocr_status public.ocr_status not null default 'unprocessed',
  ocr_confidence numeric(5,2),
  extracted_merchant text,
  extracted_date date,
  extracted_total numeric(12,2),
  extracted_tax numeric(12,2),
  extracted_category text,
  extracted_raw_text text,
  ocr_provider text default 'ledgerly_local_ocr',
  ocr_processed_at timestamptz,

  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.documents enable row level security;

create policy "Users can view their own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.documents to authenticated;
grant all on public.documents to service_role;

-- 4. Create Performance Indexes
create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists documents_transaction_id_idx on public.documents(transaction_id);
create index if not exists documents_asset_id_idx on public.documents(asset_id);
create index if not exists documents_loan_id_idx on public.documents(loan_id);
create index if not exists documents_merchant_id_idx on public.documents(merchant_id);
create index if not exists documents_type_idx on public.documents(user_id, document_type);
create index if not exists documents_favorite_idx on public.documents(user_id, is_favorite);
create index if not exists documents_archived_idx on public.documents(user_id, is_archived);

-- 5. Storage Bucket Configuration for Receipts & Financial Documents
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "Authenticated Users Access Own Receipt Storage Objects"
  on storage.objects for all
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Audit Trigger
drop trigger if exists audit_documents_change on public.documents;
create trigger audit_documents_change
  after insert or update or delete on public.documents
  for each row execute function public.tg_audit_log_change();

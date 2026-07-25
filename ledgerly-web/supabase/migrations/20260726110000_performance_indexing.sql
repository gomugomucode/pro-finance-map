-- Creating composite performance indexes for transaction history ledgers
create index if not exists idx_transactions_user_occurred_at
  on public.transactions(user_id, occurred_at desc);

create index if not exists idx_transactions_user_account_id
  on public.transactions(user_id, account_id);

create index if not exists idx_loan_payments_loan_id_paid_at
  on public.loan_payments(loan_id, paid_at desc);

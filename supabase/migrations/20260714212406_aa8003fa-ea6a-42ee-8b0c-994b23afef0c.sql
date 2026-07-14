
revoke execute on function public.recompute_account_balance(uuid) from public, anon, authenticated;
revoke execute on function public.tg_transactions_balance() from public, anon, authenticated;
revoke execute on function public.tg_accounts_opening() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.tg_touch_updated_at() from public, anon, authenticated;

-- Ledgerly Disaster Recovery & Migration Rollback Strategy

-- 1. Secret & Key Rotation Procedure
-- Execute via Supabase Management API or Console:
-- Step 1: Rotate JWT Secret in API Settings
-- Step 2: Invalidate existing Refresh Tokens:
UPDATE auth.sessions SET not_after = NOW();

-- 2. Transaction Rollback Safety Guard
BEGIN;

-- Emergency schema rollback trigger example:
-- DROP INDEX IF EXISTS idx_transactions_user_date;
-- ALTER TABLE public.transactions DROP COLUMN IF EXISTS temp_migrated_col;

COMMIT;

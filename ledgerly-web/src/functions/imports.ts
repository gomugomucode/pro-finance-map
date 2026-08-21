import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { importProfileInput } from "@/lib/schemas";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type ImportBatchRow = Database["public"]["Tables"]["import_batches"]["Row"];
export type ImportProfileRow = Database["public"]["Tables"]["import_profiles"]["Row"];

export const listImportBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("import_batches")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ImportBatchRow[];
  });

export const createImportBatchRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z
      .object({
        filename: z.string(),
        source_format: z.string().default("csv"),
        total_rows: z.number().int(),
        imported_count: z.number().int(),
        skipped_count: z.number().int().default(0),
        duplicate_count: z.number().int().default(0),
        duration_ms: z.number().int().default(0),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("import_batches")
      .insert({ ...data, user_id: context.userId, status: "completed" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as ImportBatchRow;
  });

export const rollbackImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ batchId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error: delErr } = await context.supabase
      .from("transactions")
      .delete()
      .eq("import_batch_id", data.batchId)
      .eq("user_id", context.userId);
    if (delErr) throw new Error(delErr.message);

    const { error: updateErr } = await context.supabase
      .from("import_batches")
      .update({ status: "rolled_back" })
      .eq("id", data.batchId)
      .eq("user_id", context.userId);
    if (updateErr) throw new Error(updateErr.message);

    return { ok: true };
  });

export const listImportProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("import_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ImportProfileRow[];
  });

export const createImportProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => importProfileInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("import_profiles")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as ImportProfileRow;
  });

export const deleteImportProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("import_profiles")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reconcileAccountBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z
      .object({
        account_id: z.string().uuid(),
        expected_balance_minor: z.number().int(),
        createAdjustmentTransaction: z.boolean().default(true),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: account, error: accErr } = await context.supabase
      .from("accounts")
      .select("id, name, currency, current_balance_minor")
      .eq("id", data.account_id)
      .eq("user_id", context.userId)
      .single();
    if (accErr || !account) throw new Error("Account not found.");

    const currentBalance = Number(account.current_balance_minor || 0);
    const discrepancyMinor = data.expected_balance_minor - currentBalance;

    if (discrepancyMinor === 0) {
      return { ok: true, discrepancyMinor: 0, adjustmentCreated: false };
    }

    if (data.createAdjustmentTransaction) {
      const isIncome = discrepancyMinor > 0;
      await context.supabase.from("transactions").insert({
        user_id: context.userId,
        account_id: data.account_id,
        kind: isIncome ? "income" : "expense",
        amount_minor: Math.abs(discrepancyMinor),
        currency: account.currency,
        base_amount_minor: Math.abs(discrepancyMinor),
        occurred_at: new Date().toISOString(),
        description: `Balance Reconciliation Adjustment for ${account.name}`,
        reconciled: true,
      });
    }

    return { ok: true, discrepancyMinor, adjustmentCreated: data.createAdjustmentTransaction };
  });

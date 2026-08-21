import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recurringTransactionInput } from "@/lib/schemas";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type RecurringTransactionRow = Database["public"]["Tables"]["recurring_transactions"]["Row"];

export const listRecurringTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", context.userId)
      .order("next_due_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as RecurringTransactionRow[];
  });

export const createRecurringTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => recurringTransactionInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("recurring_transactions")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as RecurringTransactionRow;
  });

export const updateRecurringTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: recurringTransactionInput.partial() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("recurring_transactions")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRecurringTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const executeRecurringTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: rec } = await context.supabase
      .from("recurring_transactions")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (!rec) throw new Error("Recurring transaction not found.");

    const { error: txErr } = await context.supabase.from("transactions").insert({
      user_id: context.userId,
      kind: rec.kind,
      account_id: rec.account_id,
      to_account_id: rec.to_account_id ?? null,
      category_id: rec.category_id ?? null,
      amount_minor: rec.amount_minor,
      currency: rec.currency,
      base_amount_minor: rec.amount_minor,
      occurred_at: new Date().toISOString(),
      description: rec.description ?? rec.name,
    });
    if (txErr) throw new Error(txErr.message);

    const advance = (date: string, freq: string, intervalDays: number | null): string => {
      const d = new Date(date);
      if (freq === "daily") d.setDate(d.getDate() + 1);
      else if (freq === "weekly") d.setDate(d.getDate() + 7);
      else if (freq === "biweekly") d.setDate(d.getDate() + 14);
      else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
      else if (freq === "quarterly") d.setMonth(d.getMonth() + 3);
      else if (freq === "yearly") d.setFullYear(d.getFullYear() + 1);
      else if (freq === "custom" && intervalDays) d.setDate(d.getDate() + intervalDays);
      return d.toISOString().slice(0, 10);
    };
    const nextDue = advance(rec.next_due_date, rec.frequency, rec.interval_days);
    await context.supabase
      .from("recurring_transactions")
      .update({ next_due_date: nextDue, last_executed_at: new Date().toISOString() })
      .eq("id", data.id);

    return { ok: true, next_due_date: nextDue };
  });

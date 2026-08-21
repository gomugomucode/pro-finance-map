import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { budgetInput } from "@/lib/schemas";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];

export interface BudgetWithUsage extends BudgetRow {
  spent_minor: number;
  remaining_minor: number;
  carried_over_minor: number;
  percent: number;
  period_start: string;
  period_end: string;
  category_ids: string[];
}

export const listBudgets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date().toISOString().slice(0, 10);
    const [{ data: budgets, error: bErr }, { data: budgetCats, error: bcErr }] = await Promise.all([
      context.supabase
        .from("budgets")
        .select("*")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false }),
      context.supabase.from("budget_categories").select("*"),
    ]);

    if (bErr) throw new Error(bErr.message);
    if (bcErr) throw new Error(bcErr.message);

    const budgetCatMap = new Map<string, string[]>();
    for (const bc of budgetCats ?? []) {
      const list = budgetCatMap.get(bc.budget_id) ?? [];
      list.push(bc.category_id);
      budgetCatMap.set(bc.budget_id, list);
    }

    const result: BudgetWithUsage[] = await Promise.all(
      (budgets ?? []).map(async (b) => {
        const categoryIds = budgetCatMap.get(b.id) ?? [];

        let periodStart: string;
        let periodEnd: string;
        const d = new Date(now);
        if (b.period_type === "monthly") {
          periodStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
          periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
        } else if (b.period_type === "weekly") {
          const day = d.getDay();
          const monday = new Date(d);
          monday.setDate(d.getDate() - day + 1);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          periodStart = monday.toISOString().slice(0, 10);
          periodEnd = sunday.toISOString().slice(0, 10);
        } else if (b.period_type === "yearly") {
          periodStart = `${d.getFullYear()}-01-01`;
          periodEnd = `${d.getFullYear()}-12-31`;
        } else {
          periodStart = b.start_date;
          periodEnd = b.end_date ?? now;
        }

        let q = context.supabase
          .from("transactions")
          .select("amount_minor")
          .eq("user_id", context.userId)
          .eq("kind", "expense")
          .is("deleted_at", null)
          .gte("occurred_at", periodStart)
          .lte("occurred_at", periodEnd + "T23:59:59");

        if (categoryIds.length > 0) {
          q = q.in("category_id", categoryIds);
        }

        const { data: txns } = await q;
        const spent_minor = (txns ?? []).reduce((s, t) => s + Number(t.amount_minor), 0);
        const amountMinor = Number(b.amount_minor || 0);
        const remaining_minor = Math.max(0, amountMinor - spent_minor);
        const percent =
          amountMinor > 0 ? Math.min(100, Math.round((spent_minor / amountMinor) * 100)) : 0;

        return {
          ...b,
          spent_minor,
          remaining_minor,
          carried_over_minor: 0,
          percent,
          period_start: periodStart,
          period_end: periodEnd,
          category_ids: categoryIds,
        };
      }),
    );
    return result;
  });

export const createBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => budgetInput.parse(v))
  .handler(async ({ data, context }) => {
    const { category_ids, ...budgetData } = data;
    const { data: row, error } = await context.supabase
      .from("budgets")
      .insert({ ...budgetData, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (category_ids && category_ids.length > 0 && row) {
      const { error: catErr } = await context.supabase
        .from("budget_categories")
        .insert(category_ids.map((cid) => ({ budget_id: row.id, category_id: cid })));
      if (catErr) throw new Error(catErr.message);
    }
    return row as BudgetRow;
  });

export const updateBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: budgetInput.partial() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { category_ids, ...patch } = data.patch;
    const { error } = await context.supabase
      .from("budgets")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    if (category_ids !== undefined) {
      await context.supabase.from("budget_categories").delete().eq("budget_id", data.id);
      if (category_ids.length > 0) {
        await context.supabase
          .from("budget_categories")
          .insert(category_ids.map((cid) => ({ budget_id: data.id, category_id: cid })));
      }
    }
    return { ok: true };
  });

export const deleteBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("budgets")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

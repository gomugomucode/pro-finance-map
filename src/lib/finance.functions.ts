import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  accountInput,
  categoryInput,
  transactionInput,
  listTransactionsInput,
} from "./schemas";
import { z } from "zod";

/* ============ PROFILE ============ */

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        display_name: z.string().trim().max(60).optional(),
        base_currency: z.string().length(3).optional(),
        locale: z.string().max(20).optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ ACCOUNTS ============ */

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("accounts")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => accountInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("accounts")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: accountInput.partial() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("accounts")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("accounts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ CATEGORIES ============ */

export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("categories")
      .select("*")
      .eq("user_id", context.userId)
      .order("kind", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => categoryInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("categories")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("categories")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ TRANSACTIONS ============ */

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => listTransactionsInput.parse(v ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("transactions")
      .select("*")
      .eq("user_id", context.userId)
      .order("occurred_at", { ascending: false })
      .limit(data.limit);
    if (data.from) q = q.gte("occurred_at", data.from);
    if (data.to) q = q.lte("occurred_at", data.to);
    if (data.account_id)
      q = q.or(`account_id.eq.${data.account_id},to_account_id.eq.${data.account_id}`);
    if (data.category_id) q = q.eq("category_id", data.category_id);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.search) q = q.ilike("description", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => transactionInput.parse(v))
  .handler(async ({ data, context }) => {
    if (data.kind === "transfer") {
      if (!data.to_account_id || data.to_account_id === data.account_id) {
        throw new Error("Transfer requires a different destination account.");
      }
      const { error } = await context.supabase.from("transactions").insert({
        user_id: context.userId,
        kind: "transfer",
        account_id: data.account_id,
        to_account_id: data.to_account_id,
        amount_minor: data.amount_minor,
        currency: data.currency,
        base_amount_minor: data.amount_minor,
        occurred_at: data.occurred_at,
        description: data.description ?? "Transfer",
        transfer_group_id: crypto.randomUUID(),
      });
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { data: row, error } = await context.supabase
      .from("transactions")
      .insert({
        user_id: context.userId,
        kind: data.kind,
        account_id: data.account_id,
        category_id: data.category_id ?? null,
        amount_minor: data.amount_minor,
        currency: data.currency,
        base_amount_minor: data.amount_minor,
        occurred_at: data.occurred_at,
        description: data.description ?? null,
        merchant: data.merchant ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (row && data.tags && data.tags.length) {
      await context.supabase
        .from("transaction_tags")
        .insert(data.tags.map((tag) => ({ transaction_id: row.id, tag })));
    }
    return row;
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("transactions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ DASHBOARD AGGREGATES ============ */

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    const [{ data: accounts }, { data: txns }, { data: recent }] = await Promise.all([
      context.supabase
        .from("accounts")
        .select("id,name,type,currency,current_balance_minor,color,icon,is_archived")
        .eq("user_id", context.userId)
        .eq("is_archived", false),
      context.supabase
        .from("transactions")
        .select("kind,amount_minor,category_id,occurred_at")
        .eq("user_id", context.userId)
        .gte("occurred_at", sixMonthsAgo),
      context.supabase
        .from("transactions")
        .select("*")
        .eq("user_id", context.userId)
        .order("occurred_at", { ascending: false })
        .limit(8),
    ]);

    const netWorthMinor = (accounts ?? []).reduce(
      (a, x) => a + Number(x.current_balance_minor ?? 0),
      0,
    );

    let monthIncome = 0;
    let monthExpense = 0;
    const categoryTotals: Record<string, number> = {};
    const byMonth = new Map<string, { income: number; expense: number }>();

    for (const t of txns ?? []) {
      const amt = Number(t.amount_minor);
      const d = new Date(t.occurred_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = byMonth.get(monthKey) ?? { income: 0, expense: 0 };
      if (t.kind === "income") bucket.income += amt;
      else if (t.kind === "expense") bucket.expense += amt;
      byMonth.set(monthKey, bucket);

      if (t.occurred_at >= monthStart) {
        if (t.kind === "income") monthIncome += amt;
        else if (t.kind === "expense") monthExpense += amt;
      }
      if (t.kind === "expense" && t.category_id && t.occurred_at >= monthStart) {
        categoryTotals[t.category_id] = (categoryTotals[t.category_id] ?? 0) + amt;
      }
    }

    const cashFlow = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, income: v.income, expense: v.expense }));

    return {
      netWorthMinor,
      monthIncomeMinor: monthIncome,
      monthExpenseMinor: monthExpense,
      accounts: accounts ?? [],
      categoryTotals,
      cashFlow,
      recent: recent ?? [],
    };
  });

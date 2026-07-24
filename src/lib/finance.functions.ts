import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  accountInput,
  categoryInput,
  transactionInput,
  listTransactionsInput,
  transactionTemplateInput,
  budgetInput,
  savingsGoalInput,
  savingsContributionInput,
  contactInput,
  merchantInput,
  importProfileInput,
  loanInput,
  loanPaymentInput,
  recurringTransactionInput,
  subscriptionInput,
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
  .validator((v: unknown) =>
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
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => accountInput.parse(v))
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
  .validator((v: unknown) =>
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
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
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
  .validator((v: unknown) => categoryInput.parse(v))
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
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
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
  .validator((v: unknown) => listTransactionsInput.parse(v ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("transactions")
      .select("*")
      .eq("user_id", context.userId)
      .order("occurred_at", { ascending: false });

    // Handle soft deletion query
    if (data.is_deleted) {
      q = q.not("deleted_at", "is", null);
    } else {
      q = q.is("deleted_at", null);
    }

    if (data.from) q = q.gte("occurred_at", data.from);
    if (data.to) q = q.lte("occurred_at", data.to);
    if (data.account_id) {
      q = q.or(`account_id.eq.${data.account_id},to_account_id.eq.${data.account_id}`);
    }
    if (data.category_id) q = q.eq("category_id", data.category_id);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.payment_method) q = q.eq("payment_method", data.payment_method);
    if (data.reference_number) q = q.eq("reference_number", data.reference_number);
    if (data.is_favorite !== undefined) q = q.eq("is_favorite", data.is_favorite);
    if (data.reconciled !== undefined) q = q.eq("reconciled", data.reconciled);
    if (data.merchant) q = q.ilike("merchant", `%${data.merchant}%`);
    if (data.location) q = q.ilike("location", `%${data.location}%`);
    if (data.min_amount !== undefined) q = q.gte("amount_minor", data.min_amount);
    if (data.max_amount !== undefined) q = q.lte("amount_minor", data.max_amount);

    if (data.search) {
      q = q.or(
        `description.ilike.%${data.search}%,merchant.ilike.%${data.search}%,notes.ilike.%${data.search}%,reference_number.ilike.%${data.search}%`
      );
    }

    if (data.tag) {
      const { data: tags } = await context.supabase
        .from("transaction_tags")
        .select("transaction_id")
        .eq("tag", data.tag);
      const ids = (tags ?? []).map((t) => t.transaction_id);
      if (ids.length === 0) return [];
      q = q.in("id", ids);
    }

    const { data: rows, error } = await q.limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getTransactionSplits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ transaction_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: splits, error } = await context.supabase
      .from("transaction_splits")
      .select("*")
      .eq("transaction_id", data.transaction_id);
    if (error) throw new Error(error.message);
    return splits ?? [];
  });

export const getTransactionTags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ transaction_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: tags, error } = await context.supabase
      .from("transaction_tags")
      .select("tag")
      .eq("transaction_id", data.transaction_id);
    if (error) throw new Error(error.message);
    return (tags ?? []).map((t) => t.tag);
  });

export const createTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => transactionInput.parse(v))
  .handler(async ({ data, context }) => {
    // Check if account is frozen
    const { data: acc } = await context.supabase
      .from("accounts")
      .select("is_frozen")
      .eq("id", data.account_id)
      .single();
    if (acc?.is_frozen) {
      throw new Error("Cannot add transactions to a frozen account.");
    }

    if (data.kind === "transfer") {
      if (!data.to_account_id || data.to_account_id === data.account_id) {
        throw new Error("Transfer requires a different destination account.");
      }
      const { data: toAcc } = await context.supabase
        .from("accounts")
        .select("is_frozen")
        .eq("id", data.to_account_id)
        .single();
      if (toAcc?.is_frozen) {
        throw new Error("Cannot transfer to a frozen destination account.");
      }

      const { data: row, error } = await context.supabase
        .from("transactions")
        .insert({
          user_id: context.userId,
          kind: "transfer",
          account_id: data.account_id,
          to_account_id: data.to_account_id,
          amount_minor: data.amount_minor,
          currency: data.currency,
          base_amount_minor: data.amount_minor,
          occurred_at: data.occurred_at,
          description: data.description ?? "Transfer",
          notes: data.notes ?? null,
          payment_method: data.payment_method ?? null,
          reference_number: data.reference_number ?? null,
          is_favorite: data.is_favorite ?? false,
          reconciled: data.reconciled ?? false,
          transfer_group_id: crypto.randomUUID(),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }

    // Income or Expense
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (context.supabase as any)
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
        location: data.location ?? null,
        notes: data.notes ?? null,
        payment_method: data.payment_method ?? null,
        reference_number: data.reference_number ?? null,
        is_favorite: data.is_favorite ?? false,
        reconciled: data.reconciled ?? false,
        import_batch_id: data.import_batch_id ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (row) {
      // Handle splits
      if (data.splits && data.splits.length) {
        const totalSplits = data.splits.reduce((sum, s) => sum + s.amount_minor, 0);
        if (totalSplits !== data.amount_minor) {
          throw new Error("Split amounts must sum to the total transaction amount.");
        }
        const { error: splitErr } = await context.supabase.from("transaction_splits").insert(
          data.splits.map((s) => ({
            transaction_id: row.id,
            category_id: s.category_id ?? null,
            amount_minor: s.amount_minor,
            note: s.note ?? null,
          }))
        );
        if (splitErr) throw new Error(splitErr.message);
      }

      // Handle tags
      if (data.tags && data.tags.length) {
        const { error: tagsErr } = await context.supabase
          .from("transaction_tags")
          .insert(data.tags.map((tag) => ({ transaction_id: row.id, tag })));
        if (tagsErr) throw new Error(tagsErr.message);
      }

      // Merchant Auto-Learning Engine: Update or Insert merchant behavior profile
      const merchantName = (data.merchant || data.description || "").trim();
      if (merchantName && merchantName.length >= 2) {
        const normalized = merchantName.toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (context.supabase as any)
          .from("merchants")
          .select("*")
          .eq("user_id", context.userId)
          .eq("normalized_name", normalized)
          .maybeSingle();

        if (existing) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (context.supabase as any)
            .from("merchants")
            .update({
              visit_count: Number(existing.visit_count || 0) + 1,
              total_spent_minor: Number(existing.total_spent_minor || 0) + (data.kind === "expense" ? data.amount_minor : 0),
              last_amount_minor: data.amount_minor,
              default_category_id: data.category_id || existing.default_category_id,
              default_account_id: data.account_id || existing.default_account_id,
              default_payment_method: data.payment_method || existing.default_payment_method,
              last_used_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (context.supabase as any).from("merchants").insert({
            user_id: context.userId,
            name: merchantName,
            normalized_name: normalized,
            default_category_id: data.category_id || null,
            default_account_id: data.account_id || null,
            default_payment_method: data.payment_method || null,
            visit_count: 1,
            total_spent_minor: data.kind === "expense" ? data.amount_minor : 0,
            last_amount_minor: data.amount_minor,
            last_used_at: new Date().toISOString(),
          });
        }
      }
    }

    return row;
  });

export const updateTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: transactionInput.partial() }).parse(v)
  )
  .handler(async ({ data, context }) => {
    // 1. Get original transaction
    const { data: original, error: getErr } = await context.supabase
      .from("transactions")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (getErr || !original) throw new Error("Transaction not found.");

    // 2. Check if accounts are frozen
    const accIds = new Set<string>();
    if (original.account_id) accIds.add(original.account_id);
    if (original.to_account_id) accIds.add(original.to_account_id);
    if (data.patch.account_id) accIds.add(data.patch.account_id);
    if (data.patch.to_account_id) accIds.add(data.patch.to_account_id);

    const { data: accounts } = await context.supabase
      .from("accounts")
      .select("id, is_frozen")
      .in("id", Array.from(accIds));
    const frozenAccs = (accounts ?? []).filter((a) => a.is_frozen).map((a) => a.id);
    if (frozenAccs.length > 0) {
      throw new Error("Cannot modify transaction associated with a frozen account.");
    }

    // 3. Update transaction base fields
    const { splits, tags, ...basePatch } = data.patch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (context.supabase as any)
      .from("transactions")
      .update(basePatch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (updateErr) throw new Error(updateErr.message);

    // 4. Update splits if provided
    if (splits !== undefined) {
      await context.supabase.from("transaction_splits").delete().eq("transaction_id", data.id);
      if (splits.length) {
        const totalSplits = splits.reduce((sum, s) => sum + (s.amount_minor ?? 0), 0);
        const finalAmount =
          basePatch.amount_minor !== undefined ? basePatch.amount_minor : original.amount_minor;
        if (totalSplits !== finalAmount) {
          throw new Error("Split amounts must sum to the total transaction amount.");
        }
        const { error: splitErr } = await context.supabase.from("transaction_splits").insert(
          splits.map((s) => ({
            transaction_id: data.id,
            category_id: s.category_id ?? null,
            amount_minor: s.amount_minor ?? 0,
            note: s.note ?? null,
          }))
        );
        if (splitErr) throw new Error(splitErr.message);
      }
    }

    // 5. Update tags if provided
    if (tags !== undefined) {
      await context.supabase.from("transaction_tags").delete().eq("transaction_id", data.id);
      if (tags.length) {
        const { error: tagsErr } = await context.supabase
          .from("transaction_tags")
          .insert(tags.map((tag) => ({ transaction_id: data.id, tag })));
        if (tagsErr) throw new Error(tagsErr.message);
      }
    }

    return { ok: true };
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid(), hard: z.boolean().optional() }).parse(v))
  .handler(async ({ data, context }) => {
    // Check if account is frozen
    const { data: txn } = await context.supabase
      .from("transactions")
      .select("account_id, to_account_id")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (txn) {
      const accIds = [txn.account_id];
      if (txn.to_account_id) accIds.push(txn.to_account_id);
      const { data: accounts } = await context.supabase
        .from("accounts")
        .select("is_frozen")
        .in("id", accIds);
      if (accounts?.some((a) => a.is_frozen)) {
        throw new Error("Cannot delete transaction associated with a frozen account.");
      }
    }

    if (data.hard) {
      const { error } = await context.supabase
        .from("transactions")
        .delete()
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("transactions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const restoreTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("transactions")
      .update({ deleted_at: null })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkDeleteTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ ids: z.array(z.string().uuid()), hard: z.boolean().optional() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: txs } = await context.supabase
      .from("transactions")
      .select("account_id, to_account_id")
      .in("id", data.ids)
      .eq("user_id", context.userId);
    const accIds = new Set<string>();
    for (const t of txs ?? []) {
      if (t.account_id) accIds.add(t.account_id);
      if (t.to_account_id) accIds.add(t.to_account_id);
    }
    const { data: accounts } = await context.supabase
      .from("accounts")
      .select("id, is_frozen")
      .in("id", Array.from(accIds));
    if (accounts?.some((a) => a.is_frozen)) {
      throw new Error("Cannot delete transactions associated with a frozen account.");
    }

    if (data.hard) {
      const { error } = await context.supabase
        .from("transactions")
        .delete()
        .in("id", data.ids)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("transactions")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", data.ids)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const bulkUpdateTransactionsCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (v: unknown) => z.object({ ids: z.array(z.string().uuid()), category_id: z.string().uuid().nullable() }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("transactions")
      .update({ category_id: data.category_id })
      .in("id", data.ids)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkTransferTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (v: unknown) => z.object({ ids: z.array(z.string().uuid()), account_id: z.string().uuid() }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { data: destAcc } = await context.supabase
      .from("accounts")
      .select("is_frozen, currency")
      .eq("id", data.account_id)
      .single();
    if (destAcc?.is_frozen) {
      throw new Error("Cannot move transactions to a frozen account.");
    }

    const { error } = await context.supabase
      .from("transactions")
      .update({ account_id: data.account_id, currency: destAcc?.currency ?? "USD" })
      .in("id", data.ids)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ TRANSACTION TEMPLATES ============ */

export const listTransactionTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("transaction_templates")
      .select("*")
      .eq("user_id", context.userId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createTransactionTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => transactionTemplateInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("transaction_templates")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteTransactionTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("transaction_templates")
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
        .select("id,name,type,currency,current_balance_minor,color,icon,is_archived,is_frozen,is_hidden,is_favorite,sort_order")
        .eq("user_id", context.userId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      context.supabase
        .from("transactions")
        .select("kind,amount_minor,category_id,occurred_at")
        .eq("user_id", context.userId)
        .is("deleted_at", null)
        .gte("occurred_at", sixMonthsAgo),
      context.supabase
        .from("transactions")
        .select("*")
        .eq("user_id", context.userId)
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false })
        .limit(8),
    ]);

    const netWorthMinor = (accounts ?? [])
      .filter((a) => !a.is_hidden)
      .reduce((a, x) => a + Number(x.current_balance_minor ?? 0), 0);

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

/* ============ BUDGETS ============ */

export const listBudgets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date().toISOString().slice(0, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: budgets, error } = await (context.supabase as any)
      .from("budgets")
      .select("*, budget_categories(category_id)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error((error as { message: string }).message);

    // Compute current period spend for each budget
    const result = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((budgets ?? []) as any[]).map(async (b: any) => {
        const categoryIds: string[] = (b.budget_categories ?? []).map((bc: { category_id: string }) => bc.category_id);

        let periodStart: string;
        let periodEnd: string;
        const d = new Date(now);
        if (b.period_type === "monthly") {
          periodStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
          periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
        } else if (b.period_type === "weekly") {
          const day = d.getDay();
          const monday = new Date(d); monday.setDate(d.getDate() - day + 1);
          const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
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
        return { ...b, spent_minor, period_start: periodStart, period_end: periodEnd };
      })
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
    return row;
  });

export const updateBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: budgetInput.partial() }).parse(v)
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
        await context.supabase.from("budget_categories").insert(
          category_ids.map((cid) => ({ budget_id: data.id, category_id: cid }))
        );
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

/* ============ SAVINGS GOALS ============ */

export const listSavingsGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createSavingsGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => savingsGoalInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("savings_goals")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateSavingsGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: savingsGoalInput.partial() }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("savings_goals")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSavingsGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("savings_goals")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addSavingsContribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => savingsContributionInput.parse(v))
  .handler(async ({ data, context }) => {
    // Verify the goal belongs to the user
    const { data: goal } = await context.supabase
      .from("savings_goals")
      .select("id, current_minor, target_minor")
      .eq("id", data.goal_id)
      .eq("user_id", context.userId)
      .single();
    if (!goal) throw new Error("Savings goal not found.");

    const { error: contribErr } = await context.supabase
      .from("savings_contributions")
      .insert({ goal_id: data.goal_id, amount_minor: data.amount_minor, note: data.note ?? null });
    if (contribErr) throw new Error(contribErr.message);

    const newAmount = Math.max(0, Number(goal.current_minor) + data.amount_minor);
    const isCompleted = newAmount >= Number(goal.target_minor);
    const { error } = await context.supabase
      .from("savings_goals")
      .update({ current_minor: newAmount, is_completed: isCompleted })
      .eq("id", data.goal_id);
    if (error) throw new Error(error.message);
    return { ok: true, current_minor: newAmount, is_completed: isCompleted };
  });

export const listSavingsContributions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ goal_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("savings_contributions")
      .select("*")
      .eq("goal_id", data.goal_id)
      .order("occurred_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/* ============ CONTACTS ============ */

export const listContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("contacts")
      .select("*")
      .eq("user_id", context.userId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => contactInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("contacts")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("contacts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ LOANS ============ */

export const listLoans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("loans")
      .select("*, contacts(name, phone, email)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => loanInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("loans")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: loanInput.partial() }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("loans")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("loans")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addLoanPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => loanPaymentInput.parse(v))
  .handler(async ({ data, context }) => {
    // Verify loan belongs to user
    const { data: loan } = await context.supabase
      .from("loans")
      .select("id, principal_minor, paid_minor")
      .eq("id", data.loan_id)
      .eq("user_id", context.userId)
      .single();
    if (!loan) throw new Error("Loan not found.");

    const { error } = await context.supabase
      .from("loan_payments")
      .insert({
        loan_id: data.loan_id,
        amount_minor: data.amount_minor,
        note: data.note ?? null,
        paid_at: data.paid_at ?? new Date().toISOString(),
      });
    if (error) throw new Error(error.message);

    // Check if loan is fully settled (trigger updates paid_minor automatically)
    const newPaid = Number(loan.paid_minor) + data.amount_minor;
    if (newPaid >= Number(loan.principal_minor)) {
      await context.supabase
        .from("loans")
        .update({ is_settled: true })
        .eq("id", data.loan_id);
    }
    return { ok: true };
  });

export const listLoanPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ loan_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("loan_payments")
      .select("*")
      .eq("loan_id", data.loan_id)
      .order("paid_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/* ============ RECURRING TRANSACTIONS ============ */

export const listRecurringTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", context.userId)
      .order("next_due_date", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
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
    return row;
  });

export const updateRecurringTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: recurringTransactionInput.partial() }).parse(v)
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

    // Create the actual transaction
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

    // Advance next_due_date based on frequency
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

/* ============ SUBSCRIPTIONS ============ */

export const listSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", context.userId)
      .order("next_renewal_date", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => subscriptionInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("subscriptions")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: subscriptionInput.partial() }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("subscriptions")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("subscriptions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ NOTIFICATIONS ============ */

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() }).parse(v)
  )
  .handler(async ({ data, context }) => {
    if (data.all) {
      await context.supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", context.userId);
    } else if (data.id) {
      await context.supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", data.id)
        .eq("user_id", context.userId);
    }
    return { ok: true };
  });

export const deleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ ANALYTICS ============ */

export const getNetWorthTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ months: z.number().int().min(1).max(24).default(12) }).parse(v ?? {}))
  .handler(async ({ data, context }) => {
    const now = new Date();
    const points: Array<{ month: string; net_worth_minor: number }> = [];
    for (let i = data.months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const { data: accs } = await context.supabase
        .from("accounts")
        .select("id, opening_balance_minor, current_balance_minor, is_hidden")
        .eq("user_id", context.userId)
        .lte("created_at", endOfMonth);
      const total = (accs ?? [])
        .filter((a) => !a.is_hidden)
        .reduce((s, a) => s + Number(a.current_balance_minor ?? 0), 0);
      points.push({ month: monthKey, net_worth_minor: total });
    }
    return points;
  });

export const getAnalyticsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ months: z.number().int().min(1).max(24).default(6) }).parse(v ?? {})
  )
  .handler(async ({ context, data }) => {
    const now = new Date();
    const fromDate = new Date(now.getFullYear(), now.getMonth() - data.months + 1, 1).toISOString();
    const { data: txns } = await context.supabase
      .from("transactions")
      .select("kind,amount_minor,category_id,merchant,occurred_at")
      .eq("user_id", context.userId)
      .is("deleted_at", null)
      .gte("occurred_at", fromDate);

    const byMonth = new Map<string, { income: number; expense: number }>();
    const merchantTotals: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of txns ?? []) {
      const amt = Number(t.amount_minor);
      const d = new Date(t.occurred_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = byMonth.get(monthKey) ?? { income: 0, expense: 0 };
      if (t.kind === "income") { bucket.income += amt; totalIncome += amt; }
      else if (t.kind === "expense") {
        bucket.expense += amt; totalExpense += amt;
        if (t.merchant) merchantTotals[t.merchant] = (merchantTotals[t.merchant] ?? 0) + amt;
        if (t.category_id) categoryTotals[t.category_id] = (categoryTotals[t.category_id] ?? 0) + amt;
      }
      byMonth.set(monthKey, bucket);
    }

    const cashFlow = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, income: v.income, expense: v.expense }));

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const topMerchants = Object.entries(merchantTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, total]) => ({ name, total }));

    return { cashFlow, savingsRate, totalIncome, totalExpense, topMerchants, categoryTotals };
  });

/* ============ EXPORT ============ */

export const exportTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      account_id: z.string().uuid().optional(),
    }).parse(v ?? {})
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("transactions")
      .select("*, categories(name), accounts!transactions_account_id_fkey(name, currency)")
      .eq("user_id", context.userId)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false });
    if (data.from) q = q.gte("occurred_at", data.from);
    if (data.to) q = q.lte("occurred_at", data.to);
    if (data.account_id) q = q.eq("account_id", data.account_id);
    const { data: rows, error } = await q.limit(10000);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/* ============ MERCHANTS ============ */

export const listMerchants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (context.supabase as any)
      .from("merchants")
      .select("*, categories(name, color), accounts(name, currency)")
      .eq("user_id", context.userId)
      .order("visit_count", { ascending: false })
      .order("last_used_at", { ascending: false });
    if (error) throw new Error((error as { message: string }).message);
    return data ?? [];
  });

export const getMerchant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: merchant, error } = await (context.supabase as any)
      .from("merchants")
      .select("*, categories(name, color), accounts(name, currency)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error || !merchant) throw new Error("Merchant not found.");

    // Fetch recent transactions for this merchant
    const { data: recentTxns } = await context.supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", context.userId)
      .ilike("merchant", `%${merchant.name}%`)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false })
      .limit(10);

    return { merchant, recentTransactions: recentTxns ?? [] };
  });

export const createMerchant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => merchantInput.parse(v))
  .handler(async ({ data, context }) => {
    const normalized = data.name.trim().toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (context.supabase as any)
      .from("merchants")
      .insert({ ...data, normalized_name: normalized, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error((error as { message: string }).message);
    return row;
  });

export const updateMerchant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid(), patch: merchantInput.partial() }).parse(v))
  .handler(async ({ data, context }) => {
    const patchData: any = { ...data.patch };
    if (data.patch.name) {
      patchData.normalized_name = data.patch.name.trim().toLowerCase();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (context.supabase as any)
      .from("merchants")
      .update(patchData)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error((error as { message: string }).message);
    return { ok: true };
  });

export const deleteMerchant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (context.supabase as any)
      .from("merchants")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error((error as { message: string }).message);
    return { ok: true };
  });

export const mergeMerchants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ targetId: z.string().uuid(), sourceId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: source } = await (context.supabase as any)
      .from("merchants")
      .select("*")
      .eq("id", data.sourceId)
      .eq("user_id", context.userId)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: target } = await (context.supabase as any)
      .from("merchants")
      .select("*")
      .eq("id", data.targetId)
      .eq("user_id", context.userId)
      .single();

    if (!source || !target) throw new Error("Source or target merchant not found.");

    // Update transactions to target merchant name
    await context.supabase
      .from("transactions")
      .update({ merchant: target.name })
      .ilike("merchant", `%${source.name}%`)
      .eq("user_id", context.userId);

    // Merge visit counts & totals onto target
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (context.supabase as any)
      .from("merchants")
      .update({
        visit_count: Number(target.visit_count || 0) + Number(source.visit_count || 0),
        total_spent_minor: Number(target.total_spent_minor || 0) + Number(source.total_spent_minor || 0),
      })
      .eq("id", target.id);

    // Delete source merchant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (context.supabase as any).from("merchants").delete().eq("id", source.id);

    return { ok: true };
  });

export const checkPossibleDuplicateTransaction = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({
      amount_minor: z.number().int(),
      merchant: z.string().optional(),
      windowMinutes: z.number().int().default(15),
    }).parse(v ?? {})
  )
  .handler(async ({ data, context }) => {
    const windowStart = new Date(Date.now() - data.windowMinutes * 60 * 1000).toISOString();
    let q = context.supabase
      .from("transactions")
      .select("id, amount_minor, merchant, description, occurred_at")
      .eq("user_id", context.userId)
      .eq("amount_minor", data.amount_minor)
      .gte("occurred_at", windowStart)
      .is("deleted_at", null);

    if (data.merchant) {
      q = q.ilike("merchant", `%${data.merchant}%`);
    }

    const { data: matches } = await q;
    return { possibleDuplicate: (matches ?? []).length > 0, match: matches?.[0] ?? null };
  });

/* ============ IMPORT CENTER & RECONCILIATION ============ */

export const listImportBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (context.supabase as any)
      .from("import_batches")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error((error as { message: string }).message);
    return data ?? [];
  });

export const createImportBatchRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({
      filename: z.string(),
      source_format: z.string().default("csv"),
      total_rows: z.number().int(),
      imported_count: z.number().int(),
      skipped_count: z.number().int().default(0),
      duplicate_count: z.number().int().default(0),
      duration_ms: z.number().int().default(0),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (context.supabase as any)
      .from("import_batches")
      .insert({ ...data, user_id: context.userId, status: "completed" })
      .select()
      .single();
    if (error) throw new Error((error as { message: string }).message);
    return row;
  });

export const rollbackImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ batchId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    // Delete all transactions created under this import_batch_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: delErr } = await (context.supabase as any)
      .from("transactions")
      .delete()
      .eq("import_batch_id", data.batchId)
      .eq("user_id", context.userId);
    if (delErr) throw new Error(delErr.message);

    // Update batch status to 'rolled_back'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (context.supabase as any)
      .from("import_batches")
      .update({ status: "rolled_back" })
      .eq("id", data.batchId)
      .eq("user_id", context.userId);
    if (updateErr) throw new Error((updateErr as { message: string }).message);

    return { ok: true };
  });

export const listImportProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (context.supabase as any)
      .from("import_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error((error as { message: string }).message);
    return data ?? [];
  });

export const createImportProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => importProfileInput.parse(v))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (context.supabase as any)
      .from("import_profiles")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error((error as { message: string }).message);
    return row;
  });

export const deleteImportProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (context.supabase as any)
      .from("import_profiles")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error((error as { message: string }).message);
    return { ok: true };
  });

export const reconcileAccountBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({
      account_id: z.string().uuid(),
      expected_balance_minor: z.number().int(),
      createAdjustmentTransaction: z.boolean().default(true),
    }).parse(v)
  )
  .handler(async ({ data, context }) => {
    // 1. Fetch current account balance
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



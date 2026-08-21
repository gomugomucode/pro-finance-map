import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { listTransactionsInput, transactionInput, transactionTemplateInput } from "@/lib/schemas";
import { convertCurrency } from "@/lib/fx-engine";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionSplitRow = Database["public"]["Tables"]["transaction_splits"]["Row"];
export type TransactionTemplateRow = Database["public"]["Tables"]["transaction_templates"]["Row"];

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
      q = q.not("deleted_at", "is", null as any);
    } else {
      q = q.is("deleted_at", null as any);
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
        `description.ilike.%${data.search}%,merchant.ilike.%${data.search}%,notes.ilike.%${data.search}%,reference_number.ilike.%${data.search}%`,
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
    return (rows ?? []) as TransactionRow[];
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
    return (splits ?? []) as TransactionSplitRow[];
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
    // 1. Check if account is frozen
    const { data: acc } = await context.supabase
      .from("accounts")
      .select("is_frozen")
      .eq("id", data.account_id)
      .single();
    if (acc?.is_frozen) {
      throw new Error("Cannot add transactions to a frozen account.");
    }

    // 2. Fetch user profile for base currency conversion
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("base_currency")
      .eq("user_id", context.userId)
      .maybeSingle();
    const baseCurrency = profile?.base_currency || "USD";
    const baseAmountMinor =
      data.currency === baseCurrency
        ? data.amount_minor
        : convertCurrency(data.amount_minor, data.currency, baseCurrency);

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
          base_amount_minor: baseAmountMinor,
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
      return row as TransactionRow;
    }

    // Income or Expense
    const { data: row, error } = await context.supabase
      .from("transactions")
      .insert({
        user_id: context.userId,
        kind: data.kind,
        account_id: data.account_id,
        category_id: data.category_id ?? null,
        amount_minor: data.amount_minor,
        currency: data.currency,
        base_amount_minor: baseAmountMinor,
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
          })),
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

      // Merchant Auto-Learning Engine
      const merchantName = (data.merchant || data.description || "").trim();
      if (merchantName && merchantName.length >= 2) {
        const normalized = merchantName.toLowerCase();
        const { data: existing } = await context.supabase
          .from("merchants")
          .select("*")
          .eq("user_id", context.userId)
          .eq("normalized_name", normalized)
          .maybeSingle();

        if (existing) {
          await context.supabase
            .from("merchants")
            .update({
              visit_count: Number(existing.visit_count || 0) + 1,
              total_spent_minor:
                Number(existing.total_spent_minor || 0) +
                (data.kind === "expense" ? data.amount_minor : 0),
              last_amount_minor: data.amount_minor,
              default_category_id: data.category_id || existing.default_category_id,
              default_account_id: data.account_id || existing.default_account_id,
              default_payment_method: data.payment_method || existing.default_payment_method,
              last_used_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await context.supabase.from("merchants").insert({
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

    return row as TransactionRow;
  });

export const updateTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: transactionInput.partial() }).parse(v),
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
    const { error: updateErr } = await context.supabase
      .from("transactions")
      .update(basePatch as Database["public"]["Tables"]["transactions"]["Update"])
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
          })),
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
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), hard: z.boolean().optional() }).parse(v),
  )
  .handler(async ({ data, context }) => {
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
  .validator((v: unknown) =>
    z.object({ ids: z.array(z.string().uuid()), hard: z.boolean().optional() }).parse(v),
  )
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
  .validator((v: unknown) =>
    z
      .object({ ids: z.array(z.string().uuid()), category_id: z.string().uuid().nullable() })
      .parse(v),
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
  .validator((v: unknown) =>
    z.object({ ids: z.array(z.string().uuid()), account_id: z.string().uuid() }).parse(v),
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

export const listTransactionTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("transaction_templates")
      .select("*")
      .eq("user_id", context.userId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as TransactionTemplateRow[];
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
    return row as TransactionTemplateRow;
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

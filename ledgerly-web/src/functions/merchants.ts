import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { merchantInput } from "@/lib/schemas";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];

export const listMerchants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("merchants")
      .select("*, categories(name, color), accounts(name, currency)")
      .eq("user_id", context.userId)
      .order("visit_count", { ascending: false })
      .order("last_used_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMerchant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: merchant, error } = await context.supabase
      .from("merchants")
      .select("*, categories(name, color), accounts(name, currency)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error || !merchant) throw new Error("Merchant not found.");

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
    const { data: row, error } = await context.supabase
      .from("merchants")
      .insert({ ...data, normalized_name: normalized, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as MerchantRow;
  });

export const updateMerchant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), patch: merchantInput.partial() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const patchData: Partial<MerchantRow> = { ...data.patch };
    if (data.patch.name) {
      patchData.normalized_name = data.patch.name.trim().toLowerCase();
    }
    const { error } = await context.supabase
      .from("merchants")
      .update(patchData)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMerchant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("merchants")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const mergeMerchants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ targetId: z.string().uuid(), sourceId: z.string().uuid() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: source } = await context.supabase
      .from("merchants")
      .select("*")
      .eq("id", data.sourceId)
      .eq("user_id", context.userId)
      .single();
    const { data: target } = await context.supabase
      .from("merchants")
      .select("*")
      .eq("id", data.targetId)
      .eq("user_id", context.userId)
      .single();

    if (!source || !target) throw new Error("Source or target merchant not found.");

    await context.supabase
      .from("transactions")
      .update({ merchant: target.name })
      .ilike("merchant", `%${source.name}%`)
      .eq("user_id", context.userId);

    await context.supabase
      .from("merchants")
      .update({
        visit_count: Number(target.visit_count || 0) + Number(source.visit_count || 0),
        total_spent_minor:
          Number(target.total_spent_minor || 0) + Number(source.total_spent_minor || 0),
      })
      .eq("id", target.id);

    await context.supabase.from("merchants").delete().eq("id", source.id);

    return { ok: true };
  });

export const checkPossibleDuplicateTransaction = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z
      .object({
        amount_minor: z.number().int(),
        merchant: z.string().optional(),
        windowMinutes: z.number().int().default(15),
      })
      .parse(v ?? {}),
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

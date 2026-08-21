import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth, applyRateLimit } from "@/integrations/supabase/auth-middleware";
import { accountInput } from "@/lib/schemas";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];

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
    return (data ?? []) as AccountRow[];
  });

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, applyRateLimit("createAccount", 30, 60)])
  .validator((v: unknown) => accountInput.parse(v))
  .handler(async ({ data, context }) => {
    const opening = data.opening_balance_minor ?? 0;
    const current = data.current_balance_minor ?? opening;
    const { data: row, error } = await context.supabase
      .from("accounts")
      .insert({
        ...data,
        user_id: context.userId,
        opening_balance_minor: opening,
        current_balance_minor: current,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as AccountRow;
  });

export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, applyRateLimit("updateAccount", 30, 60)])
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
  .middleware([requireSupabaseAuth, applyRateLimit("deleteAccount", 30, 60)])
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

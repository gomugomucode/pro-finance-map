import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assetInput, liabilityInput } from "@/lib/schemas";
import { calculateConsolidatedNetWorth } from "@/lib/fx-engine";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type AssetRow = Database["public"]["Tables"]["assets"]["Row"];
export type LiabilityRow = Database["public"]["Tables"]["liabilities"]["Row"];

export const listAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("assets")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as AssetRow[];
  });

export const createAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => assetInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("assets")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as AssetRow;
  });

export const updateAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: assetInput.partial(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("assets")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as AssetRow;
  });

export const deleteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("assets")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listLiabilities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("liabilities")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as LiabilityRow[];
  });

export const createLiability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => liabilityInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("liabilities")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as LiabilityRow;
  });

export const updateLiability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: liabilityInput.partial(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("liabilities")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as LiabilityRow;
  });

export const deleteLiability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("liabilities")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getNetWorthSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [
      { data: profile },
      { data: accounts },
      { data: assets },
      { data: liabilities },
      { data: loans },
    ] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("base_currency")
        .eq("user_id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("accounts")
        .select("id, name, current_balance_minor, currency, is_hidden")
        .eq("user_id", context.userId)
        .eq("is_archived", false),
      context.supabase
        .from("assets")
        .select("*")
        .eq("user_id", context.userId)
        .eq("is_active", true),
      context.supabase
        .from("liabilities")
        .select("*")
        .eq("user_id", context.userId)
        .eq("is_active", true),
      context.supabase
        .from("loans")
        .select("id, principal_minor, paid_minor, currency, direction")
        .eq("user_id", context.userId)
        .eq("is_settled", false),
    ]);

    const baseCurrency = profile?.base_currency || "USD";

    const consolidated = calculateConsolidatedNetWorth({
      baseCurrency,
      accounts: (accounts ?? []).filter((a) => !a.is_hidden),
      assets: (assets ?? []).map((a) => ({
        value_minor: a.current_value_minor,
        currency: a.currency,
      })),
      liabilities: (liabilities ?? []).map((l) => ({
        current_balance_minor: l.current_balance_minor,
        currency: l.currency,
      })),
      loans: (loans ?? []).map((l) => ({
        principal_minor: l.principal_minor,
        paid_minor: l.paid_minor,
        currency: l.currency,
        direction: (l.direction as "lent" | "borrowed") || "lent",
      })),
    });

    const grandTotalAssetsMinor = consolidated.totalLiquidMinor + consolidated.totalAssetsMinor;
    const grandTotalLiabilitiesMinor = consolidated.totalLiabilitiesMinor;
    const debtRatioPercent =
      grandTotalAssetsMinor > 0
        ? Math.round((grandTotalLiabilitiesMinor / grandTotalAssetsMinor) * 100)
        : 0;

    return {
      netWorthMinor: consolidated.netWorthMinor,
      grandTotalAssetsMinor,
      grandTotalLiabilitiesMinor,
      liquidBankTotalMinor: consolidated.totalLiquidMinor,
      assetsTotalMinor: consolidated.totalAssetsMinor,
      liabilitiesTotalMinor: consolidated.totalLiabilitiesMinor,
      loansTotalMinor: consolidated.totalLoansMinor,
      debtRatioPercent,
      assetCount: (assets ?? []).length,
      liabilityCount: (liabilities ?? []).length,
      baseCurrency,
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calculateConsolidatedNetWorth } from "@/lib/fx-engine";
import { z } from "zod";

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    const [
      { data: profile },
      { data: accounts },
      { data: txns },
      { data: recent },
      { data: categories },
    ] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("base_currency")
        .eq("user_id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("accounts")
        .select(
          "id,name,type,currency,current_balance_minor,color,icon,is_archived,is_frozen,is_hidden,is_favorite,sort_order",
        )
        .eq("user_id", context.userId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      context.supabase
        .from("transactions")
        .select("kind,amount_minor,category_id,occurred_at,currency")
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
      context.supabase.from("categories").select("id,name").eq("user_id", context.userId),
    ]);

    const baseCurrency = profile?.base_currency || "USD";

    const { netWorthMinor } = calculateConsolidatedNetWorth({
      baseCurrency,
      accounts: (accounts ?? []).filter((a) => !a.is_hidden),
    });

    let monthIncome = 0;
    let monthExpense = 0;
    const categoryTotalsMap: Record<string, number> = {};
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
        categoryTotalsMap[t.category_id] = (categoryTotalsMap[t.category_id] ?? 0) + amt;
      }
    }

    const catNameMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
    const categoryTotals = Object.entries(categoryTotalsMap).map(([catId, amt]) => ({
      category: catNameMap.get(catId) || "General",
      amount: amt / 100,
    }));

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
      baseCurrency,
    };
  });

export const getNetWorthTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z.object({ months: z.number().int().min(1).max(24).default(12) }).parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    const now = new Date();
    const points: Array<{ month: string; net_worth_minor: number }> = [];
    for (let i = data.months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const { data: accs } = await context.supabase
        .from("accounts")
        .select("id, opening_balance_minor, current_balance_minor, is_hidden, currency")
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
    z.object({ months: z.number().int().min(1).max(24).default(6) }).parse(v ?? {}),
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
      if (t.kind === "income") {
        bucket.income += amt;
        totalIncome += amt;
      } else if (t.kind === "expense") {
        bucket.expense += amt;
        totalExpense += amt;
        if (t.merchant) merchantTotals[t.merchant] = (merchantTotals[t.merchant] ?? 0) + amt;
        if (t.category_id)
          categoryTotals[t.category_id] = (categoryTotals[t.category_id] ?? 0) + amt;
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

export const exportTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v: unknown) =>
    z
      .object({
        from: z.string().optional(),
        to: z.string().optional(),
        account_id: z.string().uuid().optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("transactions")
      .select("*, categories(name), accounts!account_id(name, currency)")
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

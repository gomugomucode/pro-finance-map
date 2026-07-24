import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getNetWorthTimeline, getAnalyticsSummary, listAccounts, listCategories } from "@/lib/finance.functions";
import { FinancialHealthCard } from "@/features/analytics/FinancialHealthCard";
import { NetWorthChart } from "@/features/analytics/NetWorthChart";
import { formatMoney } from "@/lib/money";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, BarChart3, PieChart as PieIcon, Store } from "lucide-react";

const netWorthQuery = queryOptions({
  queryKey: ["net_worth_timeline"],
  queryFn: () => getNetWorthTimeline({ data: { months: 12 } }),
});

const analyticsQuery = queryOptions({
  queryKey: ["analytics_summary"],
  queryFn: () => getAnalyticsSummary({ data: { months: 6 } }),
});

const accountsQuery = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });
const categoriesQuery = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });

export const Route = createFileRoute("/_authenticated/analytics")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(netWorthQuery);
    context.queryClient.ensureQueryData(analyticsQuery);
    context.queryClient.ensureQueryData(accountsQuery);
    context.queryClient.ensureQueryData(categoriesQuery);
  },
  component: AnalyticsPage,
  pendingComponent: () => <div className="p-8 text-sm text-muted-foreground">Loading analytics...</div>,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

function AnalyticsPage() {
  const { data: timeline = [] } = useSuspenseQuery(netWorthQuery);
  const { data: summary } = useSuspenseQuery(analyticsQuery);
  const { data: accounts = [] } = useSuspenseQuery(accountsQuery);
  const { data: categories = [] } = useSuspenseQuery(categoriesQuery);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const currency = accounts[0]?.currency ?? "USD";

  const totalNetWorth = accounts.reduce((s, a) => s + Number(a.current_balance_minor), 0);
  const recentMonthFlow = summary.cashFlow[summary.cashFlow.length - 1] ?? { income: 0, expense: 0 };

  const topCategories = Object.entries(summary.categoryTotals)
    .map(([id, total]) => ({
      name: catMap[id]?.name ?? "Uncategorized",
      color: catMap[id]?.color ?? "#22D3A0",
      value: Number(total) / 100,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Advanced Analytics & Intelligence</h1>
        <p className="text-sm text-muted-foreground">
          Deep-dive financial health score, net worth timeline, cash flow forecast, and merchant trends.
        </p>
      </div>

      {/* Health Score Card */}
      <FinancialHealthCard
        netWorth={totalNetWorth}
        monthlyIncome={recentMonthFlow.income}
        monthlyExpense={recentMonthFlow.expense}
        savingsRate={summary.savingsRate}
        currency={currency}
      />

      {/* Net Worth Timeline */}
      <NetWorthChart points={timeline} currency={currency} />

      {/* 2 Grid charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cash Flow Forecast */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Cash Flow Forecast (Income vs Expense)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.cashFlow.map((c) => ({
                  month: c.month,
                  Income: c.income / 100,
                  Expense: c.expense / 100,
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "oklch(0.72 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.72 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.025 260)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                    color: "white",
                  }}
                />
                <Bar dataKey="Income" fill="oklch(0.82 0.16 165)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="oklch(0.68 0.20 25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Merchants breakdown */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-info" /> Top Merchants & Vendors
            </h3>
          </div>
          {summary.topMerchants.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No merchant data logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.topMerchants.slice(0, 6).map((m) => (
                <div key={m.name} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{m.name}</span>
                  <span className="font-bold tabular">{formatMoney(m.total, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

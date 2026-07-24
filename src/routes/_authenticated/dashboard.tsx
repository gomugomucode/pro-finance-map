import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  getDashboard,
  listAccounts,
  listCategories,
} from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { formatAccountType } from "./accounts";
import { QuickAddTransaction } from "@/features/transactions/QuickAddTransaction";
import { useProfile } from "@/hooks/useProfile";
import { UserAvatar } from "@/components/UserAvatar";
import { CurrencyPickerModal } from "@/components/CurrencyPickerModal";
import { getCurrencyInfo } from "@/lib/currencies";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Calendar as CalendarIcon,
  Globe,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboard(),
});
const accountsQuery = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });
const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(dashboardQuery);
    context.queryClient.ensureQueryData(accountsQuery);
    context.queryClient.ensureQueryData(categoriesQuery);
  },
  component: DashboardPage,
  pendingComponent: () => (
    <div className="p-12 text-center text-sm font-semibold text-muted-foreground flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span>Loading dashboard...</span>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive border border-destructive/20 rounded-xl bg-destructive/5 m-4">
      {error.message}
    </div>
  ),
});

function DashboardPage() {
  const { data: d } = useSuspenseQuery(dashboardQuery);
  const { data: accounts } = useSuspenseQuery(accountsQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { profile, updateProfile } = useProfile();
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  // Base Currency & Greeting Logic
  const baseCcy = profile?.baseCurrency || accounts[0]?.currency || "USD";
  const baseCcyInfo = getCurrencyInfo(baseCcy);

  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";

  const dateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const monthNet = d.monthIncomeMinor - d.monthExpenseMinor;
  const savingsRate =
    d.monthIncomeMinor > 0
      ? Math.max(0, Math.round((monthNet / d.monthIncomeMinor) * 100))
      : 0;

  const catData = Object.entries(d.categoryTotals)
    .map(([id, v]) => ({
      name: catMap[id]?.name ?? "Uncategorized",
      color: catMap[id]?.color ?? "#2563EB",
      value: Number(v) / 100,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const flow = d.cashFlow.map((c) => ({
    ...c,
    income: Number(c.income) / 100,
    expense: Number(c.expense) / 100,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      {/* Personalized Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-4">
          <UserAvatar
            displayName={profile?.displayName}
            avatarUrl={profile?.avatarUrl}
            size="lg"
            className="ring-2 ring-primary/20"
          />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {timeGreeting}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <CalendarIcon className="h-3 w-3" />
                {dateFormatted}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-0.5">
              {profile?.displayName || "Fintech User"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCurrencyPickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-muted border border-border text-xs font-semibold transition"
          >
            <span className="text-base">{baseCcyInfo.flag}</span>
            <span className="text-foreground">{baseCcyInfo.code}</span>
            <span className="text-muted-foreground">({baseCcyInfo.symbol})</span>
          </button>

          <QuickAddTransaction />
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Net Worth"
          value={formatMoney(d.netWorthMinor, baseCcy)}
          subtitle="All connected assets & accounts"
          icon={TrendingUp}
          tone="primary"
        />
        <StatCard
          label="Income (This Month)"
          value={formatMoney(d.monthIncomeMinor, baseCcy)}
          subtitle="Earned revenue & deposits"
          icon={ArrowUpRight}
          tone="success"
        />
        <StatCard
          label="Expenses (This Month)"
          value={formatMoney(d.monthExpenseMinor, baseCcy)}
          subtitle="Outflows & billing charges"
          icon={ArrowDownRight}
          tone="destructive"
        />
        <StatCard
          label="Net Cash Flow"
          value={formatMoney(monthNet, baseCcy)}
          subtitle={`${savingsRate}% savings rate`}
          icon={monthNet >= 0 ? ArrowUpRight : ArrowDownRight}
          tone={monthNet >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Main Content Grid (Charts + Accounts) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Cash Flow & Category Breakdown (2 Cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Income vs Expense Chart */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Cash Flow Overview</h2>
                <p className="text-xs text-muted-foreground">Monthly income vs expenses breakdown</p>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                6-Month View
              </Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-destructive)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="var(--color-success)"
                    fillOpacity={1}
                    fill="url(#incGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="var(--color-destructive)"
                    fillOpacity={1}
                    fill="url(#expGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
              <span className="text-xs text-muted-foreground">Last {d.recent.length} items</span>
            </div>

            <div className="divide-y divide-border/60">
              {d.recent.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No recent transactions recorded.</p>
              ) : (
                d.recent.map((tx: any) => {
                  const cat = catMap[tx.category_id ?? ""];
                  const isIncome = tx.kind === "income";
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-9 w-9 place-items-center rounded-xl font-bold text-xs shrink-0"
                          style={{
                            backgroundColor: `${cat?.color ?? "#2563EB"}15`,
                            color: cat?.color ?? "#2563EB",
                          }}
                        >
                          {cat?.name ? cat.name.charAt(0) : "T"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{tx.description || tx.merchant || "Transaction"}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {tx.occurred_at} • {cat?.name ?? "Uncategorized"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-bold tabular text-xs sm:text-sm ${
                          isIncome ? "text-success" : "text-foreground"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatMoney(tx.amount_minor, tx.currency)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Account Cards & Category Breakdown (1 Col) */}
        <div className="space-y-6">
          {/* Accounts Overview */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Accounts ({accounts.length})
              </h2>
            </div>

            <div className="space-y-2.5">
              {accounts.map((acc) => {
                const ccyInfo = getCurrencyInfo(acc.currency);
                return (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/70 hover:border-primary/40 transition text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg shrink-0">{ccyInfo.flag}</span>
                      <div>
                        <p className="font-bold text-foreground">{acc.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatAccountType(acc.type)} • {ccyInfo.code} ({ccyInfo.symbol})
                        </p>
                      </div>
                    </div>

                    <span className="font-bold tabular text-sm text-foreground">
                      {formatMoney(acc.current_balance_minor, acc.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spending Categories Pie Chart */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-foreground">Top Spending Categories</h2>

            {catData.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No category spending recorded this month.</p>
            ) : (
              <div className="space-y-3">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={catData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {catData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          borderColor: "var(--color-border)",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 border-t border-border/60 pt-3">
                  {catData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-muted-foreground font-medium">{cat.name}</span>
                      </div>
                      <span className="font-bold tabular text-foreground">${cat.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Currency Selector Modal */}
      <CurrencyPickerModal
        open={currencyPickerOpen}
        onOpenChange={setCurrencyPickerOpen}
        selectedCurrency={baseCcy}
        onSelectCurrency={(c) => updateProfile({ baseCurrency: c.code })}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: any;
  tone: "primary" | "success" | "destructive";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular mt-1">{value}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{subtitle}</p>}
      </div>

      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

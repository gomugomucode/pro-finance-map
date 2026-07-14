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
import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet } from "lucide-react";

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
  pendingComponent: () => <div className="p-8 text-sm text-muted-foreground">Loading…</div>,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

function DashboardPage() {
  const { data: d } = useSuspenseQuery(dashboardQuery);
  const { data: accounts } = useSuspenseQuery(accountsQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const netCcy = accounts[0]?.currency ?? "USD";
  const monthNet = d.monthIncomeMinor - d.monthExpenseMinor;
  const catData = Object.entries(d.categoryTotals)
    .map(([id, v]) => ({
      name: catMap[id]?.name ?? "Uncategorized",
      color: catMap[id]?.color ?? "#22D3A0",
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            A calm overview of everything you own and spend.
          </p>
        </div>
        <QuickAddTransaction />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Net worth"
          value={formatMoney(d.netWorthMinor, netCcy)}
          icon={TrendingUp}
          tone="primary"
        />
        <StatCard
          label="This month income"
          value={formatMoney(d.monthIncomeMinor, netCcy)}
          icon={ArrowUpRight}
          tone="success"
        />
        <StatCard
          label="This month expense"
          value={formatMoney(d.monthExpenseMinor, netCcy)}
          icon={ArrowDownRight}
          tone="destructive"
        />
        <StatCard
          label="Net this month"
          value={formatMoney(monthNet, netCcy, 2, { signed: true })}
          icon={Wallet}
          tone={monthNet >= 0 ? "success" : "destructive"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium">Cash flow (last 6 months)</h2>
            <span className="text-xs text-muted-foreground">Income vs Expense</span>
          </div>
          <div className="h-64 w-full">
            {flow.length === 0 ? (
              <EmptyChart>No transactions in the last six months.</EmptyChart>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flow} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="incF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.82 0.16 165)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.82 0.16 165)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.68 0.20 25)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.68 0.20 25)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="income" stroke="oklch(0.82 0.16 165)" fill="url(#incF)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="oklch(0.68 0.20 25)" fill="url(#expF)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card-elevated p-5">
          <h2 className="mb-3 text-sm font-medium">Spending by category</h2>
          <div className="h-64">
            {catData.length === 0 ? (
              <EmptyChart>No spending this month yet.</EmptyChart>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {catData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.21 0.025 260)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 12,
                      color: "white",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {catData.map((c) => (
              <li key={c.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </span>
                <span className="tabular">{formatMoney(c.value * 100, netCcy)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium">Recent activity</h2>
          {d.recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet. Add your first one above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {d.recent.map((t) => {
                const cat = t.category_id ? catMap[t.category_id] : null;
                const acc = accounts.find((a) => a.id === t.account_id);
                const sign =
                  t.kind === "income" ? "+" : t.kind === "expense" ? "-" : "↔";
                const tone =
                  t.kind === "income"
                    ? "text-success"
                    : t.kind === "expense"
                      ? "text-destructive"
                      : "text-info";
                return (
                  <li key={t.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {t.description || cat?.name || t.kind}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(t.occurred_at).toLocaleDateString()} · {acc?.name ?? ""}
                        {cat ? ` · ${cat.name}` : ""}
                      </div>
                    </div>
                    <div className={`tabular text-sm font-semibold ${tone}`}>
                      {sign} {formatMoney(t.amount_minor, t.currency)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card-elevated p-5">
          <h2 className="mb-4 text-sm font-medium">Accounts</h2>
          {accounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No accounts yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {accounts.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatAccountType(a.type)}
                    </div>
                  </div>
                  <div className="tabular text-sm">
                    {formatMoney(a.current_balance_minor, a.currency)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "destructive";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-md ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 tabular text-2xl font-semibold">{value}</div>
    </div>
  );
}

function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

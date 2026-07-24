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
import { WORKSPACE_CONFIGS, WorkspaceType } from "@/lib/modules";
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
  Building2,
  Landmark,
  GraduationCap,
  Home,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Plus,
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
      <span>Loading adaptive financial operating system...</span>
    </div>
  ),
});

function DashboardPage() {
  const { data: d } = useSuspenseQuery(dashboardQuery);
  const { data: accounts } = useSuspenseQuery(accountsQuery);
  const { profile } = useProfile();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);

  const workspace = profile?.workspaceType || "personal";
  const workspaceConfig = WORKSPACE_CONFIGS[workspace];

  // Time-aware greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const baseCurrency = profile?.baseCurrency || "USD";
  const ccyInfo = getCurrencyInfo(baseCurrency);

  const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <UserAvatar
            displayName={profile?.displayName}
            avatarUrl={profile?.avatarUrl}
            size="lg"
            className="ring-2 ring-primary/20 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {getGreeting()}, {profile?.displayName || "User"}
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                <span>{workspaceConfig.icon}</span>
                <span className="ml-1">{workspaceConfig.badge}</span>
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                {currentDateFormatted}
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setCurrencyPickerOpen(true)}
                className="flex items-center gap-1 hover:text-foreground font-semibold transition"
              >
                <span>{ccyInfo.flag}</span>
                <span>{ccyInfo.code}</span>
                <span className="text-muted-foreground">({ccyInfo.symbol})</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setQuickAddOpen(true)}
            size="sm"
            className="font-bold text-xs shadow-xs bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Quick Transaction
          </Button>
        </div>
      </div>

      {/* RENDER ADAPTIVE DASHBOARD WORKSPACE */}
      {workspace === "business" && <BusinessDashboard d={d} accounts={accounts} ccy={baseCurrency} />}
      {workspace === "investor" && <InvestorDashboard d={d} accounts={accounts} ccy={baseCurrency} />}
      {workspace === "student" && <StudentDashboard d={d} accounts={accounts} ccy={baseCurrency} />}
      {workspace === "family" && <FamilyDashboard d={d} accounts={accounts} ccy={baseCurrency} />}
      {workspace === "personal" && <PersonalDashboard d={d} accounts={accounts} ccy={baseCurrency} colors={COLORS} />}

      {/* Global Quick Add Transaction Modal */}
      <QuickAddTransaction open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      {/* Currency Picker Modal */}
      <CurrencyPickerModal
        open={currencyPickerOpen}
        onOpenChange={setCurrencyPickerOpen}
        selectedCurrency={baseCurrency}
        onSelectCurrency={() => {}}
      />
    </div>
  );
}

// ----------------------------------------------------
// 1. PERSONAL DASHBOARD
// ----------------------------------------------------
function PersonalDashboard({ d, accounts, ccy, colors }: any) {
  const categoryTotalsList = Array.isArray(d?.categoryTotals)
    ? d.categoryTotals
    : typeof d?.categoryTotals === "object" && d?.categoryTotals !== null
      ? Object.entries(d.categoryTotals).map(([cat, amt]: [string, any]) => ({
          category: cat,
          amount: (Number(amt) || 0) / 100,
        }))
      : [];

  return (
    <div className="space-y-6">
      {/* Primary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card-elevated p-5 space-y-2 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Net Worth Overview</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="text-3xl font-extrabold text-foreground tracking-tight">
            {formatMoney(d.netWorthMinor, ccy)}
          </p>
          <p className="text-xs text-muted-foreground">
            Combined balance across {accounts.length} active account{accounts.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>This Month Income</span>
            <ArrowDownRight className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatMoney(d.monthIncomeMinor, ccy)}
          </p>
          <p className="text-xs text-muted-foreground">Earned since start of current month</p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>This Month Expenses</span>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {formatMoney(d.monthExpenseMinor, ccy)}
          </p>
          <p className="text-xs text-muted-foreground">Spent since start of current month</p>
        </div>
      </div>

      {/* Cash Flow Chart & Category Pie */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">6-Month Cash Flow</h3>
              <p className="text-xs text-muted-foreground">Monthly income vs expense trend</p>
            </div>
            <Badge variant="outline" className="text-xs">
              Historical
            </Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.cashFlow}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [formatMoney(val , ccy)]}
                />
                <Area type="monotone" dataKey="income" stroke="#10B981" fill="url(#incGrad)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" fill="url(#expGrad)" strokeWidth={2} name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Chart */}
        <div className="card-elevated p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Spending Breakdown</h3>
            <p className="text-xs text-muted-foreground">Top expense categories</p>
          </div>
          {categoryTotalsList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
              <span>No expense data for this period</span>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotalsList}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categoryTotalsList.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(val: number) => [formatMoney(val * 100, ccy)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. BUSINESS DASHBOARD
// ----------------------------------------------------
function BusinessDashboard({ d, accounts, ccy }: any) {
  const profitMinor = d.monthIncomeMinor - d.monthExpenseMinor;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-elevated p-5 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground block">Gross Revenues</span>
          <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            {formatMoney(d.monthIncomeMinor, ccy)}
          </p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground block">Operating Expenses</span>
          <p className="text-2xl font-extrabold text-rose-600 tracking-tight">
            {formatMoney(d.monthExpenseMinor, ccy)}
          </p>
        </div>

        <div className="card-elevated p-5 space-y-2 bg-primary/5 border-primary/20">
          <span className="text-xs font-semibold text-primary block">Net Profit / Margin</span>
          <p className={`text-2xl font-extrabold tracking-tight ${profitMinor >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatMoney(profitMinor, ccy)}
          </p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground block">Liquid Reserve</span>
          <p className="text-2xl font-extrabold text-foreground tracking-tight">
            {formatMoney(d.netWorthMinor, ccy)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-elevated p-5 space-y-3">
          <h3 className="text-base font-bold text-foreground">Business Accounts Liquidity</h3>
          <div className="space-y-2">
            {accounts.map((acc: any) => (
              <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold">{acc.name}</span>
                </div>
                <span className="text-sm font-extrabold font-mono">{formatMoney(acc.current_balance_minor, acc.currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5 space-y-3">
          <h3 className="text-base font-bold text-foreground">Tax & Document Readiness</h3>
          <p className="text-xs text-muted-foreground">Receipt Vault compliance status</p>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400">All Financial Evidence Backed Up</h4>
              <p className="text-[11px] text-emerald-600/80">Every business expenditure is linked to supporting receipt documents.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. INVESTOR DASHBOARD
// ----------------------------------------------------
function InvestorDashboard({ d, accounts, ccy }: any) {
  return (
    <div className="space-y-6">
      <div className="card-elevated p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">Total Net Worth Ticker</span>
          <Landmark className="h-5 w-5 text-indigo-400" />
        </div>
        <p className="text-4xl font-extrabold tracking-tight text-white">{formatMoney(d.netWorthMinor, ccy)}</p>
        <p className="text-xs text-indigo-200">Across liquid bank accounts, holdings, and portfolio capital</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card-elevated p-5 space-y-3">
          <h3 className="text-base font-bold text-foreground">Asset Class Allocations</h3>
          <div className="space-y-2">
            {accounts.map((acc: any) => (
              <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                <span className="text-xs font-bold">{acc.name} ({formatAccountType(acc.type)})</span>
                <span className="text-sm font-extrabold font-mono">{formatMoney(acc.current_balance_minor, acc.currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-5 space-y-3">
          <h3 className="text-base font-bold text-foreground">Liquidity & Capital Growth</h3>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <span className="text-xs font-semibold text-primary block">Monthly Savings Rate</span>
            <p className="text-2xl font-extrabold text-foreground">
              {d.monthIncomeMinor > 0 ? `${Math.round(((d.monthIncomeMinor - d.monthExpenseMinor) / d.monthIncomeMinor) * 100)}%` : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. STUDENT DASHBOARD
// ----------------------------------------------------
function StudentDashboard({ d, accounts, ccy }: any) {
  const dailySpendLimit = 50; // default pocket money limit
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-elevated p-5 space-y-2 bg-emerald-500/10 border-emerald-500/20">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Student Wallet Balance</span>
          <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{formatMoney(d.netWorthMinor, ccy)}</p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <span className="text-xs font-bold text-muted-foreground block">Monthly Allowance Spent</span>
          <p className="text-3xl font-extrabold text-foreground">{formatMoney(d.monthExpenseMinor, ccy)}</p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <span className="text-xs font-bold text-muted-foreground block">Total Pocket Money Received</span>
          <p className="text-3xl font-extrabold text-foreground">{formatMoney(d.monthIncomeMinor, ccy)}</p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. FAMILY DASHBOARD
// ----------------------------------------------------
function FamilyDashboard({ d, accounts, ccy }: any) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card-elevated p-5 space-y-2 bg-amber-500/10 border-amber-500/20">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">Household Combined Balance</span>
          <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400">{formatMoney(d.netWorthMinor, ccy)}</p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <span className="text-xs font-bold text-muted-foreground block">Family Income This Month</span>
          <p className="text-3xl font-extrabold text-emerald-600">{formatMoney(d.monthIncomeMinor, ccy)}</p>
        </div>

        <div className="card-elevated p-5 space-y-2">
          <span className="text-xs font-bold text-muted-foreground block">Family Living Expenses</span>
          <p className="text-3xl font-extrabold text-rose-600">{formatMoney(d.monthExpenseMinor, ccy)}</p>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getDashboard, listCategories, listBudgets } from "@/lib/finance.functions";
import { generateFinancialInsights } from "@/lib/insights-engine";
import { generateCashFlowForecast } from "@/lib/forecast-engine";
import { calculateHealthScoreV2 } from "@/lib/health-score";
import { formatMoney } from "@/lib/money";
import { useProfile } from "@/hooks/useProfile";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const insightsQuery = queryOptions({
  queryKey: ["insights_dashboard"],
  queryFn: async () => {
    const [d, categories, budgets] = await Promise.all([
      getDashboard(),
      listCategories(),
      listBudgets(),
    ]);

    return {
      d,
      categories,
      budgets,
    };
  },
});

export const Route = createFileRoute("/_authenticated/insights")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(insightsQuery);
  },
  component: InsightsPage,
  pendingComponent: () => (
    <div className="p-12 text-center text-sm font-semibold text-muted-foreground flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span>Running financial intelligence engine...</span>
    </div>
  ),
});

function InsightsPage() {
  const { data } = useSuspenseQuery(insightsQuery);
  const { profile } = useProfile();
  const baseCurrency = profile?.baseCurrency || "USD";

  const { d, categories, budgets } = data;

  // 1. Generate Deterministic Insights
  const insights = generateFinancialInsights({
    transactions: d.recent || [],
    accounts: d.accounts || [],
    categories: categories || [],
    budgets: budgets || [],
  });

  // 2. Generate Cash Flow Forecast
  const forecastPoints = generateCashFlowForecast({
    netWorthMinor: d.netWorthMinor || 0,
    monthIncomeMinor: d.monthIncomeMinor || 0,
    monthExpenseMinor: d.monthExpenseMinor || 0,
  });

  // 3. Compute Health Score v2
  const healthResult = calculateHealthScoreV2({
    netWorthMinor: d.netWorthMinor || 0,
    monthIncomeMinor: d.monthIncomeMinor || 0,
    monthExpenseMinor: d.monthExpenseMinor || 0,
    accounts: d.accounts || [],
    budgets: budgets || [],
  });

  const chartData = forecastPoints.map((pt) => ({
    label: pt.label,
    expected: pt.expectedMinor / 100,
    bestCase: pt.bestCaseMinor / 100,
    worstCase: pt.worstCaseMinor / 100,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                Smart Financial Assistant
              </h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                v2.0 Intelligent
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Automated pattern discovery, 90-day cash flow forecast, and health diagnostics
            </p>
          </div>
        </div>
      </div>

      {/* Top Grid: Health Score v2 & Quick Forecast */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Health Score v2 Gauge Card */}
        <div className="card-elevated p-6 space-y-4 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Health Score v2</h3>
            </div>
            <Badge
              variant="outline"
              className={`text-xs font-bold ${
                healthResult.score >= 80
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  : healthResult.score >= 60
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/30"
              }`}
            >
              Grade {healthResult.grade} • {healthResult.status}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-foreground">
              {healthResult.score}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
          </div>

          <Progress value={healthResult.score} className="h-2.5" />

          {/* Deductions breakdown */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Diagnostic Audit
            </h4>
            {healthResult.deductions.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>All health metrics are optimal! Perfect score.</span>
              </div>
            ) : (
              healthResult.deductions.map((ded, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-muted/50 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-foreground">{ded.factor}</span>
                    <span className="text-rose-500 font-bold">-{ded.pointsDeducted} pts</span>
                  </div>
                  <p className="text-muted-foreground">{ded.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 90-Day Cash Flow Forecast Area Chart */}
        <div className="card-elevated p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">90-Day Cash Flow Forecast</h3>
              <p className="text-xs text-muted-foreground">Expected vs Best vs Worst case balance projection</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Best
              </span>
              <span className="flex items-center gap-1 text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> Expected
              </span>
              <span className="flex items-center gap-1 text-rose-500">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Worst
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="worstGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="label" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [formatMoney(val * 100, baseCurrency)]}
                />
                <Area type="monotone" dataKey="bestCase" stroke="#10B981" fill="url(#bestGrad)" strokeWidth={2} name="Best Case" />
                <Area type="monotone" dataKey="expected" stroke="#2563EB" fill="url(#expGrad)" strokeWidth={2.5} name="Expected" />
                <Area type="monotone" dataKey="worstCase" stroke="#EF4444" fill="url(#worstGrad)" strokeWidth={2} name="Worst Case" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Automated Financial Insights Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-foreground">Discovered Spending Patterns</h2>
          <p className="text-xs text-muted-foreground">Automated insights from your recent transactions</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((item) => (
            <div
              key={item.id}
              className={`card-elevated p-5 space-y-3 border ${
                item.type === "warning"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : item.type === "positive"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : item.type === "positive" ? (
                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Zap className="h-4 w-4 text-primary" />
                  )}
                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                </div>
                {item.metric && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {item.metric}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

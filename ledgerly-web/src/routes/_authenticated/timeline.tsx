import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getDashboard, listAccounts } from "@/lib/finance.functions";
import { calculateMoneyBuckets } from "@/lib/buckets-engine";
import { calculateEmergencyFundAdvisor, evaluateFinancialMilestones } from "@/lib/advisor-engine";
import { formatMoney } from "@/lib/money";
import { useProfile } from "@/hooks/useProfile";
import {
  Calendar,
  ShieldAlert,
  Award,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const timelineQuery = queryOptions({
  queryKey: ["timeline_core"],
  queryFn: async () => {
    const [accounts, d] = await Promise.all([listAccounts(), getDashboard()]);
    return { accounts, d };
  },
});

export const Route = createFileRoute("/_authenticated/timeline")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(timelineQuery);
  },
  component: UpcomingTimelinePage,
  pendingComponent: () => (
    <div className="p-12 text-center text-sm font-semibold text-muted-foreground flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span>Loading cash flow timeline & money buckets...</span>
    </div>
  ),
});

function UpcomingTimelinePage() {
  const { data } = useSuspenseQuery(timelineQuery);
  const { profile } = useProfile();
  const baseCurrency = profile?.baseCurrency || "USD";

  const { accounts, d } = data;

  // 1. Calculate Money Buckets
  const buckets = calculateMoneyBuckets(accounts || []);

  // 2. Emergency Fund Advisor
  const emergencyAdvisor = calculateEmergencyFundAdvisor({
    liquidBalanceMinor: d.netWorthMinor || 0,
    monthlyExpenseMinor: d.monthExpenseMinor || 0,
  });

  // 3. Evaluate Milestones
  const milestones = evaluateFinancialMilestones({
    transactionCount: (d.recent || []).length,
    netWorthMinor: d.netWorthMinor || 0,
    budgetExceededCount: 0,
    savingsGoalsCount: 2,
  });

  // Upcoming simulated events
  const upcomingEvents = [
    { id: "1", title: "Monthly Rent Payment", amountMinor: 120000, type: "expense", date: "In 3 Days", category: "Housing" },
    { id: "2", title: "Tech Corp Payroll Deposit", amountMinor: 350000, type: "income", date: "In 7 Days", category: "Salary" },
    { id: "3", title: "Cloud Subscriptions", amountMinor: 2999, type: "expense", date: "In 12 Days", category: "Services" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Upcoming Money Timeline
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Money Buckets classification, cash flow planner, and emergency fund runway advisor
            </p>
          </div>
        </div>
      </div>

      {/* Top Section: Money Buckets Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-elevated p-5 space-y-2 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Available to Spend</span>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{formatMoney(buckets.availableMinor, baseCurrency)}</p>
          <p className="text-xs text-muted-foreground">Checking accounts & liquid cash</p>
        </div>

        <div className="card-elevated p-5 space-y-2 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reserved Funds</span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{formatMoney(buckets.reservedMinor, baseCurrency)}</p>
          <p className="text-xs text-muted-foreground">Emergency & upcoming bill reserves</p>
        </div>

        <div className="card-elevated p-5 space-y-2 border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Invested Assets</span>
            <ArrowUpRight className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{formatMoney(buckets.investedMinor, baseCurrency)}</p>
          <p className="text-xs text-muted-foreground">Brokerage, crypto & retirement</p>
        </div>

        <div className="card-elevated p-5 space-y-2 border-slate-500/20 bg-slate-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Locked / Fixed</span>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-black text-foreground">{formatMoney(buckets.lockedMinor, baseCurrency)}</p>
          <p className="text-xs text-muted-foreground">Fixed deposits & mortgages</p>
        </div>
      </div>

      {/* Middle Grid: Emergency Fund Runway & Milestones */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Emergency Fund Advisor */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-500" />
              <h2 className="text-base font-bold text-foreground">Emergency Fund Runway Advisor</h2>
            </div>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              {emergencyAdvisor.monthsRunway.toFixed(1)} Months Runway
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Current Reserve</span>
              <span className="text-foreground">{formatMoney(emergencyAdvisor.currentFundMinor, baseCurrency)} / {formatMoney(emergencyAdvisor.recommendedFundMinor, baseCurrency)}</span>
            </div>
            <Progress value={Math.min(100, (emergencyAdvisor.currentFundMinor / emergencyAdvisor.recommendedFundMinor) * 100)} className="h-2.5" />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Your current liquid assets provide <strong className="text-foreground">{emergencyAdvisor.monthsRunway.toFixed(1)} months</strong> of essential living expenses. Target recommendation is 6 months.
          </p>
        </div>

        {/* Financial Milestones */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-foreground">Financial Milestone Badges</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {milestones.map((m) => (
              <div key={m.id} className={`p-3 rounded-xl border text-xs space-y-1.5 ${m.unlocked ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card"}`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-foreground">{m.icon} {m.title}</span>
                  <Badge variant="outline" className="text-[10px]">{m.unlocked ? "Unlocked" : `${m.progressPct}%`}</Badge>
                </div>
                <p className="text-muted-foreground text-[11px] leading-snug">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Money Timeline */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-foreground">Scheduled Cash Flow Timeline</h2>
          <p className="text-xs text-muted-foreground">Upcoming bills, salary inflows, and loan payments</p>
        </div>

        <div className="space-y-3">
          {upcomingEvents.map((evt) => (
            <div key={evt.id} className="card-elevated p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${evt.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                  {evt.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{evt.title}</h4>
                  <p className="text-xs text-muted-foreground">{evt.category} • {evt.date}</p>
                </div>
              </div>
              <span className={`text-sm font-mono font-bold ${evt.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                {evt.type === "income" ? "+" : "-"}{formatMoney(evt.amountMinor, baseCurrency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

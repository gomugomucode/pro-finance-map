import { formatMoney } from "@/lib/money";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, ShieldCheck, TrendingUp, AlertCircle, Sparkles } from "lucide-react";

export function FinancialHealthCard({
  netWorth,
  monthlyIncome,
  monthlyExpense,
  savingsRate,
  currency,
}: {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
  currency: string;
}) {
  // Score formula:
  // 1. Savings Rate component (max 40 pts): savingsRate% -> (savingsRate / 50) * 40
  // 2. Net Worth / Emergency runway (max 40 pts): runway = netWorth / monthlyExpense -> (runway / 6) * 40
  // 3. Positive Cash Flow (20 pts): income > expense ? 20 : 0
  const runwayMonths = monthlyExpense > 0 ? (netWorth / monthlyExpense).toFixed(1) : "N/A";
  const savingsPts = Math.min(Math.max((savingsRate / 50) * 40, 0), 40);
  const runwayVal = monthlyExpense > 0 ? netWorth / monthlyExpense : 0;
  const runwayPts = Math.min(Math.max((runwayVal / 6) * 40, 0), 40);
  const cashFlowPts = monthlyIncome >= monthlyExpense ? 20 : 5;

  const totalScore = Math.min(Math.round(savingsPts + runwayPts + cashFlowPts), 100);

  const getTier = (s: number) => {
    if (s >= 85) return { label: "Excellent", color: "text-success", bg: "bg-success/10" };
    if (s >= 70) return { label: "Good", color: "text-primary", bg: "bg-primary/10" };
    if (s >= 50) return { label: "Fair", color: "text-amber-500", bg: "bg-amber-500/10" };
    return { label: "Needs Attention", color: "text-destructive", bg: "bg-destructive/10" };
  };

  const tier = getTier(totalScore);

  return (
    <div className="card-elevated p-6 space-y-5 border-l-4 border-l-primary">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-xl ${tier.bg} ${tier.color}`}>
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Financial Health Score
              <Badge className={`${tier.bg} ${tier.color} border-none font-semibold text-xs`}>
                {tier.label}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Algorithmic assessment based on runway, savings velocity, and net burn rate.
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-extrabold tracking-tight tabular">{totalScore}</div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase">out of 100</div>
        </div>
      </div>

      <Progress value={totalScore} className="h-3 bg-muted" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
        <div>
          <div className="text-xs text-muted-foreground">Savings Rate</div>
          <div className="text-base font-bold tabular">{Math.round(savingsRate)}%</div>
          <p className="text-[11px] text-muted-foreground">Target: 20%+ of monthly income</p>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Financial Runway</div>
          <div className="text-base font-bold tabular">{runwayMonths} months</div>
          <p className="text-[11px] text-muted-foreground">Target: 6 months emergency cushion</p>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Net Monthly Cashflow</div>
          <div
            className={`text-base font-bold tabular ${
              monthlyIncome >= monthlyExpense ? "text-success" : "text-destructive"
            }`}
          >
            {formatMoney(monthlyIncome - monthlyExpense, currency, 2, { signed: true })}
          </div>
          <p className="text-[11px] text-muted-foreground">Positive monthly surplus</p>
        </div>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { getNetWorthSummary } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark, ShieldCheck, CreditCard, Scale, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#6366F1"];

export function NetWorthDashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["net_worth_summary"],
    queryFn: () => getNetWorthSummary(),
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) return null;

  const chartData = [
    { name: "Liquid Bank Balances", value: summary.liquidBankTotalMinor / 100 },
    { name: "Assets & Properties", value: summary.assetsTotalMinor / 100 },
  ].filter((d) => d.value > 0);

  const liabilityChartData = [
    { name: "Direct Liabilities & Credit", value: summary.liabilitiesTotalMinor / 100 },
    { name: "Active Loan Balances", value: summary.loansTotalMinor / 100 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Real Net Worth Banner */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 via-background to-accent/20 border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase text-primary tracking-wider flex items-center gap-1.5">
              <Scale className="h-4 w-4" /> Real Net Worth Command Center
            </span>
            <div className="text-3xl font-extrabold tabular text-foreground">
              {formatMoney(summary.netWorthMinor, "USD")}
            </div>
            <p className="text-xs text-muted-foreground">
              Calculated across {summary.assetCount} assets, bank liquid balances, and {summary.liabilityCount} liabilities/loans.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="p-3 rounded-xl bg-card border border-border space-y-0.5">
              <span className="text-muted-foreground">Total Assets:</span>
              <div className="text-base text-success font-bold tabular">
                {formatMoney(summary.grandTotalAssetsMinor, "USD")}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border space-y-0.5">
              <span className="text-muted-foreground">Total Liabilities:</span>
              <div className="text-base text-destructive font-bold tabular">
                {formatMoney(summary.grandTotalLiabilitiesMinor, "USD")}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border space-y-0.5">
              <span className="text-muted-foreground">Debt Ratio:</span>
              <div className={`text-base font-bold tabular ${summary.debtRatioPercent < 40 ? "text-success" : "text-amber-400"}`}>
                {summary.debtRatioPercent}%
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Visual Asset Allocation Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Landmark className="h-4 w-4 text-success" /> Asset Allocation Distribution
          </h4>

          {chartData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Add liquid accounts or assets to view distribution.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2 text-destructive">
            <CreditCard className="h-4 w-4" /> Debt & Liabilities Breakdown
          </h4>

          {liabilityChartData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Zero liabilities logged. Outstanding financial standing!</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={liabilityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {liabilityChartData.map((_, index) => (
                      <Cell key={`cell-liab-${index}`} fill={index === 0 ? "#EF4444" : "#F59E0B"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

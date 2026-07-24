import { useMemo } from "react";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Store, TrendingUp, Award, Zap } from "lucide-react";

interface MerchantAnalyticsProps {
  merchants: any[];
}

export function MerchantAnalytics({ merchants }: MerchantAnalyticsProps) {
  const topMerchantsBySpend = useMemo(() => {
    return [...merchants]
      .sort((a, b) => Number(b.total_spent_minor || 0) - Number(a.total_spent_minor || 0))
      .slice(0, 5);
  }, [merchants]);

  const topMerchantsByVisits = useMemo(() => {
    return [...merchants]
      .sort((a, b) => Number(b.visit_count || 0) - Number(a.visit_count || 0))
      .slice(0, 5);
  }, [merchants]);

  const chartData = useMemo(() => {
    return topMerchantsBySpend.map((m) => ({
      name: m.name.length > 12 ? `${m.name.slice(0, 10)}...` : m.name,
      spent: Number(m.total_spent_minor || 0) / 100,
    }));
  }, [topMerchantsBySpend]);

  const COLORS = ["#3B82F6", "#22D3A0", "#F59E0B", "#EC4899", "#8B5CF6"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Spent Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Top Spent Merchants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No merchant data yet.</p>
            ) : (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: number) => `$${val.toFixed(2)}`}
                      contentStyle={{ backgroundColor: "#1F2937", borderRadius: "8px", border: "none" }}
                    />
                    <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Visited Leaderboard */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> Most Visited Merchants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topMerchantsByVisits.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No visits recorded.</p>
            ) : (
              topMerchantsByVisits.map((m, idx) => (
                <div key={m.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-muted font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-foreground">{m.name}</span>
                      <p className="text-[10px] text-muted-foreground">{m.categories?.name ?? "General"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary">{m.visit_count || 1} visits</span>
                    <p className="text-[10px] text-muted-foreground tabular">
                      {formatMoney(m.total_spent_minor || 0, "USD")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

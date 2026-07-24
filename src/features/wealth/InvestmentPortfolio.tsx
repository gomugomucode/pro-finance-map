import { useQuery } from "@tanstack/react-query";
import { listAssets } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Coins, Activity } from "lucide-react";

export function InvestmentPortfolio() {
  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => listAssets(),
  });

  const investments = assets.filter((a) =>
    ["stocks", "mutual_funds", "crypto", "nft", "gold", "bonds"].includes(a.asset_type)
  );

  const totalCurrentValueMinor = investments.reduce((sum, i) => sum + Number(i.current_value_minor || 0), 0);
  const totalPurchaseCostMinor = investments.reduce((sum, i) => sum + Number(i.purchase_value_minor || 0), 0);
  const totalGainMinor = totalCurrentValueMinor - totalPurchaseCostMinor;
  const totalReturnPercent = totalPurchaseCostMinor > 0 ? ((totalGainMinor / totalPurchaseCostMinor) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Portfolio Market Value</span>
          <div className="text-xl font-bold tabular">{formatMoney(totalCurrentValueMinor, "USD")}</div>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Invested Capital</span>
          <div className="text-xl font-semibold tabular text-muted-foreground">{formatMoney(totalPurchaseCostMinor, "USD")}</div>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Total Unrealized Profit / Loss</span>
          <div className={`text-xl font-bold tabular flex items-center gap-1 ${totalGainMinor >= 0 ? "text-success" : "text-destructive"}`}>
            {totalGainMinor >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {formatMoney(Math.abs(totalGainMinor), "USD")} ({totalGainMinor >= 0 ? "+" : "-"}{totalReturnPercent}%)
          </div>
        </Card>
      </div>

      {/* Investment Assets Table */}
      {investments.length === 0 ? (
        <Card className="p-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No active investments found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add stocks, crypto, mutual funds, or gold in Assets to view your live portfolio return metrics.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="p-3">Asset</th>
                <th className="p-3">Type</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Purchase Cost</th>
                <th className="p-3">Current Market Value</th>
                <th className="p-3 text-right">Gain / Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {investments.map((inv) => {
                const gainMinor = inv.current_value_minor - (inv.purchase_value_minor || 0);
                const retPct = inv.purchase_value_minor > 0 ? ((gainMinor / inv.purchase_value_minor) * 100).toFixed(1) : "0.0";

                return (
                  <tr key={inv.id} className="hover:bg-muted/30 transition">
                    <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                      {inv.symbol && <Badge variant="outline" className="font-mono text-[10px]">{inv.symbol}</Badge>}
                      {inv.name}
                    </td>
                    <td className="p-3 capitalize text-muted-foreground">{inv.asset_type.replace("_", " ")}</td>
                    <td className="p-3 font-mono">{inv.quantity || 1}</td>
                    <td className="p-3 tabular">{inv.purchase_value_minor ? formatMoney(inv.purchase_value_minor, inv.currency) : "—"}</td>
                    <td className="p-3 font-bold tabular text-foreground">{formatMoney(inv.current_value_minor, inv.currency)}</td>
                    <td className={`p-3 text-right font-bold tabular ${gainMinor >= 0 ? "text-success" : "text-destructive"}`}>
                      {gainMinor >= 0 ? "+" : "-"}{formatMoney(Math.abs(gainMinor), inv.currency)} ({gainMinor >= 0 ? "+" : ""}{retPct}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

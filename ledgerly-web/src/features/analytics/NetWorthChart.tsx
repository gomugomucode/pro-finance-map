import { formatMoney } from "@/lib/money";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function NetWorthChart({
  points,
  currency,
}: {
  points: Array<{ month: string; net_worth_minor: number }>;
  currency: string;
}) {
  const data = points.map((p) => ({
    month: p.month,
    value: Number(p.net_worth_minor) / 100,
  }));

  const latestVal = points[points.length - 1]?.net_worth_minor ?? 0;
  const firstVal = points[0]?.net_worth_minor ?? 0;
  const growth = latestVal - firstVal;

  return (
    <div className="card-elevated p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-semibold">Net Worth Timeline</h3>
          <p className="text-xs text-muted-foreground">
            Cumulative balance trajectory across all linked liquidity & asset accounts.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Current Net Worth</div>
          <div className="text-xl font-bold tabular">{formatMoney(latestVal, currency)}</div>
          <div className={`text-xs font-semibold ${growth >= 0 ? "text-success" : "text-destructive"}`}>
            {growth >= 0 ? "+" : ""}{formatMoney(growth, currency)} overall
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.82 0.16 165)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.82 0.16 165)" stopOpacity={0} />
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
            <Area
              type="monotone"
              dataKey="value"
              name="Net Worth"
              stroke="oklch(0.82 0.16 165)"
              fill="url(#netWorthGrad)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

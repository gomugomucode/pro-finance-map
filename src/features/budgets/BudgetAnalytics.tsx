import { formatMoney } from "@/lib/money";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BudgetWithUsage } from "./BudgetList";

export function BudgetAnalytics({ budgets }: { budgets: BudgetWithUsage[] }) {
  if (budgets.length === 0) return null;

  const data = budgets.map((b) => ({
    name: b.name,
    budget: Number(b.amount_minor + b.carried_over_minor) / 100,
    spent: Number(b.spent_minor) / 100,
    currency: b.currency,
  }));

  const totalBudget = budgets.reduce((acc, b) => acc + (b.amount_minor + b.carried_over_minor), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_minor, 0);
  const currency = budgets[0]?.currency ?? "USD";
  const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="card-elevated p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-semibold">Budget Performance & Analytics</h3>
          <p className="text-xs text-muted-foreground">
            Comparison of allocated target limits vs actual real-time expenditure.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-muted-foreground">Total Budget</div>
            <div className="text-lg font-semibold tabular">{formatMoney(totalBudget, currency)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Spent</div>
            <div className="text-lg font-semibold tabular text-primary">{formatMoney(totalSpent, currency)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Usage</div>
            <div className={`text-lg font-semibold tabular ${overallPercent > 100 ? "text-destructive" : "text-success"}`}>
              {overallPercent}%
            </div>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "oklch(0.72 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.72 0.02 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.21 0.025 260)",
                border: "1px solid oklch(1 0 0 / 0.1)",
                borderRadius: 12,
                color: "white",
              }}
            />
            <Bar dataKey="budget" name="Budget Limit" fill="oklch(0.82 0.16 165 / 0.4)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" name="Actual Spent" fill="oklch(0.82 0.16 165)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

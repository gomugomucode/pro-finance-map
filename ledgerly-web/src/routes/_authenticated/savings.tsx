import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listSavingsGoals } from "@/lib/finance.functions";
import { SavingsGoalCard } from "@/features/savings/SavingsGoalCard";
import { SavingsGoalForm } from "@/features/savings/SavingsGoalForm";
import { formatMoney } from "@/lib/money";
import { PiggyBank, Target, ShieldCheck, Award } from "lucide-react";

const savingsQuery = queryOptions({
  queryKey: ["savings_goals"],
  queryFn: () => listSavingsGoals(),
});

export const Route = createFileRoute("/_authenticated/savings")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(savingsQuery);
  },
  component: SavingsPage,
  pendingComponent: () => <div className="p-8 text-sm text-muted-foreground">Loading savings goals...</div>,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

function SavingsPage() {
  const { data: goals = [] } = useSuspenseQuery(savingsQuery);

  const totalSaved = goals.reduce((s, g) => s + Number(g.current_minor), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_minor), 0);
  const currency = goals[0]?.currency ?? "USD";
  const completedCount = goals.filter((g) => g.is_completed || g.current_minor >= g.target_minor).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Savings Goals</h1>
          <p className="text-sm text-muted-foreground">
            Build wealth towards long-term targets, emergency reserves, and milestones.
          </p>
        </div>
        <SavingsGoalForm />
      </div>

      {/* Summary KPI header */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Total Saved</div>
            <div className="text-xl font-bold tabular">{formatMoney(totalSaved, currency)}</div>
          </div>
        </div>

        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-info/10 text-info">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Total Target</div>
            <div className="text-xl font-bold tabular">{formatMoney(totalTarget, currency)}</div>
          </div>
        </div>

        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Goals Completed</div>
            <div className="text-xl font-bold tabular">
              {completedCount} / {goals.length}
            </div>
          </div>
        </div>
      </div>

      {/* Goal Cards Grid */}
      {goals.length === 0 ? (
        <div className="card-elevated p-12 text-center space-y-3">
          <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">No savings goals yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Set up an Emergency Fund, Vacation, or House fund to start accumulating target savings.
          </p>
          <div className="pt-2">
            <SavingsGoalForm />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <SavingsGoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}
    </div>
  );
}

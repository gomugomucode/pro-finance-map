import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listBudgets, listCategories } from "@/lib/finance.functions";
import { BudgetList } from "@/features/budgets/BudgetList";
import { BudgetForm } from "@/features/budgets/BudgetForm";
import { BudgetAnalytics } from "@/features/budgets/BudgetAnalytics";
import { PieChart, Plus } from "lucide-react";

const budgetsQuery = queryOptions({
  queryKey: ["budgets"],
  queryFn: () => listBudgets(),
});

const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
});

export const Route = createFileRoute("/_authenticated/budgets")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(budgetsQuery);
    context.queryClient.ensureQueryData(categoriesQuery);
  },
  component: BudgetsPage,
  pendingComponent: () => <div className="p-8 text-sm text-muted-foreground">Loading budgets...</div>,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

function BudgetsPage() {
  const { data: budgets = [] } = useSuspenseQuery(budgetsQuery);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Track spending against custom monthly, weekly, yearly, or category limits.
          </p>
        </div>
        <BudgetForm />
      </div>

      <BudgetAnalytics budgets={budgets} />

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Active Budgets ({budgets.length})</h2>
        <BudgetList budgets={budgets} />
      </div>
    </div>
  );
}

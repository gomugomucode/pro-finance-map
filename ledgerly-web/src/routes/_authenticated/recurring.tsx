import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listRecurringTransactions } from "@/lib/finance.functions";
import { RecurringList } from "@/features/recurring/RecurringList";
import { RecurringForm } from "@/features/recurring/RecurringForm";
import { formatMoney } from "@/lib/money";
import { Repeat, Calendar, Zap, AlertCircle } from "lucide-react";

const recurringQuery = queryOptions({
  queryKey: ["recurring_transactions"],
  queryFn: () => listRecurringTransactions(),
});

export const Route = createFileRoute("/_authenticated/recurring")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(recurringQuery);
  },
  component: RecurringPage,
  pendingComponent: () => <div className="p-8 text-sm text-muted-foreground">Loading recurring rules...</div>,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

function RecurringPage() {
  const { data: items = [] } = useSuspenseQuery(recurringQuery);

  const active = items.filter((i) => !i.is_paused);
  const paused = items.filter((i) => i.is_paused);

  const totalMonthlyCommitment = active
    .filter((i) => i.kind === "expense")
    .reduce((acc, i) => {
      let multiplier = 1;
      if (i.frequency === "daily") multiplier = 30;
      else if (i.frequency === "weekly") multiplier = 4.3;
      else if (i.frequency === "biweekly") multiplier = 2.15;
      else if (i.frequency === "quarterly") multiplier = 1 / 3;
      else if (i.frequency === "yearly") multiplier = 1 / 12;
      return acc + Number(i.amount_minor) * multiplier;
    }, 0);

  const currency = items[0]?.currency ?? "USD";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recurring Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Schedule recurring income, expenses, and automated transfers.
          </p>
        </div>
        <RecurringForm />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Repeat className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Active Schedules</div>
            <div className="text-xl font-bold tabular">{active.length} Active ({paused.length} Paused)</div>
          </div>
        </div>

        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Est. Monthly Expense</div>
            <div className="text-xl font-bold tabular">{formatMoney(totalMonthlyCommitment, currency)}</div>
          </div>
        </div>

        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-info/10 text-info">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Total Rules</div>
            <div className="text-xl font-bold tabular">{items.length} Rules</div>
          </div>
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Scheduled Rules ({items.length})</h2>
        <RecurringList items={items} />
      </div>
    </div>
  );
}

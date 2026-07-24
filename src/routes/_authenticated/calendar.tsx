import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  listTransactions,
  listSubscriptions,
  listRecurringTransactions,
  listLoans,
  listSavingsGoals,
} from "@/lib/finance.functions";
import { FinancialCalendarView, CalendarEventItem } from "@/features/calendar/FinancialCalendarView";

const txQuery = queryOptions({ queryKey: ["transactions"], queryFn: () => listTransactions({ data: { limit: 500 } }) });
const subQuery = queryOptions({ queryKey: ["subscriptions"], queryFn: () => listSubscriptions() });
const recQuery = queryOptions({ queryKey: ["recurring_transactions"], queryFn: () => listRecurringTransactions() });
const loanQuery = queryOptions({ queryKey: ["loans"], queryFn: () => listLoans() });
const goalQuery = queryOptions({ queryKey: ["savings_goals"], queryFn: () => listSavingsGoals() });

export const Route = createFileRoute("/_authenticated/calendar")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(txQuery);
    context.queryClient.ensureQueryData(subQuery);
    context.queryClient.ensureQueryData(recQuery);
    context.queryClient.ensureQueryData(loanQuery);
    context.queryClient.ensureQueryData(goalQuery);
  },
  component: CalendarPage,
  pendingComponent: () => <div className="p-8 text-sm text-muted-foreground">Loading calendar...</div>,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

function CalendarPage() {
  const { data: txs = [] } = useSuspenseQuery(txQuery);
  const { data: subs = [] } = useSuspenseQuery(subQuery);
  const { data: recs = [] } = useSuspenseQuery(recQuery);
  const { data: loans = [] } = useSuspenseQuery(loanQuery);
  const { data: goals = [] } = useSuspenseQuery(goalQuery);

  const events: CalendarEventItem[] = [
    ...txs.map((t) => ({
      id: `tx-${t.id}`,
      title: t.description || t.merchant || t.kind,
      date: t.occurred_at,
      amount_minor: t.amount_minor,
      currency: t.currency,
      type: "transaction" as const,
      kind: t.kind as any,
    })),
    ...subs.map((s) => ({
      id: `sub-${s.id}`,
      title: `Bill: ${s.name}`,
      date: s.next_renewal_date,
      amount_minor: s.amount_minor,
      currency: s.currency,
      type: "subscription" as const,
    })),
    ...recs.map((r) => ({
      id: `rec-${r.id}`,
      title: `Recurring: ${r.name}`,
      date: r.next_due_date,
      amount_minor: r.amount_minor,
      currency: r.currency,
      type: "recurring" as const,
      kind: r.kind as any,
    })),
    ...loans.filter((l) => l.due_date).map((l) => ({
      id: `loan-${l.id}`,
      title: `Loan Due (${l.direction}): ${l.description || "Debt"}`,
      date: l.due_date!,
      amount_minor: l.principal_minor - l.paid_minor,
      currency: l.currency,
      type: "loan" as const,
    })),
    ...goals.filter((g) => g.deadline).map((g) => ({
      id: `goal-${g.id}`,
      title: `Target Deadline: ${g.name}`,
      date: g.deadline!,
      amount_minor: g.target_minor,
      currency: g.currency,
      type: "goal" as const,
    })),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Unified Financial Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Visual aggregator of transactions, upcoming subscriptions, recurring rules, debt due dates, and goal deadlines.
        </p>
      </div>

      <FinancialCalendarView events={events} />
    </div>
  );
}

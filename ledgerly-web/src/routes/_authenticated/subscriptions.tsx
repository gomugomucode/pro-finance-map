import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listSubscriptions } from "@/lib/finance.functions";
import { SubscriptionList, SubscriptionItem } from "@/features/subscriptions/SubscriptionList";
import { SubscriptionForm } from "@/features/subscriptions/SubscriptionForm";
import { formatMoney } from "@/lib/money";
import { Tv, Calendar, CreditCard } from "lucide-react";

const subscriptionsQuery = queryOptions({
  queryKey: ["subscriptions"],
  queryFn: () => listSubscriptions(),
});

export const Route = createFileRoute("/_authenticated/subscriptions")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(subscriptionsQuery);
  },
  component: SubscriptionsPage,
  pendingComponent: () => <div className="p-8 text-sm text-muted-foreground">Loading subscriptions...</div>,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

function SubscriptionsPage() {
  const { data: rawItems = [] } = useSuspenseQuery(subscriptionsQuery);

  const items: SubscriptionItem[] = rawItems.map((s) => ({
    ...s,
    billing_cycle: s.billing_cycle as "weekly" | "monthly" | "yearly",
  }));

  const active = items.filter((s) => s.is_active);

  const totalMonthlyMinor = active.reduce((sum, s) => {
    if (s.billing_cycle === "monthly") return sum + Number(s.amount_minor);
    if (s.billing_cycle === "yearly") return sum + Math.round(Number(s.amount_minor) / 12);
    if (s.billing_cycle === "weekly") return sum + Math.round(Number(s.amount_minor) * 4.33);
    return sum;
  }, 0);

  const totalAnnualMinor = totalMonthlyMinor * 12;
  const currency = items[0]?.currency ?? "USD";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subscriptions & Bills</h1>
          <p className="text-sm text-muted-foreground">
            Track recurring memberships, cloud software, domain renewals, and utility bills.
          </p>
        </div>
        <SubscriptionForm />
      </div>

      {/* Analytics header cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Monthly Cost</div>
            <div className="text-xl font-bold tabular">{formatMoney(totalMonthlyMinor, currency)}</div>
          </div>
        </div>

        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-info/10 text-info">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Annualized Outflow</div>
            <div className="text-xl font-bold tabular">{formatMoney(totalAnnualMinor, currency)}</div>
          </div>
        </div>

        <div className="card-elevated p-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Active Services</div>
            <div className="text-xl font-bold tabular">{active.length} Active Services</div>
          </div>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Your Subscriptions ({items.length})</h2>
        <SubscriptionList items={items} />
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listLoans } from "@/lib/finance.functions";
import { LoanList, LoanItem } from "@/features/loans/LoanList";
import { LoanForm } from "@/features/loans/LoanForm";
import { ContactManager } from "@/features/loans/ContactManager";
import { formatMoney } from "@/lib/money";
import { HandCoins, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const loansQuery = queryOptions({
  queryKey: ["loans"],
  queryFn: () => listLoans(),
});

export const Route = createFileRoute("/_authenticated/loans")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(loansQuery);
  },
  component: LoansPage,
  pendingComponent: () => <div className="p-8 text-sm text-muted-foreground">Loading loan records...</div>,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

function LoansPage() {
  const { data: rawLoans = [] } = useSuspenseQuery(loansQuery);

  const loans: LoanItem[] = rawLoans.map((l) => ({
    ...l,
    direction: l.direction as "borrowed" | "lent",
  }));

  const borrowed = loans.filter((l) => l.direction === "borrowed");
  const lent = loans.filter((l) => l.direction === "lent");

  const totalBorrowedRemaining = borrowed.reduce(
    (acc, l) => acc + Math.max(Number(l.principal_minor) - Number(l.paid_minor), 0),
    0
  );
  const totalLentRemaining = lent.reduce(
    (acc, l) => acc + Math.max(Number(l.principal_minor) - Number(l.paid_minor), 0),
    0
  );

  const currency = loans[0]?.currency ?? "USD";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loans & Debts</h1>
          <p className="text-sm text-muted-foreground">
            Manage money owed to you and debt liabilities with installment tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ContactManager />
          <LoanForm />
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card-elevated p-5 flex items-center gap-4 border-l-4 border-l-destructive">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <ArrowDownRight className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Money I Owe (Liabilities)</div>
            <div className="text-2xl font-bold tabular text-destructive">
              {formatMoney(totalBorrowedRemaining, currency)}
            </div>
          </div>
        </div>

        <div className="card-elevated p-5 flex items-center gap-4 border-l-4 border-l-success">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Money Owed to Me (Assets)</div>
            <div className="text-2xl font-bold tabular text-success">
              {formatMoney(totalLentRemaining, currency)}
            </div>
          </div>
        </div>

        <div className="card-elevated p-5 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <HandCoins className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Net Debt Position</div>
            <div
              className={`text-2xl font-bold tabular ${
                totalLentRemaining >= totalBorrowedRemaining ? "text-success" : "text-destructive"
              }`}
            >
              {formatMoney(totalLentRemaining - totalBorrowedRemaining, currency, 2, { signed: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Records ({loans.length})</TabsTrigger>
          <TabsTrigger value="borrowed">Money I Owe ({borrowed.length})</TabsTrigger>
          <TabsTrigger value="lent">Money Owed to Me ({lent.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <LoanList loans={loans} />
        </TabsContent>

        <TabsContent value="borrowed">
          <LoanList loans={borrowed} />
        </TabsContent>

        <TabsContent value="lent">
          <LoanList loans={lent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { deleteLoan, listContacts } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoanPaymentModal } from "./LoanPaymentModal";
import { LoanForm } from "./LoanForm";
import { Trash2, Pencil, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export interface LoanItem {
  id: string;
  contact_id?: string | null;
  direction: "borrowed" | "lent";
  principal_minor: number;
  paid_minor: number;
  interest_rate: number;
  currency: string;
  due_date?: string | null;
  description?: string | null;
  is_settled: boolean;
}

export function LoanList({ loans }: { loans: LoanItem[] }) {
  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => listContacts(),
  });
  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c]));

  const queryClient = useQueryClient();
  const router = useRouter();
  const deleteFn = useServerFn(deleteLoan);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      router.invalidate();
      toast.success("Loan record deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loans.length === 0) {
    return (
      <div className="card-elevated p-8 text-center">
        <h3 className="text-base font-semibold">No loan or debt records</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Track borrowed liabilities, lent funds, counterparties, interest rates, and installment payments.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {loans.map((l) => {
        const contact = l.contact_id ? contactMap[l.contact_id] : null;
        const remaining = Math.max(l.principal_minor - l.paid_minor, 0);
        const percent = l.principal_minor > 0
          ? Math.min(Math.round((l.paid_minor / l.principal_minor) * 100), 100)
          : 0;

        const isOverdue = l.due_date && new Date(l.due_date) < new Date() && remaining > 0;

        return (
          <div
            key={l.id}
            className="group card-elevated flex flex-col justify-between p-5 transition hover:border-primary/40"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={l.direction === "borrowed" ? "destructive" : "default"}
                      className="capitalize text-[10px]"
                    >
                      {l.direction === "borrowed" ? "I Owe" : "Owed to Me"}
                    </Badge>
                    {l.is_settled || remaining === 0 ? (
                      <Badge variant="outline" className="text-success border-success text-[10px]">
                        Settled
                      </Badge>
                    ) : isOverdue ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Overdue
                      </Badge>
                    ) : null}
                  </div>

                  <h3 className="mt-2 font-semibold text-base">
                    {contact ? contact.name : l.description || "Loan"}
                  </h3>
                  {contact && l.description && (
                    <p className="text-xs text-muted-foreground">{l.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <LoanForm
                    existing={l}
                    trigger={
                      <button className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-primary group-hover:opacity-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 transition group-hover:opacity-100"
                    onClick={() => {
                      if (confirm("Delete this loan record?")) deleteMutation.mutate(l.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Amount progress */}
              <div className="mt-5 space-y-2">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground text-xs">Remaining</span>
                  <span className="text-xl font-bold tabular">
                    {formatMoney(remaining, l.currency)}
                  </span>
                </div>

                <Progress value={percent} className="h-2 bg-muted" />

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Paid: {formatMoney(l.paid_minor, l.currency)}</span>
                  <span>Principal: {formatMoney(l.principal_minor, l.currency)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border flex items-center justify-between">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {l.due_date ? `Due ${new Date(l.due_date).toLocaleDateString()}` : "No due date"}
              </div>

              {remaining > 0 && (
                <LoanPaymentModal loanId={l.id} currency={l.currency} direction={l.direction} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

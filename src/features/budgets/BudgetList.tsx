import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { deleteBudget, listCategories } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { EditBudgetButton } from "./BudgetForm";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, CheckCircle2, ArrowUpRight, Calendar, Repeat } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export interface BudgetWithUsage {
  id: string;
  name: string;
  period_type: string;
  amount_minor: number;
  currency: string;
  rollover: boolean;
  is_active: boolean;
  start_date: string;
  end_date?: string | null;
  spent_minor: number;
  carried_over_minor: number;
  remaining_minor: number;
  percent: number;
  budget_categories?: { category_id: string }[];
}

export function BudgetList({ budgets }: { budgets: BudgetWithUsage[] }) {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const queryClient = useQueryClient();
  const router = useRouter();
  const deleteFn = useServerFn(deleteBudget);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      router.invalidate();
      toast.success("Budget deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (budgets.length === 0) {
    return (
      <div className="card-elevated p-8 text-center">
        <h3 className="text-base font-semibold">No active budgets</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up category or period budgets to control your spending velocity.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {budgets.map((b) => {
        const isOver = b.spent_minor > b.amount_minor + b.carried_over_minor;
        const isNear = b.percent >= 80 && !isOver;
        const catNames = (b.budget_categories ?? [])
          .map((bc) => catMap[bc.category_id]?.name)
          .filter(Boolean);

        return (
          <div
            key={b.id}
            className="group card-elevated flex flex-col justify-between p-5 transition hover:border-primary/40"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{b.name}</h3>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {b.period_type}
                    </Badge>
                  </div>
                  {catNames.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {catNames.slice(0, 3).map((name) => (
                        <span
                          key={name}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {name}
                        </span>
                      ))}
                      {catNames.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{catNames.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="mt-1 text-xs text-muted-foreground">All Categories</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <EditBudgetButton budget={b} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 transition group-hover:opacity-100"
                    onClick={() => {
                      if (confirm(`Delete budget "${b.name}"?`)) deleteMutation.mutate(b.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Progress bar and metrics */}
              <div className="mt-5 space-y-2">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-semibold tabular">
                    {formatMoney(b.spent_minor, b.currency)} /{" "}
                    {formatMoney(b.amount_minor + b.carried_over_minor, b.currency)}
                  </span>
                </div>

                <Progress
                  value={Math.min(b.percent, 100)}
                  className={`h-2 ${
                    isOver ? "bg-destructive" : isNear ? "bg-amber-500" : "bg-primary"
                  }`}
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    {b.rollover && (
                      <span className="inline-flex items-center gap-0.5 text-info" title="Rollover enabled">
                        <Repeat className="h-3 w-3" />
                        Rollover
                      </span>
                    )}
                  </span>
                  <span
                    className={`font-medium ${
                      isOver ? "text-destructive" : isNear ? "text-amber-500" : "text-success"
                    }`}
                  >
                    {isOver
                      ? `Over by ${formatMoney(Math.abs(b.remaining_minor), b.currency)}`
                      : `${formatMoney(b.remaining_minor, b.currency)} left`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Starts {new Date(b.start_date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1 font-medium">
                {isOver ? (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" /> Overspent
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> On track
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

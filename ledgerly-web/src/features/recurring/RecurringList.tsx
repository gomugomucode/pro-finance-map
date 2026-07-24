import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import {
  deleteRecurringTransaction,
  executeRecurringTransaction,
  updateRecurringTransaction,
  listAccounts,
  listCategories,
} from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecurringForm } from "./RecurringForm";
import {
  Trash2,
  Pencil,
  Calendar,
  Play,
  Pause,
  Zap,
  Repeat,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export interface RecurringItem {
  id: string;
  name: string;
  kind: "income" | "expense" | "transfer";
  account_id: string;
  to_account_id?: string | null;
  category_id?: string | null;
  amount_minor: number;
  currency: string;
  frequency: string;
  interval_days?: number | null;
  start_date: string;
  end_date?: string | null;
  next_due_date: string;
  last_executed_at?: string | null;
  is_paused: boolean;
  auto_create: boolean;
  description?: string | null;
}

export function RecurringList({ items }: { items: RecurringItem[] }) {
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => listAccounts() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const queryClient = useQueryClient();
  const router = useRouter();

  const executeFn = useServerFn(executeRecurringTransaction);
  const updateFn = useServerFn(updateRecurringTransaction);
  const deleteFn = useServerFn(deleteRecurringTransaction);

  const executeMutation = useMutation({
    mutationFn: (id: string) => executeFn({ data: { id } }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      router.invalidate();
      toast.success(`Transaction created. Next due: ${res.next_due_date}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePauseMutation = useMutation({
    mutationFn: ({ id, is_paused }: { id: string; is_paused: boolean }) =>
      updateFn({ data: { id, patch: { is_paused } } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
      router.invalidate();
      toast.success("Schedule status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
      router.invalidate();
      toast.success("Recurring rule removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (items.length === 0) {
    return (
      <div className="card-elevated p-8 text-center">
        <h3 className="text-base font-semibold">No recurring rules configured</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Automate salaries, rent, subscriptions, and periodic transfers.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const acc = accountMap[item.account_id];
        const cat = item.category_id ? catMap[item.category_id] : null;

        const isDue = new Date(item.next_due_date) <= new Date() && !item.is_paused;

        return (
          <div
            key={item.id}
            className={`group card-elevated flex flex-col justify-between p-5 transition ${
              item.is_paused ? "opacity-60" : "hover:border-primary/40"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.kind === "income"
                          ? "default"
                          : item.kind === "expense"
                            ? "destructive"
                            : "outline"
                      }
                      className="capitalize text-[10px]"
                    >
                      {item.kind}
                    </Badge>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {item.frequency}
                    </Badge>
                    {item.is_paused && (
                      <Badge variant="secondary" className="text-[10px]">
                        Paused
                      </Badge>
                    )}
                  </div>

                  <h3 className="mt-2 font-semibold text-base">{item.name}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {acc?.name ?? "Account"} {cat ? `· ${cat.name}` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <RecurringForm
                    existing={item}
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
                      if (confirm(`Delete recurring rule "${item.name}"?`))
                        deleteMutation.mutate(item.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Amount & Schedule Details */}
              <div className="mt-5 space-y-1">
                <div className="text-2xl font-bold tracking-tight tabular">
                  {formatMoney(item.amount_minor, item.currency)}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Next due: {new Date(item.next_due_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="mt-6 pt-3 border-t border-border flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={() =>
                  togglePauseMutation.mutate({ id: item.id, is_paused: !item.is_paused })
                }
              >
                {item.is_paused ? (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5 text-success" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Pause
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant={isDue ? "default" : "outline"}
                className="h-8 text-xs"
                disabled={executeMutation.isPending}
                onClick={() => executeMutation.mutate(item.id)}
              >
                {executeMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-1 h-3.5 w-3.5 text-amber-400" /> Run Now
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

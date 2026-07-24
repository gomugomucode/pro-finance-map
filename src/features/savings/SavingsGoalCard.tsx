import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { deleteSavingsGoal } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContributionModal } from "./ContributionModal";
import { SavingsGoalForm } from "./SavingsGoalForm";
import { Trash2, Pencil, Calendar, CheckCircle, PiggyBank, Target } from "lucide-react";
import { toast } from "sonner";

export interface SavingsGoalItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  target_minor: number;
  current_minor: number;
  currency: string;
  deadline?: string | null;
  account_id?: string | null;
  is_completed: boolean;
  notes?: string | null;
}

export function SavingsGoalCard({ goal }: { goal: SavingsGoalItem }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const deleteFn = useServerFn(deleteSavingsGoal);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      router.invalidate();
      toast.success("Goal deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const percent = goal.target_minor > 0
    ? Math.min(Math.round((goal.current_minor / goal.target_minor) * 100), 100)
    : 0;

  const remaining = Math.max(goal.target_minor - goal.current_minor, 0);

  return (
    <div className="group card-elevated flex flex-col justify-between p-5 transition hover:border-primary/40">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl text-white font-semibold shadow-sm"
              style={{ backgroundColor: goal.color || "#22D3A0" }}
            >
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">{goal.name}</h3>
                {goal.is_completed && (
                  <Badge variant="default" className="bg-success text-success-foreground text-[10px]">
                    Completed
                  </Badge>
                )}
              </div>
              {goal.notes && <p className="text-xs text-muted-foreground line-clamp-1">{goal.notes}</p>}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <SavingsGoalForm
              existing={goal}
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
                if (confirm(`Delete savings goal "${goal.name}"?`)) deleteMutation.mutate(goal.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress & metrics */}
        <div className="mt-6 space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-2xl font-bold tracking-tight tabular">
              {formatMoney(goal.current_minor, goal.currency)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              of {formatMoney(goal.target_minor, goal.currency)} ({percent}%)
            </span>
          </div>

          <Progress value={percent} className="h-2.5 bg-muted" />

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>
              {goal.is_completed
                ? "Target achieved!"
                : `${formatMoney(remaining, goal.currency)} remaining`}
            </span>
            {goal.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Target: {new Date(goal.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 pt-3 border-t border-border flex items-center justify-end gap-2">
        <ContributionModal
          goalId={goal.id}
          goalName={goal.name}
          currency={goal.currency}
          mode="withdraw"
        />
        <ContributionModal
          goalId={goal.id}
          goalName={goal.name}
          currency={goal.currency}
          mode="deposit"
        />
      </div>
    </div>
  );
}

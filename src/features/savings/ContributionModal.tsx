import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { addSavingsContribution } from "@/lib/finance.functions";
import { toMinor, formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, MinusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ContributionModal({
  goalId,
  goalName,
  currency,
  mode = "deposit",
  trigger,
}: {
  goalId: string;
  goalName: string;
  currency: string;
  mode?: "deposit" | "withdraw";
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const queryClient = useQueryClient();
  const router = useRouter();
  const contributeFn = useServerFn(addSavingsContribution);

  const mutation = useMutation({
    mutationFn: (d: Parameters<typeof contributeFn>[0]) => contributeFn(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      router.invalidate();
      toast.success(mode === "deposit" ? "Contribution logged" : "Withdrawal logged");
      setOpen(false);
      setAmount("");
      setNote("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(amount) || 0;
    const amount_minor = mode === "deposit" ? toMinor(rawVal) : -toMinor(rawVal);
    mutation.mutate({
      data: {
        goal_id: goalId,
        amount_minor,
        note: note || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant={mode === "deposit" ? "default" : "outline"}>
            {mode === "deposit" ? (
              <>
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Deposit
              </>
            ) : (
              <>
                <MinusCircle className="mr-1.5 h-3.5 w-3.5" /> Withdraw
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "deposit" ? `Deposit to "${goalName}"` : `Withdraw from "${goalName}"`}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="contrib-amount">Amount ({currency})</Label>
            <Input
              id="contrib-amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contrib-note">Note / Source</Label>
            <Input
              id="contrib-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={mode === "deposit" ? "Monthly deposit" : "Emergency usage"}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "deposit" ? "Confirm Deposit" : "Confirm Withdrawal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

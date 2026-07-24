import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { addLoanPayment } from "@/lib/finance.functions";
import { toMinor } from "@/lib/money";
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
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function LoanPaymentModal({
  loanId,
  currency,
  direction,
  trigger,
}: {
  loanId: string;
  currency: string;
  direction: "borrowed" | "lent";
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const queryClient = useQueryClient();
  const router = useRouter();
  const paymentFn = useServerFn(addLoanPayment);

  const mutation = useMutation({
    mutationFn: (d: Parameters<typeof paymentFn>[0]) => paymentFn(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      router.invalidate();
      toast.success("Payment recorded");
      setOpen(false);
      setAmount("");
      setNote("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount_minor = toMinor(parseFloat(amount) || 0);
    mutation.mutate({
      data: {
        loan_id: loanId,
        amount_minor,
        note: note || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="default">
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            {direction === "borrowed" ? "Pay Installment / EMI" : "Record Payment Received"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {direction === "borrowed" ? "Make Loan Payment" : "Receive Debt Repayment"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Amount ({currency})</Label>
            <Input
              id="pay-amount"
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
            <Label htmlFor="pay-note">Payment Reference / Note</Label>
            <Input
              id="pay-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. EMI Month 3 / Bank Transfer"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

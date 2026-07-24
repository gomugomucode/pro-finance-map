import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAccounts, reconcileAccountBalance } from "@/lib/finance.functions";
import { toMinor, formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Scale, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AccountReconciliation() {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [expectedBalance, setExpectedBalance] = useState("");

  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => listAccounts() });
  const queryClient = useQueryClient();
  const reconcileFn = useServerFn(reconcileAccountBalance);

  const mutation = useMutation({
    mutationFn: (data: any) => reconcileFn({ data }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      if (res.discrepancyMinor === 0) {
        toast.success("Account is 100% reconciled with 0 discrepancy!");
      } else {
        toast.success(`Account reconciled. Adjustment transaction created for ${formatMoney(Math.abs(res.discrepancyMinor), "USD")}.`);
      }
      setExpectedBalance("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currentAcc = accounts.find((a) => a.id === selectedAccountId);
  const currentBalanceMinor = currentAcc ? Number(currentAcc.current_balance_minor || 0) : 0;
  const expectedMinor = expectedBalance ? toMinor(parseFloat(expectedBalance)) : 0;
  const discrepancyMinor = expectedMinor - currentBalanceMinor;

  const handleReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !expectedBalance) {
      toast.error("Please select an account and enter bank statement ending balance.");
      return;
    }
    mutation.mutate({
      account_id: selectedAccountId,
      expected_balance_minor: expectedMinor,
      createAdjustmentTransaction: true,
    });
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base">Account Statement Reconciliation</h3>
          <p className="text-xs text-muted-foreground">
            Compare your actual bank statement balance against system balance and automatically log adjustment entries.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleReconcile}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Select Account to Reconcile</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger><SelectValue placeholder="Select account..." /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expected">Statement Ending Balance ({currentAcc?.currency ?? "USD"})</Label>
            <Input
              id="expected"
              type="number"
              step="0.01"
              required
              value={expectedBalance}
              onChange={(e) => setExpectedBalance(e.target.value)}
              placeholder="0.00"
              className="text-base tabular"
            />
          </div>
        </div>

        {currentAcc && expectedBalance && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">System Current Balance:</span>
              <span className="font-bold tabular">{formatMoney(currentBalanceMinor, currentAcc.currency)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank Statement Balance:</span>
              <span className="font-bold tabular">{formatMoney(expectedMinor, currentAcc.currency)}</span>
            </div>

            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Discrepancy / Adjustment:</span>
              <span className={discrepancyMinor === 0 ? "text-success" : "text-amber-400"}>
                {discrepancyMinor === 0 ? "0 (Balanced)" : formatMoney(Math.abs(discrepancyMinor), currentAcc.currency)}
              </span>
            </div>
          </div>
        )}

        <Button type="submit" disabled={!selectedAccountId || !expectedBalance || mutation.isPending} className="w-full">
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CheckCircle2 className="mr-2 h-4 w-4" /> Reconcile & Log Adjustment
        </Button>
      </form>
    </Card>
  );
}

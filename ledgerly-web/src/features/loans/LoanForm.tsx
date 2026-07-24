import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { createLoan, updateLoan, listContacts } from "@/lib/finance.functions";
import { toMinor } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface ExistingLoan {
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

export function LoanForm({
  existing,
  trigger,
}: {
  existing?: ExistingLoan;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"borrowed" | "lent">(existing?.direction ?? "borrowed");
  const [principal, setPrincipal] = useState(existing ? (Number(existing.principal_minor) / 100).toString() : "");
  const [interestRate, setInterestRate] = useState(existing?.interest_rate?.toString() ?? "0");
  const [currency] = useState(existing?.currency ?? "USD");
  const [dueDate, setDueDate] = useState(existing?.due_date ?? "");
  const [contactId, setContactId] = useState(existing?.contact_id ?? "none");
  const [description, setDescription] = useState(existing?.description ?? "");

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => listContacts(),
  });

  const queryClient = useQueryClient();
  const router = useRouter();
  const createFn = useServerFn(createLoan);
  const updateFn = useServerFn(updateLoan);

  const createMutation = useMutation({
    mutationFn: (data: any) => createFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      router.invalidate();
      toast.success("Loan record created");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      router.invalidate();
      toast.success("Loan updated");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal_minor = toMinor(parseFloat(principal) || 0);
    const rate = parseFloat(interestRate) || 0;
    const cId = contactId === "none" ? null : contactId;

    if (existing) {
      updateMutation.mutate({
        id: existing.id,
        patch: {
          direction,
          principal_minor,
          interest_rate: rate,
          due_date: dueDate || null,
          contact_id: cId,
          description: description || null,
        },
      });
    } else {
      createMutation.mutate({
        direction,
        principal_minor,
        interest_rate: rate,
        currency,
        due_date: dueDate || null,
        contact_id: cId,
        description: description || null,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> Record Loan / Debt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Loan Record" : "Record Loan / Debt"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={direction}
                onValueChange={(v) => setDirection(v as "borrowed" | "lent")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrowed">Money I Owe (Borrowed)</SelectItem>
                  <SelectItem value="lent">Money Owed to Me (Lent)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loan-contact">Contact / Counterparty</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unlinked / Custom</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loan-principal">Principal Amount</Label>
              <Input
                id="loan-principal"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="1000.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loan-rate">Annual Interest Rate (%)</Label>
              <Input
                id="loan-rate"
                type="number"
                step="0.01"
                min="0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-due">Due Date</Label>
            <Input
              id="loan-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-desc">Description / Purpose</Label>
            <Textarea
              id="loan-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Car purchase loan or Personal loan to friend"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existing ? "Save changes" : "Record Loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

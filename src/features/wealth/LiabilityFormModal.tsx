import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createLiability, updateLiability } from "@/lib/finance.functions";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

const LIABILITY_TYPES = [
  { value: "mortgage", label: "Home Mortgage Loan" },
  { value: "credit_card", label: "Credit Card Debt" },
  { value: "car_loan", label: "Car / Auto Loan" },
  { value: "personal_loan", label: "Personal Bank Loan" },
  { value: "business_loan", label: "Business Debt / Credit" },
  { value: "education_loan", label: "Student / Education Loan" },
  { value: "tax_due", label: "Taxes / Government Dues" },
  { value: "other", label: "Other Liability" },
];

interface LiabilityFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liabilityToEdit?: any;
}

export function LiabilityFormModal({ open, onOpenChange, liabilityToEdit }: LiabilityFormModalProps) {
  const [name, setName] = useState("");
  const [liabilityType, setLiabilityType] = useState("mortgage");
  const [currentBalance, setCurrentBalance] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [institution, setInstitution] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();
  const createFn = useServerFn(createLiability);
  const updateFn = useServerFn(updateLiability);

  useEffect(() => {
    if (liabilityToEdit) {
      setName(liabilityToEdit.name || "");
      setLiabilityType(liabilityToEdit.liability_type || "mortgage");
      setCurrentBalance((liabilityToEdit.current_balance_minor / 100).toString());
      setOriginalAmount(liabilityToEdit.original_amount_minor ? (liabilityToEdit.original_amount_minor / 100).toString() : "");
      setInterestRate(liabilityToEdit.interest_rate?.toString() || "0");
      setInstitution(liabilityToEdit.institution || "");
      setNotes(liabilityToEdit.notes || "");
    } else {
      resetForm();
    }
  }, [liabilityToEdit, open]);

  const resetForm = () => {
    setName("");
    setLiabilityType("mortgage");
    setCurrentBalance("");
    setOriginalAmount("");
    setInterestRate("0");
    setInstitution("");
    setNotes("");
  };

  const mutation = useMutation({
    mutationFn: (data: any) =>
      liabilityToEdit
        ? updateFn({ data: { id: liabilityToEdit.id, patch: data } })
        : createFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
      queryClient.invalidateQueries({ queryKey: ["net_worth_summary"] });
      toast.success(liabilityToEdit ? "Liability updated" : "Liability added");
      onOpenChange(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !currentBalance) {
      toast.error("Please specify liability name and current balance owed.");
      return;
    }

    mutation.mutate({
      name,
      liability_type: liabilityType as any,
      current_balance_minor: toMinor(parseFloat(currentBalance)),
      original_amount_minor: originalAmount ? toMinor(parseFloat(originalAmount)) : 0,
      interest_rate: parseFloat(interestRate) || 0,
      institution: institution || null,
      notes: notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <CreditCard className="h-5 w-5" />
            {liabilityToEdit ? "Edit Liability Owed" : "Add Liability / Debt"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="liab-name">Liability Name</Label>
              <Input
                id="liab-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nabil Mortgage Loan"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category / Type</Label>
              <Select value={liabilityType} onValueChange={setLiabilityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LIABILITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="curr-bal">Current Owed Balance ($)</Label>
              <Input
                id="curr-bal"
                type="number"
                step="0.01"
                required
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                placeholder="0.00"
                className="text-base tabular font-semibold text-destructive"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="orig-amt">Original Borrowed Amount ($)</Label>
              <Input
                id="orig-amt"
                type="number"
                step="0.01"
                value={originalAmount}
                onChange={(e) => setOriginalAmount(e.target.value)}
                placeholder="Optional"
                className="text-base tabular"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="interest">Interest Rate (%)</Label>
              <Input
                id="interest"
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="e.g. 10.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inst">Bank / Lender Institution</Label>
              <Input
                id="inst"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Global IME Bank"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="liab-notes">Notes</Label>
            <Textarea
              id="liab-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fixed interest rate for 5 years"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {liabilityToEdit ? "Update Liability" : "Save Liability"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

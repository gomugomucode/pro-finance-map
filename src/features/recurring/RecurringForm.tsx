import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import {
  createRecurringTransaction,
  updateRecurringTransaction,
  listAccounts,
  listCategories,
} from "@/lib/finance.functions";
import { toMinor } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

export interface ExistingRecurring {
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
  is_paused: boolean;
  auto_create: boolean;
  description?: string | null;
}

export function RecurringForm({
  existing,
  trigger,
}: {
  existing?: ExistingRecurring;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [kind, setKind] = useState<"income" | "expense" | "transfer">(existing?.kind ?? "expense");
  const [amount, setAmount] = useState(existing ? (Number(existing.amount_minor) / 100).toString() : "");
  const [currency] = useState(existing?.currency ?? "USD");
  const [accountId, setAccountId] = useState(existing?.account_id ?? "");
  const [toAccountId, setToAccountId] = useState(existing?.to_account_id ?? "none");
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? "none");
  const [frequency, setFrequency] = useState(existing?.frequency ?? "monthly");
  const [intervalDays, setIntervalDays] = useState(existing?.interval_days?.toString() ?? "30");
  const [startDate, setStartDate] = useState(existing?.start_date ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(existing?.end_date ?? "");
  const [autoCreate, setAutoCreate] = useState(existing?.auto_create ?? false);
  const [description, setDescription] = useState(existing?.description ?? "");

  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => listAccounts() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const queryClient = useQueryClient();
  const router = useRouter();
  const createFn = useServerFn(createRecurringTransaction);
  const updateFn = useServerFn(updateRecurringTransaction);

  const createMutation = useMutation({
    mutationFn: (data: any) => createFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
      router.invalidate();
      toast.success("Recurring rule created");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_transactions"] });
      router.invalidate();
      toast.success("Schedule updated");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) { toast.error("Please select an account"); return; }
    const amount_minor = toMinor(parseFloat(amount) || 0);
    const catId = categoryId === "none" ? null : categoryId;
    const toAccId = toAccountId === "none" ? null : toAccountId;

    if (existing) {
      updateMutation.mutate({
        id: existing.id,
        patch: {
          name,
          kind,
          account_id: accountId,
          to_account_id: toAccId,
          category_id: catId,
          amount_minor,
          frequency: frequency as any,
          interval_days: frequency === "custom" ? parseInt(intervalDays) || null : null,
          start_date: startDate,
          end_date: endDate || null,
          auto_create: autoCreate,
          description: description || null,
        },
      });
    } else {
      createMutation.mutate({
        name,
        kind,
        account_id: accountId,
        to_account_id: toAccId,
        category_id: catId,
        amount_minor,
        currency,
        frequency: frequency as any,
        interval_days: frequency === "custom" ? parseInt(intervalDays) || null : null,
        start_date: startDate,
        end_date: endDate || null,
        next_due_date: startDate,
        auto_create: autoCreate,
        description: description || null,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> New Recurring Rule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Recurring Rule" : "Create Recurring Rule"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec-name">Rule Name</Label>
              <Input
                id="rec-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Monthly Salary / Rent"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "income" | "expense" | "transfer")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec-amount">Amount</Label>
              <Input
                id="rec-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly (14 days)</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === "custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="rec-days">Repeat every (Days)</Label>
              <Input
                id="rec-days"
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec-start">Start Date</Label>
              <Input
                id="rec-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-end">End Date (Optional)</Label>
              <Input
                id="rec-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="auto-create"
              checked={autoCreate}
              onCheckedChange={(v) => setAutoCreate(v === true)}
            />
            <Label htmlFor="auto-create" className="cursor-pointer text-sm font-normal">
              Automatically create actual transaction on due date
            </Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existing ? "Save changes" : "Create rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

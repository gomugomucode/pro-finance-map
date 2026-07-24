import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import {
  createBudget,
  updateBudget,
  listCategories,
} from "@/lib/finance.functions";
import { budgetPeriodTypes } from "@/lib/schemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

type ExistingBudget = {
  id: string;
  name: string;
  period_type: string;
  amount_minor: number;
  currency: string;
  rollover: boolean;
  start_date: string;
  end_date?: string | null;
  budget_categories?: { category_id: string }[];
};

interface BudgetFormProps {
  existing?: ExistingBudget;
  trigger?: React.ReactNode;
}

export function BudgetForm({ existing, trigger }: BudgetFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [periodType, setPeriodType] = useState(existing?.period_type ?? "monthly");
  const [amount, setAmount] = useState(existing ? (Number(existing.amount_minor) / 100).toString() : "");
  const [currency] = useState(existing?.currency ?? "USD");
  const [rollover, setRollover] = useState(existing?.rollover ?? false);
  const [startDate, setStartDate] = useState(existing?.start_date ?? new Date().toISOString().slice(0, 10));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    existing?.budget_categories?.map((bc) => bc.category_id) ?? []
  );

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });
  const expenseCategories = categories.filter((c) => c.kind === "expense");

  const queryClient = useQueryClient();
  const router = useRouter();
  const createFn = useServerFn(createBudget);
  const updateFn = useServerFn(updateBudget);

  const createMutation = useMutation({
    mutationFn: (data: any) => createFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      router.invalidate();
      toast.success("Budget created");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      router.invalidate();
      toast.success("Budget updated");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount_minor = toMinor(parseFloat(amount) || 0);

    if (existing) {
      updateMutation.mutate({
        id: existing.id,
        patch: {
          name,
          period_type: periodType as typeof budgetPeriodTypes[number],
          amount_minor,
          rollover,
          start_date: startDate,
          category_ids: selectedCategories,
        },
      });
    } else {
      createMutation.mutate({
        name,
        period_type: periodType as typeof budgetPeriodTypes[number],
        amount_minor,
        currency,
        rollover,
        start_date: startDate,
        category_ids: selectedCategories,
        is_active: true,
      });
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            New budget
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit budget" : "Create budget"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="budget-name">Name</Label>
            <Input
              id="budget-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              placeholder="Monthly groceries"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Period</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-amount">Limit</Label>
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget-start">Start date</Label>
            <Input
              id="budget-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="rollover"
              checked={rollover}
              onCheckedChange={(v) => setRollover(v === true)}
            />
            <Label htmlFor="rollover" className="cursor-pointer text-sm font-normal">
              Carry over unused budget to next period
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Categories (leave empty to track all expenses)</Label>
            <ScrollArea className="h-40 rounded-lg border border-input p-2">
              <div className="space-y-1.5">
                {expenseCategories.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`cat-${c.id}`}
                      checked={selectedCategories.includes(c.id)}
                      onCheckedChange={() => toggleCategory(c.id)}
                    />
                    <label
                      htmlFor={`cat-${c.id}`}
                      className="flex cursor-pointer items-center gap-1.5 text-sm"
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color ?? "#22D3A0" }}
                      />
                      {c.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existing ? "Save changes" : "Create budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditBudgetButton({ budget }: { budget: ExistingBudget }) {
  return (
    <BudgetForm
      existing={budget}
      trigger={
        <button className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-primary group-hover:opacity-100">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      }
    />
  );
}

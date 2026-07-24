import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import {
  createSubscription,
  updateSubscription,
  listAccounts,
  listCategories,
} from "@/lib/finance.functions";
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
import { Plus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface ExistingSubscription {
  id: string;
  name: string;
  provider_icon?: string | null;
  color: string;
  amount_minor: number;
  currency: string;
  billing_cycle: string;
  next_renewal_date: string;
  account_id?: string | null;
  category_id?: string | null;
  is_active: boolean;
  reminder_days_before: number;
  notes?: string | null;
}

const PRESET_SUBSCRIPTIONS = [
  { name: "Netflix", cycle: "monthly", amount: "15.99", color: "#E50914" },
  { name: "Spotify Premium", cycle: "monthly", amount: "10.99", color: "#1DB954" },
  { name: "Amazon Prime", cycle: "yearly", amount: "139.00", color: "#FF9900" },
  { name: "Cloud Hosting & VPS", cycle: "monthly", amount: "20.00", color: "#0070F3" },
  { name: "Domains & SSL", cycle: "yearly", amount: "25.00", color: "#8B5CF6" },
  { name: "Gym & Fitness", cycle: "monthly", amount: "49.00", color: "#EC4899" },
  { name: "Internet Fiber", cycle: "monthly", amount: "70.00", color: "#06B6D4" },
  { name: "Cell Phone Plan", cycle: "monthly", amount: "45.00", color: "#10B981" },
];

export function SubscriptionForm({
  existing,
  trigger,
}: {
  existing?: ExistingSubscription;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState(existing?.color ?? "#22D3A0");
  const [amount, setAmount] = useState(existing ? (Number(existing.amount_minor) / 100).toString() : "");
  const [currency] = useState(existing?.currency ?? "USD");
  const [billingCycle, setBillingCycle] = useState<"weekly" | "monthly" | "yearly">(
    (existing?.billing_cycle as any) ?? "monthly"
  );
  const [nextRenewal, setNextRenewal] = useState(
    existing?.next_renewal_date ?? new Date().toISOString().slice(0, 10)
  );
  const [reminderDays, setReminderDays] = useState(existing?.reminder_days_before?.toString() ?? "3");
  const [accountId, setAccountId] = useState(existing?.account_id ?? "none");
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? "none");

  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => listAccounts() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const queryClient = useQueryClient();
  const router = useRouter();
  const createFn = useServerFn(createSubscription);
  const updateFn = useServerFn(updateSubscription);

  const createMutation = useMutation({
    mutationFn: (data: any) => createFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      router.invalidate();
      toast.success("Subscription added");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      router.invalidate();
      toast.success("Subscription updated");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount_minor = toMinor(parseFloat(amount) || 0);
    const accId = accountId === "none" ? null : accountId;
    const catId = categoryId === "none" ? null : categoryId;
    const reminder_days_before = parseInt(reminderDays) || 3;

    if (existing) {
      updateMutation.mutate({
        id: existing.id,
        patch: {
          name,
          color,
          amount_minor,
          billing_cycle: billingCycle,
          next_renewal_date: nextRenewal,
          account_id: accId,
          category_id: catId,
          reminder_days_before,
        },
      });
    } else {
      createMutation.mutate({
        name,
        color,
        amount_minor,
        currency,
        billing_cycle: billingCycle,
        next_renewal_date: nextRenewal,
        account_id: accId,
        category_id: catId,
        reminder_days_before,
        is_active: true,
      });
    }
  };

  const applyPreset = (preset: typeof PRESET_SUBSCRIPTIONS[0]) => {
    setName(preset.name);
    setBillingCycle(preset.cycle as any);
    setAmount(preset.amount);
    setColor(preset.color);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> Add Subscription
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          {!existing && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Popular Services
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESET_SUBSCRIPTIONS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="rounded-lg border border-border p-1.5 text-left text-xs transition hover:border-primary hover:bg-accent"
                  >
                    <span className="font-medium truncate block">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-name">Service Name</Label>
              <Input
                id="sub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Netflix / Spotify"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Color Brand Accent</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input p-0.5 bg-transparent"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-amount">Billing Amount</Label>
              <Input
                id="sub-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="14.99"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Billing Cycle</Label>
              <Select
                value={billingCycle}
                onValueChange={(v) => setBillingCycle(v as "weekly" | "monthly" | "yearly")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-renewal">Next Renewal Date</Label>
              <Input
                id="sub-renewal"
                type="date"
                required
                value={nextRenewal}
                onChange={(e) => setNextRenewal(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-remind">Remind Days Before</Label>
              <Input
                id="sub-remind"
                type="number"
                min="1"
                max="30"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Payment Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existing ? "Save changes" : "Add Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

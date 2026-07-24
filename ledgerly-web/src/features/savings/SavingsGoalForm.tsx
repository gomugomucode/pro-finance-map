import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { createSavingsGoal, updateSavingsGoal, listAccounts } from "@/lib/finance.functions";
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
import { useQuery } from "@tanstack/react-query";

export interface ExistingSavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  target_minor: number;
  current_minor: number;
  currency: string;
  deadline?: string | null;
  account_id?: string | null;
  notes?: string | null;
}

const PRESET_GOALS = [
  { label: "Emergency Fund", icon: "shield", color: "#10B981" },
  { label: "Vacation & Travel", icon: "palmtree", color: "#3B82F6" },
  { label: "New Vehicle", icon: "car", color: "#F59E0B" },
  { label: "House Down Payment", icon: "home", color: "#A855F7" },
  { label: "Education & Courses", icon: "education", color: "#6366F1" },
  { label: "Investment & Stocks", icon: "trending", color: "#22D3A0" },
];

export function SavingsGoalForm({
  existing,
  trigger,
}: {
  existing?: ExistingSavingsGoal;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [target, setTarget] = useState(existing ? (Number(existing.target_minor) / 100).toString() : "");
  const [icon, setIcon] = useState(existing?.icon ?? "piggy-bank");
  const [color, setColor] = useState(existing?.color ?? "#22D3A0");
  const [currency] = useState(existing?.currency ?? "USD");
  const [deadline, setDeadline] = useState(existing?.deadline ?? "");
  const [accountId, setAccountId] = useState(existing?.account_id ?? "none");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => listAccounts(),
  });

  const queryClient = useQueryClient();
  const router = useRouter();
  const createFn = useServerFn(createSavingsGoal);
  const updateFn = useServerFn(updateSavingsGoal);

  const createMutation = useMutation({
    mutationFn: (data: any) => createFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      router.invalidate();
      toast.success("Savings goal created");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      router.invalidate();
      toast.success("Goal updated");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target_minor = toMinor(parseFloat(target) || 0);
    const accId = accountId === "none" ? null : accountId;

    if (existing) {
      updateMutation.mutate({
        id: existing.id,
        patch: {
          name,
          target_minor,
          icon,
          color,
          deadline: deadline || null,
          account_id: accId,
          notes: notes || null,
        },
      });
    } else {
      createMutation.mutate({
        name,
        target_minor,
        currency,
        icon,
        color,
        deadline: deadline || null,
        account_id: accId,
        notes: notes || null,
      });
    }
  };

  const applyPreset = (preset: typeof PRESET_GOALS[0]) => {
    setName(preset.label);
    setIcon(preset.icon);
    setColor(preset.color);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            New Savings Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Goal" : "Create Savings Goal"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          {!existing && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quick Presets</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_GOALS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="rounded-lg border border-border p-2 text-left text-xs transition hover:border-primary hover:bg-accent"
                  >
                    <span className="font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="goal-name">Goal Name</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Emergency Fund"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">Target Amount</Label>
              <Input
                id="goal-target"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="5000.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-deadline">Target Deadline</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Color Accent</Label>
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

            <div className="space-y-1.5">
              <Label>Linked Savings Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Virtual)</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-notes">Notes & Strategy</Label>
            <Textarea
              id="goal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Saving $500 monthly from freelance revenue"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existing ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

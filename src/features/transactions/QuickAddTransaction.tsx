import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import {
  createTransaction,
  listAccounts,
  listCategories,
} from "@/lib/finance.functions";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Kind = "expense" | "income" | "transfer";

export function QuickAddTransaction() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [occurredAt, setOccurredAt] = useState<string>(() => new Date().toISOString().slice(0, 16));

  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => listAccounts() });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });

  const queryClient = useQueryClient();
  const router = useRouter();
  const create = useServerFn(createTransaction);
  const mutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.invalidate();
      toast.success("Transaction added");
      setOpen(false);
      setAmount("");
      setDescription("");
    },
    onError: (e) => toast.error(e.message),
  });

  const acc = accounts.find((a) => a.id === accountId);
  const filteredCats = categories.filter((c) => c.kind === kind);

  const canSubmit =
    !!accountId &&
    !!amount &&
    parseFloat(amount) > 0 &&
    (kind !== "transfer" || (!!toAccountId && toAccountId !== accountId));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !acc) return;
    mutation.mutate({
      data: {
        kind,
        account_id: accountId,
        to_account_id: kind === "transfer" ? toAccountId : null,
        category_id: kind !== "transfer" ? categoryId || null : null,
        amount_minor: toMinor(parseFloat(amount)),
        currency: acc.currency,
        occurred_at: new Date(occurredAt).toISOString(),
        description: description || null,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o && !accountId && accounts[0]) setAccountId(accounts[0].id);
    }}>
      <DialogTrigger asChild>
        <Button disabled={accounts.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" />
          New transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
        </DialogHeader>

        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Create an account first to record transactions.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="expense">Expense</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="transfer">Transfer</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {acc?.currency ?? ""}
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="pl-14 tabular text-lg"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{kind === "transfer" ? "From account" : "Account"}</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {kind === "transfer" ? (
                <div className="space-y-1.5">
                  <Label>To account</Label>
                  <Select value={toAccountId} onValueChange={setToAccountId}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a) => a.id !== accountId)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {filteredCats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="occurred">When</Label>
              <Input
                id="occurred"
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                rows={2}
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Coffee at Blue Bottle"
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={!canSubmit || mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save transaction
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

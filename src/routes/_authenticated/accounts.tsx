import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listAccounts,
  createAccount,
  deleteAccount,
} from "@/lib/finance.functions";
import { accountTypes } from "@/lib/schemas";
import { formatMoney, toMinor } from "@/lib/money";
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
import { Plus, Trash2, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

const accountsQuery = queryOptions({
  queryKey: ["accounts"],
  queryFn: () => listAccounts(),
});

export const Route = createFileRoute("/_authenticated/accounts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountsQuery),
  component: AccountsPage,
  pendingComponent: () => (
    <PageShell>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card-elevated h-32 animate-pulse" />
        ))}
      </div>
    </PageShell>
  ),
  errorComponent: ({ error, reset }) => (
    <PageShell>
      <p className="text-sm text-destructive">{error.message}</p>
      <Button className="mt-4" onClick={reset}>
        Retry
      </Button>
    </PageShell>
  ),
});

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Every wallet, bank and card in one place.
          </p>
        </div>
        <NewAccountDialog />
      </div>
      {children}
    </div>
  );
}

function AccountsPage() {
  const { data: accounts } = useSuspenseQuery(accountsQuery);
  const queryClient = useQueryClient();
  const router = useRouter();
  const del = useServerFn(deleteAccount);
  const mutation = useMutation({
    mutationFn: del,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.invalidate();
      toast.success("Account deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <PageShell>
      {accounts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <div key={a.id} className="card-elevated group relative p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: a.color ?? "#22D3A0" }}
                    />
                    {formatAccountType(a.type)}
                  </div>
                  <h3 className="mt-2 text-base font-medium">{a.name}</h3>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${a.name}"? All its transactions will be removed.`))
                      mutation.mutate({ data: { id: a.id } });
                  }}
                  className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete account"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6">
                <div className="tabular text-2xl font-semibold">
                  {formatMoney(a.current_balance_minor, a.currency)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {a.currency}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function EmptyState() {
  return (
    <div className="card-elevated flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Wallet className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-medium">No accounts yet</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Add your first cash, bank or wallet account to start tracking transactions.
      </p>
      <div className="mt-6">
        <NewAccountDialog triggerLabel="Add your first account" />
      </div>
    </div>
  );
}

function NewAccountDialog({ triggerLabel }: { triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof accountTypes)[number]>("bank");
  const [currency, setCurrency] = useState("USD");
  const [opening, setOpening] = useState("0");
  const queryClient = useQueryClient();
  const router = useRouter();
  const create = useServerFn(createAccount);

  const mutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.invalidate();
      toast.success("Account created");
      setOpen(false);
      setName("");
      setOpening("0");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" />
          {triggerLabel ?? "New account"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New account</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({
              data: {
                name,
                type,
                currency,
                opening_balance_minor: toMinor(parseFloat(opening) || 0),
              },
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="acc-name">Name</Label>
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              placeholder="Everyday Checking"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatAccountType(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "INR", "NPR", "JPY", "CNY", "AUD", "CAD", "SGD", "AED"].map(
                    (c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-opening">Opening balance</Label>
            <Input
              id="acc-opening"
              type="number"
              step="0.01"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function formatAccountType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

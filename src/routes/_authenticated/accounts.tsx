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
import { getCurrencyInfo } from "@/lib/currencies";
import { CurrencyPickerModal } from "@/components/CurrencyPickerModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, Loader2, Wallet, CreditCard, Building2, PiggyBank, Coins, Lock, Star, EyeOff } from "lucide-react";
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
          <div key={i} className="card-elevated h-36 animate-pulse" />
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Accounts & Wallets
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your bank accounts, credit cards, investment portfolios, and digital wallets across ISO currencies.
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => {
            const ccyInfo = getCurrencyInfo(a.currency);
            const IconComponent = getAccountIcon(a.type);
            const lastUpdatedDate = a.created_at
              ? new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "Recent";

            return (
              <div key={a.id} className="card-elevated group relative p-5 space-y-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center font-bold shrink-0 border"
                      style={{
                        backgroundColor: `${a.color ?? "#2563EB"}15`,
                        color: a.color ?? "#2563EB",
                        borderColor: `${a.color ?? "#2563EB"}30`,
                      }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-foreground">{a.name}</h3>
                        {(a as any).is_favorite && (
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span>{ccyInfo.flag}</span>
                        <span className="font-semibold text-foreground">{ccyInfo.code}</span>
                        <span>({ccyInfo.symbol})</span>
                        <span>•</span>
                        <span>{formatAccountType(a.type)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${a.name}"? All its transactions will be removed.`))
                        mutation.mutate({ data: { id: a.id } });
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label="Delete account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Balance Display & Flags */}
                <div className="flex items-end justify-between border-t border-border/60 pt-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Current Balance</span>
                    <span className="text-xl font-extrabold text-foreground tabular mt-0.5 block">
                      {formatMoney(a.current_balance_minor, a.currency)}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {(a as any).is_frozen && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                        <Lock className="h-3 w-3 mr-1" /> Frozen
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">Updated {lastUpdatedDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function getAccountIcon(type: string) {
  switch (type) {
    case "credit":
      return CreditCard;
    case "bank":
      return Building2;
    case "savings":
      return PiggyBank;
    case "investment":
    case "crypto":
      return Coins;
    default:
      return Wallet;
  }
}

export function formatAccountType(t: string): string {
  switch (t) {
    case "checking":
      return "Checking";
    case "savings":
      return "Savings";
    case "credit":
      return "Credit Card";
    case "cash":
      return "Cash Wallet";
    case "investment":
      return "Investment";
    case "crypto":
      return "Crypto";
    case "loan":
      return "Loan";
    default:
      return t.charAt(0).toUpperCase() + t.slice(1);
  }
}

function EmptyState() {
  return (
    <div className="card-elevated p-12 text-center space-y-4">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
        <Wallet className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-base font-bold text-foreground">No Accounts Added Yet</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Add your bank accounts, credit cards, or cash wallets to track balances and transactions.
        </p>
      </div>
      <NewAccountDialog />
    </div>
  );
}

function NewAccountDialog() {
  const [open, setOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("checking");
  const [currency, setCurrency] = useState("USD");
  const [balanceInput, setBalanceInput] = useState("0");
  const [color, setColor] = useState("#2563EB");

  const queryClient = useQueryClient();
  const router = useRouter();
  const createFn = useServerFn(createAccount);

  const mutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.invalidate();
      toast.success("Account created successfully!");
      setOpen(false);
      setName("");
      setBalanceInput("0");
    },
    onError: (e) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const balanceNumber = parseFloat(balanceInput) || 0;
    const cleanCurrency = currency.trim().toUpperCase().substring(0, 3);
    mutation.mutate({
      data: {
        name: name.trim(),
        type: type as any,
        currency: cleanCurrency,
        initialBalanceMinor: toMinor(balanceNumber),
        color,
      },
    });
  };

  const selectedCcyInfo = getCurrencyInfo(currency);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="font-bold text-xs shadow-sm bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1.5" /> Add Account
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add New Account</DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Account Name</Label>
              <Input
                placeholder="e.g. Chase Freedom Card or Nabil Savings"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {formatAccountType(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Currency</Label>
                <button
                  type="button"
                  onClick={() => setCurrencyModalOpen(true)}
                  className="w-full flex items-center justify-between px-3 h-9 rounded-md border border-input bg-background text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{selectedCcyInfo.flag}</span>
                    <span>{selectedCcyInfo.code}</span>
                  </span>
                  <span className="text-muted-foreground text-[10px]">({selectedCcyInfo.symbol})</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Starting Balance ({selectedCcyInfo.symbol})</Label>
              <Input
                type="number"
                step="0.01"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                className="text-xs h-9 tabular font-semibold"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={mutation.isPending} className="text-xs font-bold">
                {mutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CurrencyPickerModal
        open={currencyModalOpen}
        onOpenChange={setCurrencyModalOpen}
        selectedCurrency={currency}
        onSelectCurrency={(c) => setCurrency(c.code)}
      />
    </>
  );
}

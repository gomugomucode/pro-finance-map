import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listTransactions,
  listAccounts,
  listCategories,
  deleteTransaction,
} from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuickAddTransaction } from "@/features/transactions/QuickAddTransaction";
import { Search, Trash2, ArrowLeftRight, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const listQuery = queryOptions({
  queryKey: ["transactions"],
  queryFn: () => listTransactions({ data: { limit: 200 } }),
});
const accountsQuery = queryOptions({ queryKey: ["accounts"], queryFn: () => listAccounts() });
const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
});

export const Route = createFileRoute("/_authenticated/transactions")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(listQuery);
    context.queryClient.ensureQueryData(accountsQuery);
    context.queryClient.ensureQueryData(categoriesQuery);
  },
  component: TransactionsPage,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

function TransactionsPage() {
  const { data: txns } = useSuspenseQuery(listQuery);
  const { data: accounts } = useSuspenseQuery(accountsQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);

  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | "income" | "expense" | "transfer">("all");
  const [accountId, setAccountId] = useState<string>("all");

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const accMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      if (kind !== "all" && t.kind !== kind) return false;
      if (accountId !== "all" && t.account_id !== accountId && t.to_account_id !== accountId)
        return false;
      if (search && !(t.description ?? "").toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [txns, kind, accountId, search]);

  const queryClient = useQueryClient();
  const router = useRouter();
  const del = useServerFn(deleteTransaction);
  const mutation = useMutation({
    mutationFn: del,
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.invalidate();
      toast.success("Transaction removed");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Every move your money makes.
          </p>
        </div>
        <QuickAddTransaction />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All kinds</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="card-elevated overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {txns.length === 0
              ? "No transactions yet — add your first one above."
              : "No transactions match your filters."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => {
              const cat = t.category_id ? catMap[t.category_id] : null;
              const acc = accMap[t.account_id];
              const toAcc = t.to_account_id ? accMap[t.to_account_id] : null;
              const Icon =
                t.kind === "income"
                  ? ArrowUpRight
                  : t.kind === "expense"
                    ? ArrowDownRight
                    : ArrowLeftRight;
              const tone =
                t.kind === "income"
                  ? "bg-success/15 text-success"
                  : t.kind === "expense"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-info/15 text-info";
              const sign = t.kind === "income" ? "+" : t.kind === "expense" ? "-" : "";
              const toneText =
                t.kind === "income"
                  ? "text-success"
                  : t.kind === "expense"
                    ? "text-destructive"
                    : "text-info";
              return (
                <li key={t.id} className="group flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {t.description ||
                        (t.kind === "transfer"
                          ? `Transfer${toAcc ? ` → ${toAcc.name}` : ""}`
                          : (cat?.name ?? t.kind))}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(t.occurred_at).toLocaleDateString()} · {acc?.name ?? "—"}
                      {cat && t.kind !== "transfer" ? ` · ${cat.name}` : ""}
                    </div>
                  </div>
                  <div className={`tabular text-sm font-semibold ${toneText}`}>
                    {sign} {formatMoney(t.amount_minor, t.currency)}
                  </div>
                  <button
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-destructive group-hover:opacity-100"
                    onClick={() => {
                      if (confirm("Delete this transaction?"))
                        mutation.mutate({ data: { id: t.id } });
                    }}
                    aria-label="Delete transaction"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

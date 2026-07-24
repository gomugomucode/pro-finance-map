import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import {
  createTransaction,
  listAccounts,
  listCategories,
  listTransactionTemplates,
  listMerchants,
  checkPossibleDuplicateTransaction,
} from "@/lib/finance.functions";
import { toMinor, formatMoney } from "@/lib/money";
import { parseQuickInput, saveQuickAddMemory, rankMerchantSuggestions } from "@/lib/smart-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, Sparkles, Zap, CornerDownLeft, Check, Tag, AlertTriangle, Store } from "lucide-react";
import { toast } from "sonner";

type Kind = "expense" | "income" | "transfer";

interface QuickAddProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function QuickAddTransaction({ open: externalOpen, onOpenChange: externalSetOpen, trigger }: QuickAddProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (externalSetOpen ?? (() => {})) : setInternalOpen;

  const [mode, setMode] = useState<"smart" | "detailed">("smart");
  const [smartText, setSmartText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [kind, setKind] = useState<Kind>("expense");
  const [amount, setAmount] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [occurredAt, setOccurredAt] = useState<string>(() => new Date().toISOString().slice(0, 16));

  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => listAccounts() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const { data: templates = [] } = useQuery({ queryKey: ["transaction_templates"], queryFn: () => listTransactionTemplates() });
  const { data: merchants = [] } = useQuery({ queryKey: ["merchants"], queryFn: () => listMerchants() });

  const queryClient = useQueryClient();
  const router = useRouter();
  const createFn = useServerFn(createTransaction);
  const checkDuplicateFn = useServerFn(checkPossibleDuplicateTransaction);

  const mutation = useMutation({
    mutationFn: (data: any) => createFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      router.invalidate();
      toast.success("Transaction saved");
      setOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setSmartText("");
    setAmount("");
    setMerchantName("");
    setDescription("");
    setKind("expense");
    setCategoryId("");
    setPaymentMethod("");
    setOccurredAt(new Date().toISOString().slice(0, 16));
  };

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (!accountId && accounts[0]) {
        setAccountId(accounts[0].id);
      }
    }
  }, [open, accounts, accountId]);

  // Live Deterministic Parser Result
  const parsed = parseQuickInput(smartText, categories, accounts);

  // Merchant Auto-complete Suggestions
  const merchantSuggestions = rankMerchantSuggestions(
    mode === "smart" ? (parsed.merchant || smartText) : merchantName,
    merchants
  );

  // Sync parsed result to form fields dynamically
  const activeAmount = mode === "smart" ? (parsed.amount ? parsed.amount.toString() : amount) : amount;
  const activeKind = mode === "smart" ? parsed.kind : kind;
  const activeCategoryId = mode === "smart" ? (parsed.matchedCategoryId ?? categoryId) : categoryId;
  const activeAccountId = mode === "smart" ? (parsed.matchedAccountId ?? accountId) : accountId;
  const activeDescription = mode === "smart" ? parsed.description : description;
  const activeOccurredAt = mode === "smart" ? parsed.occurredAt : occurredAt;
  const activeMerchant = mode === "smart" ? (parsed.merchant || merchantName) : merchantName;

  // Duplicate Check Query
  const activeAmountMinor = activeAmount ? toMinor(parseFloat(activeAmount)) : 0;
  const { data: duplicateCheck } = useQuery({
    queryKey: ["duplicate_check", activeAmountMinor, activeMerchant],
    queryFn: () => checkDuplicateFn({ data: { amount_minor: activeAmountMinor, merchant: activeMerchant } }),
    enabled: activeAmountMinor > 0 && open,
  });

  const currentAcc = accounts.find((a) => a.id === (activeAccountId || accounts[0]?.id));
  const currentCat = categories.find((c) => c.id === activeCategoryId);

  const canSubmit =
    !!activeAccountId &&
    !!activeAmount &&
    parseFloat(activeAmount) > 0 &&
    (activeKind !== "transfer" || (!!toAccountId && toAccountId !== activeAccountId));

  const handleSelectMerchantSuggestion = (m: any) => {
    setMerchantName(m.name);
    if (m.default_category_id) setCategoryId(m.default_category_id);
    if (m.default_account_id) setAccountId(m.default_account_id);
    if (m.default_payment_method) setPaymentMethod(m.default_payment_method);
    toast.info(`Loaded preferences for "${m.name}"`);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit || !currentAcc) {
      toast.error("Please specify a valid amount and account.");
      return;
    }

    const amount_minor = toMinor(parseFloat(activeAmount));

    // Save memory association for smart learning
    if (activeDescription && activeCategoryId) {
      saveQuickAddMemory(activeDescription, activeCategoryId, activeAccountId);
    }

    mutation.mutate({
      kind: activeKind,
      account_id: activeAccountId || currentAcc.id,
      to_account_id: activeKind === "transfer" ? toAccountId : null,
      category_id: activeKind !== "transfer" ? activeCategoryId || null : null,
      amount_minor,
      currency: currentAcc.currency,
      occurred_at: new Date(activeOccurredAt).toISOString(),
      description: activeDescription || null,
      merchant: activeMerchant || null,
      payment_method: paymentMethod || null,
    });
  };

  const applyTemplate = (tpl: any) => {
    setKind(tpl.kind);
    setAmount((tpl.amount_minor / 100).toString());
    setDescription(tpl.name || tpl.description || "");
    if (tpl.account_id) setAccountId(tpl.account_id);
    if (tpl.category_id) setCategoryId(tpl.category_id);
    setMode("detailed");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button disabled={accounts.length === 0} className="shadow-md">
              <Plus className="mr-1.5 h-4 w-4" /> Quick Add
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg p-6 space-y-4">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Smart Quick Add
          </DialogTitle>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode("smart")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                mode === "smart" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Smart Natural
            </button>
            <button
              type="button"
              onClick={() => setMode("detailed")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                mode === "detailed" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Full Form
            </button>
          </div>
        </DialogHeader>

        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Please create an account first in the Accounts tab to log transactions.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Real-time Duplicate Detection Alert */}
            {duplicateCheck?.possibleDuplicate && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-2.5 text-xs text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Possible duplicate: A transaction for <strong>{formatMoney(duplicateCheck.match?.amount_minor || 0, "USD")}</strong> was logged recently.
                </span>
              </div>
            )}

            {mode === "smart" ? (
              <div className="space-y-3">
                {/* Natural Language Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="smart-input" className="text-xs font-medium text-muted-foreground">
                    Type entry (e.g. <span className="text-primary">"500 lunch"</span>, <span className="text-primary">"800 fuel yesterday"</span>, <span className="text-primary">"35000 salary"</span>)
                  </Label>
                  <div className="relative">
                    <Input
                      id="smart-input"
                      ref={inputRef}
                      value={smartText}
                      onChange={(e) => setSmartText(e.target.value)}
                      placeholder="e.g. 250 coffee at Starbucks"
                      className="text-base py-5 pr-10 font-medium tracking-wide shadow-inner"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-[10px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded border border-border">
                      <CornerDownLeft className="h-3 w-3" /> Enter
                    </div>
                  </div>
                </div>

                {/* Smart Merchant Suggestions Chips */}
                {merchantSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {merchantSuggestions.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMerchantSuggestion(m)}
                        className="rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-[11px] font-medium transition hover:border-primary hover:bg-accent flex items-center gap-1"
                      >
                        <Store className="h-3 w-3 text-primary" />
                        {m.name}
                        {m.visit_count ? (
                          <span className="text-[9px] text-muted-foreground">({m.visit_count}x)</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}

                {/* Real-time Parsed Result Preview Badges */}
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-2.5">
                  <div className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                    <span>Live Inferred Preview</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {parsed.kind}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Amount:</span>{" "}
                      <span className="font-bold tabular text-foreground text-sm">
                        {parsed.amount ? formatMoney(parsed.amountMinor!, currentAcc?.currency ?? "USD") : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Category:</span>{" "}
                      <span className="font-semibold text-primary">
                        {currentCat ? currentCat.name : parsed.categoryKeyword ?? "Uncategorized"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Account:</span>{" "}
                      <span className="font-medium text-foreground">
                        {currentAcc ? currentAcc.name : "Default"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Date:</span>{" "}
                      <span className="font-medium text-foreground">
                        {new Date(parsed.occurredAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Favorite Templates Chips */}
                {templates.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" /> Preset Templates (1-Tap)
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {templates.slice(0, 5).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => applyTemplate(t)}
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium transition hover:border-primary hover:bg-accent flex items-center gap-1.5"
                        >
                          <Tag className="h-3 w-3 text-primary" />
                          {t.name}
                          <span className="tabular text-muted-foreground">
                            (${ (t.amount_minor / 100).toFixed(0) })
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Detailed Form Mode */
              <div className="space-y-4">
                <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="expense">Expense</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="transfer">Transfer</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Amount ({currentAcc?.currency ?? "USD"})</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-base tabular"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="merchant">Merchant / Vendor</Label>
                    <Input
                      id="merchant"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      placeholder="e.g. Starbucks"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Account</Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {kind === "transfer" ? (
                    <div className="space-y-1.5">
                      <Label>To Account</Label>
                      <Select value={toAccountId} onValueChange={setToAccountId}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {accounts.filter((a) => a.id !== accountId).map((a) => (
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
                          {categories.filter((c) => c.kind === kind).map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="desc">Description / Note</Label>
                  <Textarea
                    id="desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Coffee at Blue Bottle"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="submit" disabled={!canSubmit || mutation.isPending} className="w-full sm:w-auto">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-1.5 h-4 w-4" /> Save Transaction
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

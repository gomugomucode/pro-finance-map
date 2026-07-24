import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createMerchant,
  updateMerchant,
  mergeMerchants,
  listCategories,
  listAccounts,
} from "@/lib/finance.functions";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Store, GitMerge } from "lucide-react";
import { toast } from "sonner";

interface MerchantFormProps {
  existing?: any;
  trigger?: React.ReactNode;
}

export function MerchantForm({ existing, trigger }: MerchantFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [defaultCategoryId, setDefaultCategoryId] = useState(existing?.default_category_id ?? "");
  const [defaultAccountId, setDefaultAccountId] = useState(existing?.default_account_id ?? "");
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(existing?.default_payment_method ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [isFavorite, setIsFavorite] = useState(existing?.is_favorite ?? false);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => listAccounts() });

  const queryClient = useQueryClient();
  const createFn = useServerFn(createMerchant);
  const updateFn = useServerFn(updateMerchant);

  const createMutation = useMutation({
    mutationFn: (data: any) => createFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      toast.success("Merchant saved");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      toast.success("Merchant updated");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existing) {
      updateMutation.mutate({
        id: existing.id,
        patch: {
          name,
          default_category_id: defaultCategoryId || null,
          default_account_id: defaultAccountId || null,
          default_payment_method: defaultPaymentMethod || null,
          notes: notes || null,
          is_favorite: isFavorite,
        },
      });
    } else {
      createMutation.mutate({
        name,
        default_category_id: defaultCategoryId || null,
        default_account_id: defaultAccountId || null,
        default_payment_method: defaultPaymentMethod || null,
        notes: notes || null,
        is_favorite: isFavorite,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> Add Merchant
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            {existing ? "Edit Merchant" : "Add Merchant"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Merchant Name</Label>
            <Input
              id="m-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starbucks, Pathao, Amazon"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Default Category</Label>
              <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Default Account</Label>
              <Select value={defaultAccountId} onValueChange={setDefaultAccountId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pm">Preferred Payment Method</Label>
            <Input
              id="pm"
              value={defaultPaymentMethod}
              onChange={(e) => setDefaultPaymentMethod(e.target.value)}
              placeholder="e.g. Credit Card, Cash, Digital Wallet"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal vendor notes or location info"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="fav"
              checked={isFavorite}
              onCheckedChange={(v) => setIsFavorite(v === true)}
            />
            <Label htmlFor="fav" className="cursor-pointer text-sm font-normal">
              Pin as Favorite Merchant
            </Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existing ? "Save Changes" : "Create Merchant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MergeMerchantModal({ merchants }: { merchants: any[] }) {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");

  const queryClient = useQueryClient();
  const mergeFn = useServerFn(mergeMerchants);

  const mutation = useMutation({
    mutationFn: (data: any) => mergeFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Merchants merged successfully");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) {
      toast.error("Please select two distinct merchants to merge.");
      return;
    }
    mutation.mutate({ sourceId, targetId });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitMerge className="mr-1.5 h-3.5 w-3.5" /> Merge Duplicates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" /> Merge Duplicate Merchants
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onMerge}>
          <p className="text-xs text-muted-foreground">
            Merge all visit history and transactions from the Duplicate Merchant into the Primary Merchant.
          </p>

          <div className="space-y-1.5">
            <Label>Duplicate Merchant (Will be deleted)</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue placeholder="Select duplicate..." /></SelectTrigger>
              <SelectContent>
                {merchants.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Primary Merchant (Will keep history)</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger><SelectValue placeholder="Select primary..." /></SelectTrigger>
              <SelectContent>
                {merchants.filter((m) => m.id !== sourceId).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || !sourceId || !targetId}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Merge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

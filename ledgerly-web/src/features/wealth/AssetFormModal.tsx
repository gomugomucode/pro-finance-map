import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createAsset, updateAsset } from "@/lib/finance.functions";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Landmark } from "lucide-react";
import { toast } from "sonner";

const ASSET_TYPES = [
  { value: "cash", label: "Cash & Emergency Fund" },
  { value: "bank_deposit", label: "Fixed / Bank Deposit" },
  { value: "vehicle", label: "Vehicle (Car, Bike, etc.)" },
  { value: "land", label: "Land Property" },
  { value: "house", label: "House / Villa" },
  { value: "apartment", label: "Apartment / Condo" },
  { value: "office", label: "Commercial / Office Space" },
  { value: "gold", label: "Gold & Bullion" },
  { value: "silver", label: "Silver & Metals" },
  { value: "jewelry", label: "Jewelry & Precious Items" },
  { value: "electronics", label: "High-value Electronics" },
  { value: "business", label: "Business Equity / Ownership" },
  { value: "stocks", label: "Public Stocks & Equities" },
  { value: "mutual_funds", label: "Mutual Funds / ETFs" },
  { value: "bonds", label: "Government / Corporate Bonds" },
  { value: "crypto", label: "Cryptocurrency (BTC, ETH, etc.)" },
  { value: "nft", label: "NFTs & Digital Assets" },
  { value: "collectibles", label: "Art & Collectibles" },
  { value: "other", label: "Other Asset" },
];

interface AssetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetToEdit?: any;
}

export function AssetFormModal({ open, onOpenChange, assetToEdit }: AssetFormModalProps) {
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("house");
  const [currentValue, setCurrentValue] = useState("");
  const [purchaseValue, setPurchaseValue] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [symbol, setSymbol] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();
  const createFn = useServerFn(createAsset);
  const updateFn = useServerFn(updateAsset);

  useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name || "");
      setAssetType(assetToEdit.asset_type || "house");
      setCurrentValue((assetToEdit.current_value_minor / 100).toString());
      setPurchaseValue(assetToEdit.purchase_value_minor ? (assetToEdit.purchase_value_minor / 100).toString() : "");
      setQuantity(assetToEdit.quantity?.toString() || "1");
      setSymbol(assetToEdit.symbol || "");
      setLocation(assetToEdit.location || "");
      setNotes(assetToEdit.notes || "");
    } else {
      resetForm();
    }
  }, [assetToEdit, open]);

  const resetForm = () => {
    setName("");
    setAssetType("house");
    setCurrentValue("");
    setPurchaseValue("");
    setQuantity("1");
    setSymbol("");
    setLocation("");
    setNotes("");
  };

  const mutation = useMutation({
    mutationFn: (data: any) =>
      assetToEdit
        ? updateFn({ data: { id: assetToEdit.id, patch: data } })
        : createFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["net_worth_summary"] });
      toast.success(assetToEdit ? "Asset updated" : "Asset added to portfolio");
      onOpenChange(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !currentValue) {
      toast.error("Please specify asset name and current market value.");
      return;
    }

    mutation.mutate({
      name,
      asset_type: assetType as any,
      current_value_minor: toMinor(parseFloat(currentValue)),
      purchase_value_minor: purchaseValue ? toMinor(parseFloat(purchaseValue)) : 0,
      quantity: parseFloat(quantity) || 1,
      symbol: symbol || null,
      location: location || null,
      notes: notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            {assetToEdit ? "Edit Asset Valuation" : "Add Asset to Wealth Portfolio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asset-name">Asset Name</Label>
              <Input
                id="asset-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kathmandu Residence"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Asset Type</Label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-val">Current Valuation ($)</Label>
              <Input
                id="current-val"
                type="number"
                step="0.01"
                required
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0.00"
                className="text-base tabular font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-val">Original Purchase Cost ($)</Label>
              <Input
                id="purchase-val"
                type="number"
                step="0.01"
                value={purchaseValue}
                onChange={(e) => setPurchaseValue(e.target.value)}
                placeholder="Optional"
                className="text-base tabular"
              />
            </div>
          </div>

          {(assetType === "stocks" || assetType === "crypto" || assetType === "gold" || assetType === "mutual_funds") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="symbol">Symbol / Ticker</Label>
                <Input
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. AAPL, BTC, NICA"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qty">Quantity / Units</Label>
                <Input
                  id="qty"
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="location">Location / Address</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lazimpat, Kathmandu"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Registered in joint ownership"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {assetToEdit ? "Update Valuation" : "Save Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

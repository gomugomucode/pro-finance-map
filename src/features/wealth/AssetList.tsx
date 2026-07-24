import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAssets, deleteAsset } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { AssetFormModal } from "./AssetFormModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Landmark, Pencil, Trash2, Home, Car, Coins, TrendingUp, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AssetList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => listAssets(),
  });

  const queryClient = useQueryClient();
  const deleteFn = useServerFn(deleteAsset);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["net_worth_summary"] });
      toast.success("Asset removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "house":
      case "land":
      case "apartment":
      case "office":
        return <Home className="h-5 w-5 text-primary" />;
      case "vehicle":
        return <Car className="h-5 w-5 text-info" />;
      case "gold":
      case "silver":
      case "jewelry":
        return <Coins className="h-5 w-5 text-amber-400" />;
      case "stocks":
      case "crypto":
      case "mutual_funds":
        return <TrendingUp className="h-5 w-5 text-success" />;
      default:
        return <Landmark className="h-5 w-5 text-primary" />;
    }
  };

  const filteredAssets = assets.filter((a: any) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "property") return ["land", "house", "apartment", "office"].includes(a.asset_type);
    if (activeFilter === "investments") return ["stocks", "mutual_funds", "bonds", "crypto", "nft"].includes(a.asset_type);
    if (activeFilter === "precious") return ["gold", "silver", "jewelry"].includes(a.asset_type);
    if (activeFilter === "vehicles") return a.asset_type === "vehicle";
    return true;
  });

  const totalAssetValuationMinor = filteredAssets.reduce((sum: number, a: any) => sum + Number(a.current_value_minor || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" /> Tangible & Investment Assets
          </h3>
          <p className="text-xs text-muted-foreground">
            Valuation: <strong className="text-foreground">{formatMoney(totalAssetValuationMinor, "USD")}</strong> across {filteredAssets.length} items
          </p>
        </div>

        <Button onClick={() => { setAssetToEdit(null); setModalOpen(true); }} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Add Asset
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b pb-2">
        {["all", "property", "investments", "precious", "vehicles"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFilter(f)}
            className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition ${
              activeFilter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <Card className="p-8 text-center">
          <Landmark className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No assets added yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Track real estate, vehicles, gold, investments, and physical possessions to build your net worth profile.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((a: any) => (
            <Card key={a.id} className="p-4 space-y-3 relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                    {getAssetIcon(a.asset_type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{a.name}</h4>
                    <Badge variant="outline" className="text-[10px] capitalize mt-0.5">
                      {a.asset_type.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => { setAssetToEdit(a); setModalOpen(true); }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove asset "${a.name}" from your portfolio?`)) {
                        deleteMutation.mutate(a.id);
                      }
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t pt-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground">Market Value:</span>
                  <div className="font-bold tabular text-foreground text-sm">
                    {formatMoney(a.current_value_minor, a.currency)}
                  </div>
                </div>

                {a.purchase_value_minor > 0 && (
                  <div className="text-right">
                    <span className="text-muted-foreground">Purchase Cost:</span>
                    <div className="font-semibold tabular text-muted-foreground">
                      {formatMoney(a.purchase_value_minor, a.currency)}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AssetFormModal open={modalOpen} onOpenChange={setModalOpen} assetToEdit={assetToEdit} />
    </div>
  );
}

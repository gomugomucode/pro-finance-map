import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { deleteMerchant, updateMerchant } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { MerchantForm, MergeMerchantModal } from "./MerchantForm";
import { MerchantProfileModal } from "./MerchantProfileModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Store,
  Star,
  Pencil,
  Trash2,
  TrendingUp,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface MerchantListProps {
  merchants: any[];
}

export function MerchantList({ merchants }: MerchantListProps) {
  const [search, setSearch] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const deleteFn = useServerFn(deleteMerchant);
  const updateFn = useServerFn(updateMerchant);

  const deleteMutation = useMutation({
    mutationFn: (data: any) => deleteFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      toast.success("Merchant deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFavorite = useMutation({
    mutationFn: (m: any) => updateFn({ data: { id: m.id, patch: { is_favorite: !m.is_favorite } } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      toast.success("Updated favorite merchant");
    },
  });

  const filtered = merchants.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.categories?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchants or categories..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <MergeMerchantModal merchants={merchants} />
          <MerchantForm />
        </div>
      </div>

      {/* Merchants Grid */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Store className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No merchants found</p>
          <p className="text-xs text-muted-foreground mt-1">
            As you log transactions, Ledgerly will automatically create and update merchant profiles.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Card key={m.id} className="relative overflow-hidden group hover:border-primary/50 transition">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-base">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        {m.name}
                        {m.is_favorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {m.categories?.name ?? "General"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFavorite.mutate(m)}
                    className="p-1 rounded text-muted-foreground hover:text-amber-400 transition"
                  >
                    <Star className={`h-4 w-4 ${m.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-lg">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Visits</span>
                    <p className="font-bold text-foreground">{m.visit_count || 1}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Total Spent</span>
                    <p className="font-bold text-primary tabular">{formatMoney(m.total_spent_minor || 0, "USD")}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setSelectedMerchantId(m.id)}
                  >
                    <Eye className="mr-1 h-3 w-3" /> View Profile
                  </Button>

                  <div className="flex items-center gap-1">
                    <MerchantForm
                      existing={m}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => {
                        if (confirm(`Delete merchant "${m.name}"?`)) {
                          deleteMutation.mutate({ id: m.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Profile Detail Modal */}
      <MerchantProfileModal
        merchantId={selectedMerchantId}
        open={!!selectedMerchantId}
        onOpenChange={(o) => {
          if (!o) setSelectedMerchantId(null);
        }}
      />
    </div>
  );
}

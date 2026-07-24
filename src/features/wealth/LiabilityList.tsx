import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLiabilities, deleteLiability } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { LiabilityFormModal } from "./LiabilityFormModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Pencil, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function LiabilityList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [liabilityToEdit, setLiabilityToEdit] = useState<any>(null);

  const { data: liabilities = [], isLoading } = useQuery({
    queryKey: ["liabilities"],
    queryFn: () => listLiabilities(),
  });

  const queryClient = useQueryClient();
  const deleteFn = useServerFn(deleteLiability);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
      queryClient.invalidateQueries({ queryKey: ["net_worth_summary"] });
      toast.success("Liability record removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalOwedMinor = liabilities.reduce((sum, l) => sum + Number(l.current_balance_minor || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2 text-destructive">
            <CreditCard className="h-5 w-5" /> Liabilities & Debts Owed
          </h3>
          <p className="text-xs text-muted-foreground">
            Total Owed: <strong className="text-destructive">{formatMoney(totalOwedMinor, "USD")}</strong> across {liabilities.length} items
          </p>
        </div>

        <Button onClick={() => { setLiabilityToEdit(null); setModalOpen(true); }} size="sm" variant="destructive">
          <Plus className="mr-1.5 h-4 w-4" /> Add Liability
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : liabilities.length === 0 ? (
        <Card className="p-8 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">Zero liabilities recorded</p>
          <p className="text-xs text-muted-foreground mt-1">
            Track mortgages, credit card balances, car loans, and taxes owed for accurate net worth math.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liabilities.map((l) => (
            <Card key={l.id} className="p-4 space-y-3 relative group border-destructive/20 bg-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{l.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className="text-[10px] capitalize border-destructive/30 text-destructive">
                        {l.liability_type.replace("_", " ")}
                      </Badge>
                      {l.institution && <span className="text-[10px] text-muted-foreground">{l.institution}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => { setLiabilityToEdit(l); setModalOpen(true); }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete liability "${l.name}"?`)) {
                        deleteMutation.mutate(l.id);
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
                  <span className="text-muted-foreground">Current Balance Owed:</span>
                  <div className="font-bold tabular text-destructive text-sm">
                    {formatMoney(l.current_balance_minor, l.currency)}
                  </div>
                </div>

                {l.interest_rate > 0 && (
                  <div className="text-right">
                    <span className="text-muted-foreground">Interest:</span>
                    <div className="font-semibold tabular text-foreground">
                      {l.interest_rate}% p.a.
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <LiabilityFormModal open={modalOpen} onOpenChange={setModalOpen} liabilityToEdit={liabilityToEdit} />
    </div>
  );
}

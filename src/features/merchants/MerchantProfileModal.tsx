import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMerchant } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Calendar, TrendingUp, DollarSign, Repeat, Loader2 } from "lucide-react";

interface MerchantProfileModalProps {
  merchantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MerchantProfileModal({ merchantId, open, onOpenChange }: MerchantProfileModalProps) {
  const getFn = useServerFn(getMerchant);
  const { data, isLoading } = useQuery({
    queryKey: ["merchant_profile", merchantId],
    queryFn: () => getFn({ data: { id: merchantId! } }),
    enabled: !!merchantId && open,
  });

  if (!open || !merchantId) return null;

  const merchant = data?.merchant;
  const recentTxns = data?.recentTransactions ?? [];

  const avgSpentMinor = merchant?.visit_count
    ? Math.round(Number(merchant.total_spent_minor || 0) / merchant.visit_count)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !merchant ? (
          <p className="text-sm text-muted-foreground p-4">Merchant details not available.</p>
        ) : (
          <div className="space-y-5">
            <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xl">
                  {merchant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    {merchant.name}
                    {merchant.is_favorite && (
                      <Badge variant="secondary" className="text-[10px]">Pinned</Badge>
                    )}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Last visited: {new Date(merchant.last_used_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Total Spent</div>
                  <div className="text-base font-bold text-foreground mt-0.5 tabular">
                    {formatMoney(merchant.total_spent_minor || 0, "USD")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Visits</div>
                  <div className="text-base font-bold text-foreground mt-0.5 tabular">
                    {merchant.visit_count || 1}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Avg Purchase</div>
                  <div className="text-base font-bold text-foreground mt-0.5 tabular">
                    {formatMoney(avgSpentMinor, "USD")}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Default Behavior Badges */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Learned Defaults
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Category:</span>{" "}
                  <span className="font-semibold text-primary">
                    {merchant.categories?.name ?? "Auto-Detect"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Preferred Account:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {merchant.accounts?.name ?? "Default"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Method:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {merchant.default_payment_method ?? "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Purchase:</span>{" "}
                  <span className="font-semibold text-foreground tabular">
                    {formatMoney(merchant.last_amount_minor || 0, "USD")}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Merchant Transactions */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Recent Transactions ({recentTxns.length})
              </h4>
              <div className="divide-y rounded-xl border border-border bg-card">
                {recentTxns.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted-foreground">No recent transactions recorded.</p>
                ) : (
                  recentTxns.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 text-xs">
                      <div>
                        <p className="font-medium text-foreground">{t.description || merchant.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(t.occurred_at).toLocaleDateString()} • {t.categories?.name ?? "Uncategorized"}
                        </p>
                      </div>
                      <div className="font-bold tabular text-sm">
                        {formatMoney(t.amount_minor, t.currency)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

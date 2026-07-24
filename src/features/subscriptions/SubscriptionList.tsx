import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { deleteSubscription, updateSubscription } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionForm } from "./SubscriptionForm";
import { Trash2, Pencil, Calendar, Bell, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export interface SubscriptionItem {
  id: string;
  name: string;
  provider_icon?: string | null;
  color: string;
  amount_minor: number;
  currency: string;
  billing_cycle: "weekly" | "monthly" | "yearly";
  next_renewal_date: string;
  account_id?: string | null;
  category_id?: string | null;
  is_active: boolean;
  reminder_days_before: number;
  notes?: string | null;
}

export function SubscriptionList({ items }: { items: SubscriptionItem[] }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const updateFn = useServerFn(updateSubscription);
  const deleteFn = useServerFn(deleteSubscription);

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateFn({ data: { id, patch: { is_active } } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      router.invalidate();
      toast.success("Subscription state updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      router.invalidate();
      toast.success("Subscription removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (items.length === 0) {
    return (
      <div className="card-elevated p-8 text-center">
        <h3 className="text-base font-semibold">No active subscriptions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Track streaming, hosting, domains, utilities, and software bills with renewal alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((sub) => {
        const annualMinor =
          sub.billing_cycle === "yearly"
            ? sub.amount_minor
            : sub.billing_cycle === "monthly"
              ? sub.amount_minor * 12
              : sub.amount_minor * 52;

        const isRenewalSoon =
          new Date(sub.next_renewal_date).getTime() - new Date().getTime() <=
          sub.reminder_days_before * 24 * 60 * 60 * 1000;

        return (
          <div
            key={sub.id}
            className={`group card-elevated flex flex-col justify-between p-5 transition ${
              sub.is_active ? "hover:border-primary/40" : "opacity-60"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-xl text-white font-bold shadow-sm text-lg"
                    style={{ backgroundColor: sub.color || "#22D3A0" }}
                  >
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">{sub.name}</h3>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {sub.billing_cycle}
                      </Badge>
                      {!sub.is_active && (
                        <Badge variant="secondary" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <SubscriptionForm
                    existing={sub}
                    trigger={
                      <button className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-primary group-hover:opacity-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 transition group-hover:opacity-100"
                    onClick={() => {
                      if (confirm(`Remove subscription "${sub.name}"?`)) deleteMutation.mutate(sub.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Pricing & Renewal */}
              <div className="mt-5 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold tracking-tight tabular">
                    {formatMoney(sub.amount_minor, sub.currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ~{formatMoney(annualMinor, sub.currency)}/yr
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Renews: {new Date(sub.next_renewal_date).toLocaleDateString()}
                  </span>
                  {isRenewalSoon && sub.is_active && (
                    <span className="flex items-center gap-1 text-amber-500 font-medium">
                      <Bell className="h-3 w-3" /> Due Soon
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle state */}
            <div className="mt-6 pt-3 border-t border-border flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={() =>
                  toggleActiveMutation.mutate({ id: sub.id, is_active: !sub.is_active })
                }
              >
                {sub.is_active ? (
                  <>
                    <XCircle className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Mark Inactive
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-success" /> Mark Active
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

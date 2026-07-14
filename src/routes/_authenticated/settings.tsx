import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getProfile, updateProfile } from "@/lib/finance.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const profileQuery = queryOptions({ queryKey: ["profile"], queryFn: () => getProfile() });

export const Route = createFileRoute("/_authenticated/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  component: SettingsPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
});

function SettingsPage() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [currency, setCurrency] = useState(profile?.base_currency ?? "USD");
  const queryClient = useQueryClient();
  const router = useRouter();
  const update = useServerFn(updateProfile);
  const mutation = useMutation({
    mutationFn: update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Preferences that shape how Ledgerly shows your money.
      </p>

      <form
        className="card-elevated mt-6 space-y-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ data: { display_name: displayName, base_currency: currency } });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="dn">Display name</Label>
          <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
        </div>
        <div className="space-y-1.5">
          <Label>Base currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["USD", "EUR", "GBP", "INR", "NPR", "JPY", "CNY", "AUD", "CAD", "SGD", "AED"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Aggregate totals across accounts display in this currency.
          </p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>

      <div className="card-elevated mt-6 p-6">
        <h2 className="text-sm font-medium">Session</h2>
        <p className="mt-1 text-xs text-muted-foreground">Sign out on this device.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={async () => {
            await queryClient.cancelQueries();
            queryClient.clear();
            await supabase.auth.signOut();
            router.navigate({ to: "/auth", replace: true });
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}

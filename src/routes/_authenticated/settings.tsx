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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AuditLogViewer } from "@/features/settings/AuditLogViewer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, User, Globe, Bell, Lock } from "lucide-react";
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
  const [dateFormat, setDateFormat] = useState(profile?.date_format ?? "MM/DD/YYYY");
  const [numberFormat, setNumberFormat] = useState(profile?.number_format ?? "en-US");

  const queryClient = useQueryClient();
  const router = useRouter();
  const update = useServerFn(updateProfile);

  const mutation = useMutation({
    mutationFn: update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings & System Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Manage system defaults, locale formats, security audit logs, and authentication sessions.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <User className="h-4 w-4" /> Profile & General
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1.5">
            <Globe className="h-4 w-4" /> Formatting & Locale
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Security & Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile */}
        <TabsContent value="profile">
          <form
            className="card-elevated space-y-5 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({
                data: {
                  display_name: displayName,
                  base_currency: currency,
                },
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="dn">Display Name</Label>
              <Input
                id="dn"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Base System Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "INR", "NPR", "JPY", "CNY", "AUD", "CAD", "SGD", "AED"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Aggregate balance metrics across multi-currency accounts display in this base currency.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Tab 2: Preferences */}
        <TabsContent value="preferences">
          <div className="card-elevated p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Number Locale Format</Label>
                <Select value={numberFormat} onValueChange={setNumberFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">US Standard (1,234.56)</SelectItem>
                    <SelectItem value="en-IN">Indian Standard (1,23,456.78)</SelectItem>
                    <SelectItem value="de-DE">European (1.234,56)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Security & Audit */}
        <TabsContent value="security" className="space-y-6">
          <AuditLogViewer />

          <div className="card-elevated p-6 space-y-3">
            <h3 className="font-semibold text-base">Active Session</h3>
            <p className="text-xs text-muted-foreground">
              Sign out from Ledgerly on this device. Your data remains secured under Supabase Row-Level Security (RLS).
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                await queryClient.cancelQueries();
                queryClient.clear();
                await supabase.auth.signOut();
                router.navigate({ to: "/auth", replace: true });
              }}
            >
              Sign Out Session
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

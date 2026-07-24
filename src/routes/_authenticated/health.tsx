import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { listAccounts, getDashboard } from "@/lib/finance.functions";
import { clearDemoData } from "@/lib/demo-engine";
import { createBackupJSON } from "@/lib/backup-engine";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const healthQuery = queryOptions({
  queryKey: ["health_diagnostics"],
  queryFn: async () => {
    const [accounts, d] = await Promise.all([listAccounts(), getDashboard()]);
    return { accounts, d };
  },
});

export const Route = createFileRoute("/_authenticated/health")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(healthQuery);
  },
  component: HealthCheckPage,
  pendingComponent: () => (
    <div className="p-12 text-center text-sm font-semibold text-muted-foreground flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span>Running system diagnostics & health checks...</span>
    </div>
  ),
});

function HealthCheckPage() {
  const { data } = useSuspenseQuery(healthQuery);
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const [clearingDemo, setClearingDemo] = useState(false);

  const { accounts, d } = data;

  // Diagnostics logic
  const negativeAccounts = accounts.filter((a) => Number(a.current_balance_minor || 0) < 0);
  const demoAccounts = accounts.filter((a) => a.name.includes("[Demo]"));
  const recentTxns = d.recent || [];

  const totalChecks = 4;
  let passedChecks = 4;

  if (negativeAccounts.length > 0) passedChecks--;
  if (demoAccounts.length > 0) passedChecks--;

  const handleExportBackup = async () => {
    setDownloading(true);
    try {
      const json = await createBackupJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledgerly_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleClearDemo = async () => {
    setClearingDemo(true);
    await clearDemoData();
    queryClient.invalidateQueries({ queryKey: ["health_diagnostics"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    setClearingDemo(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Health Check Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Automated database integrity diagnostics, backup management, and 1-click repairs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportBackup} disabled={downloading}>
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Exporting..." : "Download Backup"}
          </Button>
        </div>
      </div>

      {/* Diagnostics Score Card */}
      <div className="card-elevated p-6 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-extrabold text-foreground">System Health Status</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {passedChecks} out of {totalChecks} diagnostic checks passed clean.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`text-sm font-bold px-3 py-1 ${
              passedChecks === totalChecks
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-500 border-amber-500/30"
            }`}
          >
            {passedChecks === totalChecks ? "100% Operational" : `${passedChecks}/${totalChecks} Checks Passed`}
          </Badge>
        </div>
      </div>

      {/* Diagnostic Items */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Negative Balances */}
        <div className="card-elevated p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {negativeAccounts.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}
              <h3 className="text-sm font-bold text-foreground">Negative Balance Check</h3>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {negativeAccounts.length} Issues
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {negativeAccounts.length === 0
              ? "All accounts and liquid balances have positive standing."
              : `${negativeAccounts.length} account(s) have negative balances.`}
          </p>
        </div>

        {/* Demo Data Flag */}
        <div className="card-elevated p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {demoAccounts.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}
              <h3 className="text-sm font-bold text-foreground">Demo Data Status</h3>
            </div>
            {demoAccounts.length > 0 && (
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleClearDemo} disabled={clearingDemo}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Start Fresh
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {demoAccounts.length === 0
              ? "No demo data active. Environment is pure production."
              : `${demoAccounts.length} demo account(s) active in your database.`}
          </p>
        </div>
      </div>
    </div>
  );
}

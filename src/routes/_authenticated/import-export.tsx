import { createFileRoute } from "@tanstack/react-router";
import { ImportWizard } from "@/features/import-export/ImportWizard";
import { ImportHistoryList } from "@/features/import-export/ImportHistoryList";
import { AccountReconciliation } from "@/features/import-export/AccountReconciliation";
import { DataExporter } from "@/features/import-export/DataExporter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Scale, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/import-export")({
  component: ImportExportPage,
});

function ImportExportPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" /> Import & Reconciliation Center
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Migrate financial history from bank statements, mobile wallets, or app backups with batch tracking, rollbacks, and account balance reconciliation.
        </p>
      </div>

      <Tabs defaultValue="wizard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wizard" className="flex items-center gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" /> Import Wizard
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Audit & Rollbacks
          </TabsTrigger>
          <TabsTrigger value="reconcile" className="flex items-center gap-1.5 text-xs">
            <Scale className="h-3.5 w-3.5" /> Reconciliation
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export Suite
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wizard">
          <ImportWizard />
        </TabsContent>

        <TabsContent value="history">
          <ImportHistoryList />
        </TabsContent>

        <TabsContent value="reconcile">
          <AccountReconciliation />
        </TabsContent>

        <TabsContent value="export">
          <DataExporter />
        </TabsContent>
      </Tabs>
    </div>
  );
}

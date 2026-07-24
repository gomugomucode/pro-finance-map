import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImportWizard } from "@/features/import-export/ImportWizard";
import { ImportHistoryList } from "@/features/import-export/ImportHistoryList";
import { AccountReconciliation } from "@/features/import-export/AccountReconciliation";
import { DataExporter } from "@/features/import-export/DataExporter";
import { SmsReviewCenter } from "@/features/mobile/components/SmsReviewCenter";
import { SmsSettingsPanel } from "@/features/mobile/components/SmsSettingsPanel";
import { SmsNotificationBanner } from "@/features/mobile/components/SmsNotificationBanner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Scale, Download, Smartphone, Sliders } from "lucide-react";

export const Route = createFileRoute("/_authenticated/import-export")({
  component: ImportExportPage,
});

function ImportExportPage() {
  const [activeTab, setActiveTab] = useState("sms-review");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" /> Import, SMS Capture & Reconciliation Center
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Auto-capture transactions via Android SMS, import bank CSV statements, audit imports, and reconcile account balances.
        </p>
      </div>

      {/* SMS Alert Banner for 1-Tap Review */}
      <SmsNotificationBanner onOpenReview={() => setActiveTab("sms-review")} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
          <TabsTrigger value="sms-review" className="flex items-center gap-1.5 text-xs py-2">
            <Smartphone className="h-3.5 w-3.5 text-primary" /> SMS Review
          </TabsTrigger>
          <TabsTrigger value="wizard" className="flex items-center gap-1.5 text-xs py-2">
            <Upload className="h-3.5 w-3.5" /> Statement Import
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs py-2">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Rollbacks
          </TabsTrigger>
          <TabsTrigger value="reconcile" className="flex items-center gap-1.5 text-xs py-2">
            <Scale className="h-3.5 w-3.5" /> Reconciliation
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-1.5 text-xs py-2">
            <Download className="h-3.5 w-3.5" /> Export Suite
          </TabsTrigger>
          <TabsTrigger value="sms-settings" className="flex items-center gap-1.5 text-xs py-2">
            <Sliders className="h-3.5 w-3.5" /> SMS Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms-review">
          <SmsReviewCenter />
        </TabsContent>

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

        <TabsContent value="sms-settings">
          <SmsSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

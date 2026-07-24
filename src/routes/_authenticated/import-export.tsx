import { createFileRoute } from "@tanstack/react-router";
import { CSVImporter } from "@/features/import-export/CSVImporter";
import { DataExporter } from "@/features/import-export/DataExporter";

export const Route = createFileRoute("/_authenticated/import-export")({
  component: ImportExportPage,
});

function ImportExportPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import & Export</h1>
        <p className="text-sm text-muted-foreground">
          Import CSV statements from your bank or export full ledger snapshots.
        </p>
      </div>

      <div className="grid gap-6">
        <CSVImporter />
        <DataExporter />
      </div>
    </div>
  );
}

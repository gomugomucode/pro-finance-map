import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { exportTransactions } from "@/lib/finance.functions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, FileSpreadsheet, Code, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DataExporter() {
  const [format, setFormat] = useState<"csv" | "json" | "pdf">("csv");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const exportFn = useServerFn(exportTransactions);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await exportFn({
        data: {
          from: fromDate ? new Date(fromDate).toISOString() : undefined,
          to: toDate ? new Date(toDate).toISOString() : undefined,
        },
      });

      if (rows.length === 0) {
        toast.error("No transactions found in selected date range.");
        setIsExporting(false);
        return;
      }

      if (format === "json") {
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ledgerly-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
      } else if (format === "csv") {
        const headers = ["ID", "Date", "Kind", "Account", "Category", "Amount", "Currency", "Description", "Merchant"];
        const csvLines = [headers.join(",")];

        for (const r of rows) {
          const rowData = [
            r.id,
            new Date(r.occurred_at).toLocaleDateString(),
            r.kind,
            `"${r.accounts?.name || r.account_id}"`,
            `"${r.categories?.name || "Uncategorized"}"`,
            (r.amount_minor / 100).toFixed(2),
            r.currency,
            `"${(r.description || "").replace(/"/g, '""')}"`,
            `"${(r.merchant || "").replace(/"/g, '""')}"`,
          ];
          csvLines.push(rowData.join(","));
        }

        const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ledgerly-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      } else if (format === "pdf") {
        // Formatted printable summary PDF/Print view
        const printWin = window.open("", "_blank");
        if (printWin) {
          printWin.document.write(`
            <html>
              <head>
                <title>Ledgerly Transaction Statement</title>
                <style>
                  body { font-family: sans-serif; padding: 20px; color: #111; }
                  h1 { margin-bottom: 4px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background: #f4f4f4; }
                </style>
              </head>
              <body>
                <h1>Ledgerly Financial Statement</h1>
                <p>Generated on ${new Date().toLocaleString()}</p>
                <table>
                  <thead>
                    <tr><th>Date</th><th>Kind</th><th>Description</th><th>Category</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    ${rows.map((r) => `
                      <tr>
                        <td>${new Date(r.occurred_at).toLocaleDateString()}</td>
                        <td style="text-transform:uppercase">${r.kind}</td>
                        <td>${r.description || "N/A"}</td>
                        <td>${r.categories?.name || "Uncategorized"}</td>
                        <td>${(r.amount_minor / 100).toFixed(2)} ${r.currency}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
                <script>window.print();</script>
              </body>
            </html>
          `);
          printWin.document.close();
        }
      }

      toast.success("Export generated successfully!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="card-elevated p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-info/10 text-info">
          <Download className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base">Export Financial Data</h3>
          <p className="text-xs text-muted-foreground">
            Download your full ledger in CSV, JSON backup, or printable PDF summary.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Export Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV Spreadsheet</SelectItem>
              <SelectItem value="json">JSON Backup</SelectItem>
              <SelectItem value="pdf">Printable PDF Statement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="exp-from">From Date</Label>
          <Input
            id="exp-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="exp-to">To Date</Label>
          <Input
            id="exp-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={handleExport} disabled={isExporting} className="w-full">
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Download {format.toUpperCase()} Export
      </Button>
    </div>
  );
}

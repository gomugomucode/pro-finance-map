import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { createTransaction, listAccounts, listCategories } from "@/lib/finance.functions";
import { toMinor } from "@/lib/money";
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
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CSVRow {
  date: string;
  description: string;
  amount: string;
  kind?: string;
  category?: string;
  merchant?: string;
}

export function CSVImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CSVRow[]>([]);
  const [targetAccountId, setTargetAccountId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => listAccounts() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const queryClient = useQueryClient();
  const router = useRouter();
  const createTxFn = useServerFn(createTransaction);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        toast.error("CSV file is empty or missing headers");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      const dateIdx = headers.findIndex((h) => h.includes("date") || h.includes("time"));
      const descIdx = headers.findIndex((h) => h.includes("desc") || h.includes("payee") || h.includes("title") || h.includes("name"));
      const amountIdx = headers.findIndex((h) => h.includes("amount") || h.includes("value") || h.includes("sum"));

      if (dateIdx === -1 || amountIdx === -1) {
        toast.error("CSV must contain 'Date' and 'Amount' headers.");
        return;
      }

      const rows: CSVRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
        if (cols.length <= dateIdx || cols.length <= amountIdx) continue;

        const rawAmount = parseFloat(cols[amountIdx]);
        if (isNaN(rawAmount)) continue;

        rows.push({
          date: cols[dateIdx] || new Date().toISOString().slice(0, 10),
          description: descIdx !== -1 ? cols[descIdx] : "Imported Transaction",
          amount: Math.abs(rawAmount).toFixed(2),
          kind: rawAmount < 0 ? "expense" : "income",
        });
      }

      setParsedRows(rows);
      toast.success(`Parsed ${rows.length} transactions from CSV.`);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!targetAccountId) {
      toast.error("Select a target account for import.");
      return;
    }
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    let successCount = 0;

    const acc = accounts.find((a) => a.id === targetAccountId);
    const defaultCcy = acc?.currency ?? "USD";

    for (let i = 0; i < parsedRows.length; i++) {
      const r = parsedRows[i];
      try {
        await createTxFn({
          data: {
            kind: (r.kind as "income" | "expense") || "expense",
            account_id: targetAccountId,
            amount_minor: toMinor(parseFloat(r.amount)),
            currency: defaultCcy,
            occurred_at: new Date(r.date).toISOString(),
            description: r.description,
          },
        });
        successCount++;
      } catch (err) {
        console.error(err);
      }
      setProgress(Math.round(((i + 1) / parsedRows.length) * 100));
    }

    setIsImporting(false);
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    router.invalidate();

    toast.success(`Import complete! ${successCount} transactions created.`);
    setParsedRows([]);
    setFile(null);
  };

  return (
    <div className="card-elevated p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base">Import Bank Statement / CSV</h3>
          <p className="text-xs text-muted-foreground">
            Upload CSV statements from your bank, PayPal, or budgeting app with column preview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="csv-file">Upload CSV File</Label>
          <Input id="csv-file" type="file" accept=".csv" onChange={handleFileUpload} />
        </div>

        <div className="space-y-2">
          <Label>Target Account</Label>
          <Select value={targetAccountId} onValueChange={setTargetAccountId}>
            <SelectTrigger><SelectValue placeholder="Select destination account" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {parsedRows.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase">
            <span>Preview Parsed Rows ({parsedRows.length})</span>
            <span>Target: {accounts.find((a) => a.id === targetAccountId)?.name ?? "Unselected"}</span>
          </div>

          <div className="max-h-60 overflow-y-auto border border-border rounded-lg divide-y divide-border text-xs">
            {parsedRows.slice(0, 10).map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2.5">
                <div>
                  <div className="font-semibold">{r.description}</div>
                  <div className="text-[10px] text-muted-foreground">{r.date}</div>
                </div>
                <div className={`font-semibold tabular ${r.kind === "income" ? "text-success" : "text-destructive"}`}>
                  {r.kind === "income" ? "+" : "-"} ${r.amount}
                </div>
              </div>
            ))}
            {parsedRows.length > 10 && (
              <div className="p-2 text-center text-muted-foreground text-[11px]">
                ...and {parsedRows.length - 10} more rows
              </div>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={isImporting || !targetAccountId}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing ({progress}%)
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Import {parsedRows.length} Transactions
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import {
  createTransaction,
  listAccounts,
  listCategories,
  listMerchants,
  createImportBatchRecord,
  listImportProfiles,
} from "@/lib/finance.functions";
import { toMinor, formatMoney } from "@/lib/money";
import { parseQuickInput } from "@/lib/smart-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, CheckCircle2, AlertCircle, ArrowRight, Loader2, FileSpreadsheet, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ParsedRowItem {
  id: string;
  date: string;
  description: string;
  amount: string;
  kind: "expense" | "income";
  category_id?: string;
  merchant?: string;
  status: "valid" | "duplicate" | "error";
  errorMsg?: string;
}

const PRESET_PROFILES = [
  { name: "NIC Asia CSV", dateCol: "date", descCol: "narration", amountCol: "amount" },
  { name: "Nabil Bank CSV", dateCol: "txndate", descCol: "particulars", amountCol: "txn_amount" },
  { name: "Global IME CSV", dateCol: "date", descCol: "description", amountCol: "amount" },
  { name: "eSewa Export", dateCol: "created_at", descCol: "details", amountCol: "amount" },
  { name: "Khalti Export", dateCol: "datetime", descCol: "remarks", amountCol: "amount" },
  { name: "Money Manager CSV", dateCol: "Date", descCol: "Note", amountCol: "Amount" },
  { name: "Bluecoins CSV", dateCol: "date", descCol: "notes", amountCol: "amount" },
  { name: "Custom CSV", dateCol: "date", descCol: "description", amountCol: "amount" },
];

export function ImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("Custom CSV");
  const [targetAccountId, setTargetAccountId] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<ParsedRowItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => listAccounts() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const { data: merchants = [] } = useQuery({ queryKey: ["merchants"], queryFn: () => listMerchants() });

  const queryClient = useQueryClient();
  const router = useRouter();
  const createTxFn = useServerFn(createTransaction);
  const createBatchFn = useServerFn(createImportBatchRecord);

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
        toast.error("File is empty or missing header rows.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      const dateIdx = headers.findIndex((h) => h.includes("date") || h.includes("time"));
      const descIdx = headers.findIndex((h) => h.includes("desc") || h.includes("narration") || h.includes("particular") || h.includes("detail") || h.includes("remark") || h.includes("title") || h.includes("note"));
      const amountIdx = headers.findIndex((h) => h.includes("amount") || h.includes("value") || h.includes("sum"));

      if (dateIdx === -1 || amountIdx === -1) {
        toast.error("File must contain Date and Amount columns.");
        return;
      }

      const rows: ParsedRowItem[] = [];
      const seenKeys = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
        if (cols.length <= dateIdx || cols.length <= amountIdx) continue;

        const rawAmount = parseFloat(cols[amountIdx]);
        if (isNaN(rawAmount)) continue;

        const dateStr = cols[dateIdx] || new Date().toISOString().slice(0, 10);
        const descStr = descIdx !== -1 ? cols[descIdx] : "Imported Entry";
        const kind: "expense" | "income" = rawAmount < 0 ? "expense" : "income";
        const absAmount = Math.abs(rawAmount).toFixed(2);

        // Smart Category & Merchant Auto-Detection using Merchant Intelligence
        const parsed = parseQuickInput(`${absAmount} ${descStr}`, categories, accounts);

        // Duplicate Check Key
        const dupKey = `${dateStr}_${absAmount}_${descStr.toLowerCase()}`;
        const isDup = seenKeys.has(dupKey);
        seenKeys.add(dupKey);

        rows.push({
          id: crypto.randomUUID(),
          date: dateStr,
          description: descStr,
          amount: absAmount,
          kind,
          category_id: parsed.matchedCategoryId,
          merchant: parsed.merchant || undefined,
          status: isDup ? "duplicate" : "valid",
        });
      }

      setParsedRows(rows);
      setStep(2);
      toast.success(`Parsed ${rows.length} rows successfully.`);
    };
    reader.readAsText(f);
  };

  const handleExecuteImport = async () => {
    if (!targetAccountId) {
      toast.error("Select a destination account.");
      return;
    }
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    const startTime = Date.now();
    let importedCount = 0;
    let duplicateCount = 0;

    const acc = accounts.find((a) => a.id === targetAccountId);
    const defaultCcy = acc?.currency ?? "USD";

    // 1. Create Batch Record Audit
    const batch = await createBatchFn({
      data: {
        filename: file?.name || "import_file.csv",
        source_format: file?.name.endsWith(".xlsx") ? "xlsx" : "csv",
        total_rows: parsedRows.length,
        imported_count: 0,
      },
    });

    for (let i = 0; i < parsedRows.length; i++) {
      const r = parsedRows[i];
      if (r.status === "duplicate") {
        duplicateCount++;
      }

      try {
        await createTxFn({
          data: {
            kind: r.kind,
            account_id: targetAccountId,
            category_id: r.category_id || null,
            amount_minor: toMinor(parseFloat(r.amount)),
            currency: defaultCcy,
            occurred_at: new Date(r.date).toISOString(),
            description: r.description,
            merchant: r.merchant || null,
            import_batch_id: batch.id,
          },
        });
        importedCount++;
      } catch (err) {
        console.error(err);
      }
      setProgress(Math.round(((i + 1) / parsedRows.length) * 100));
    }

    setIsImporting(false);
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["import_batches"] });
    router.invalidate();

    toast.success(`Import complete! Created ${importedCount} transactions under batch audit.`);
    setStep(1);
    setParsedRows([]);
    setFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Wizard Steps Navigation */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Badge variant={step === 1 ? "default" : "outline"}>1. Upload & Preset</Badge>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <Badge variant={step === 2 ? "default" : "outline"}>2. Interactive Preview</Badge>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <Badge variant={step === 3 ? "default" : "outline"}>3. Complete Batch</Badge>
        </div>
      </div>

      {step === 1 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Select File & Bank Format Preset</h3>
              <p className="text-xs text-muted-foreground">
                Import CSV, Excel, or JSON exports from any bank, mobile wallet, or finance app.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Bank / Wallet Preset Profile</Label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRESET_PROFILES.map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destination Account</Label>
              <Select value={targetAccountId} onValueChange={setTargetAccountId}>
                <SelectTrigger><SelectValue placeholder="Select destination..." /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-file">Choose File</Label>
              <Input id="csv-file" type="file" accept=".csv,.xlsx,.json" onChange={handleFileUpload} />
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Live Preview & Smart Detection ({parsedRows.length} rows)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Categories and merchants have been auto-inferred using Merchant Intelligence.
              </p>
            </div>

            <Button onClick={() => setStep(1)} variant="outline" size="sm">
              Change File
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto border border-border rounded-xl divide-y divide-border text-xs">
            {parsedRows.map((r, idx) => (
              <div key={r.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground text-[10px] w-6">{idx + 1}</span>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {r.description}
                      {r.status === "duplicate" && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-400">
                          <AlertTriangle className="mr-1 h-3 w-3" /> Duplicate Risk
                        </Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {r.date} • Category: {categories.find((c) => c.id === r.category_id)?.name ?? "Uncategorized"}
                    </div>
                  </div>
                </div>

                <div className={`font-bold tabular text-sm ${r.kind === "income" ? "text-success" : "text-foreground"}`}>
                  {r.kind === "income" ? "+" : "-"} ${r.amount}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleExecuteImport}
            disabled={isImporting || !targetAccountId}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing Transactions ({progress}%)
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Execute Batch Import ({parsedRows.length} rows)
              </>
            )}
          </Button>
        </Card>
      )}
    </div>
  );
}

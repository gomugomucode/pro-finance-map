import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listImportBatches, rollbackImportBatch } from "@/lib/finance.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, RotateCcw, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ImportHistoryList() {
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["import_batches"],
    queryFn: () => listImportBatches(),
  });

  const queryClient = useQueryClient();
  const rollbackFn = useServerFn(rollbackImportBatch);

  const rollbackMutation = useMutation({
    mutationFn: (batchId: string) => rollbackFn({ data: { batchId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import_batches"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Import batch successfully rolled back. Transactions removed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" /> Import Audit Trail & Rollbacks
        </h3>
        <span className="text-xs text-muted-foreground">{batches.length} total batches</span>
      </div>

      {batches.length === 0 ? (
        <Card className="p-8 text-center">
          <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No historical imports</p>
          <p className="text-xs text-muted-foreground mt-1">
            When you import statements or backups, full batch details and rollback controls will appear here.
          </p>
        </Card>
      ) : (
        <div className="divide-y rounded-xl border border-border bg-card">
          {batches.map((b: any) => (
            <div key={b.id} className="flex items-center justify-between p-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">{b.filename}</span>
                  <Badge variant={b.status === "completed" ? "default" : "secondary"} className="text-[10px] capitalize">
                    {b.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  Imported {b.imported_count} rows on {new Date(b.created_at).toLocaleString()} • Format: {b.source_format.toUpperCase()}
                </div>
              </div>

              <div>
                {b.status === "completed" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={rollbackMutation.isPending}
                    onClick={() => {
                      if (confirm(`Roll back import batch "${b.filename}"? All ${b.imported_count} transactions created by this import will be permanently deleted.`)) {
                        rollbackMutation.mutate(b.id);
                      }
                    }}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Rollback Import
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-xs italic">Rolled Back</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

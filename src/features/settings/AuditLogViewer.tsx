import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, History, User } from "lucide-react";

interface AuditLog {
  id: string;
  entity: string;
  entity_id: string | null;
  action: string;
  diff: any;
  at: string;
}

export function AuditLogViewer() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return (data as AuditLog[]) ?? [];
    },
  });

  return (
    <div className="card-elevated p-6 space-y-4">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base">Security Audit Log</h3>
          <p className="text-xs text-muted-foreground">
            Immutable log of database mutations (inserts, updates, deletes) recorded under RLS.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-muted-foreground">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">No audit logs recorded yet.</div>
      ) : (
        <div className="max-h-80 overflow-y-auto divide-y divide-border text-xs">
          {logs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-foreground flex items-center gap-2">
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted">
                    {log.action}
                  </span>
                  <span className="capitalize">{log.entity}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  ID: {log.entity_id ? log.entity_id.slice(0, 8) : "N/A"}
                </div>
              </div>
              <div className="text-right text-[10px] text-muted-foreground tabular">
                {new Date(log.at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

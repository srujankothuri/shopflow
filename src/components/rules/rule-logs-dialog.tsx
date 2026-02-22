"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface LogEntry {
  id: string;
  status: string;
  triggerData: Record<string, unknown>;
  actionsRun: string[];
  error: string | null;
  executedAt: string;
  executedBy: { name: string } | null;
}

interface RuleLogsDialogProps {
  open: boolean;
  onClose: () => void;
  ruleId: string | null;
  ruleName: string;
}

const statusStyles: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  FAILURE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  SKIPPED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function RuleLogsDialog({ open, onClose, ruleId, ruleName }: RuleLogsDialogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && ruleId) {
      setLoading(true);
      fetch(`/api/rules/${ruleId}/logs`)
        .then((r) => r.json())
        .then(setLogs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, ruleId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execution Log</DialogTitle>
          <DialogDescription>Audit trail for: {ruleName}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No execution logs yet. Rules will log here when triggered.
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={statusStyles[log.status] || ""}>
                      {log.status}
                    </Badge>
                    {log.executedBy && (
                      <span className="text-xs text-muted-foreground">
                        by {log.executedBy.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.executedAt).toLocaleString()}
                  </span>
                </div>

                {/* Actions that ran */}
                {Array.isArray(log.actionsRun) && log.actionsRun.length > 0 && (
                  <div className="rounded bg-muted/50 p-2">
                    <p className="text-xs font-medium mb-1">Actions executed:</p>
                    {log.actionsRun.map((action, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        ✓ {action}
                      </p>
                    ))}
                  </div>
                )}

                {/* Error */}
                {log.error && (
                  <div className="rounded bg-destructive/10 p-2">
                    <p className="text-xs text-destructive">Error: {log.error}</p>
                  </div>
                )}

                {/* Trigger data summary */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View trigger data
                  </summary>
                  <pre className="mt-1 rounded bg-muted p-2 overflow-x-auto text-xs">
                    {JSON.stringify(log.triggerData, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
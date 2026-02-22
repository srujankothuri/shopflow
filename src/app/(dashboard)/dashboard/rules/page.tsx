"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Zap, ZapOff, Activity, Play, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RuleDialog } from "@/components/rules/rule-dialog";
import { RuleLogsDialog } from "@/components/rules/rule-logs-dialog";
import { RuleTemplates } from "@/components/rules/rule-templates";

interface Rule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  trigger: string;
  conditions: unknown;
  actions: unknown;
  priority: number;
  triggerCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  createdBy: { name: string; email: string };
  _count: { logs: number };
}

const triggerLabels: Record<string, string> = {
  ORDER_PLACED: "Order Placed",
  ORDER_STATUS_CHANGED: "Status Changed",
  LOW_STOCK: "Low Stock",
  HIGH_VALUE_ORDER: "High Value Order",
  REPEAT_CUSTOMER: "Repeat Customer",
};

const triggerColors: Record<string, string> = {
  ORDER_PLACED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ORDER_STATUS_CHANGED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  LOW_STOCK: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  HIGH_VALUE_ORDER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REPEAT_CUSTOMER: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
};

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsRuleId, setLogsRuleId] = useState<string | null>(null);
  const [logsRuleName, setLogsRuleName] = useState("");
  const [testing, setTesting] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/rules");
      const data = await res.json();
      setRules(data);
    } catch (err) {
      console.error("Failed to fetch rules:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchRules();
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this automation rule?")) return;
    try {
      await fetch(`/api/rules/${id}`, { method: "DELETE" });
      fetchRules();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const testRule = async (id: string) => {
    setTesting(id);
    try {
      const res = await fetch(`/api/rules/${id}/execute`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Test failed");
      } else {
        alert(`Rule tested! Results:\n${data.results.map((r: { ruleName: string; status: string }) => `${r.ruleName}: ${r.status}`).join("\n")}`);
        fetchRules();
      }
    } catch {
      alert("Failed to test rule");
    } finally {
      setTesting(null);
    }
  };

  const openLogs = (rule: Rule) => {
    setLogsRuleId(rule.id);
    setLogsRuleName(rule.name);
    setLogsOpen(true);
  };

  const activeCount = rules.filter((r) => r.isActive).length;
  const totalTriggers = rules.reduce((sum, r) => sum + r.triggerCount, 0);

  const formatActions = (actions: unknown): string => {
    if (!Array.isArray(actions)) return "—";
    return actions.map((a: { type: string }) => {
      switch (a.type) {
        case "SEND_EMAIL": return "Send Email";
        case "TAG_CUSTOMER": return "Tag Customer";
        case "FLAG_ORDER": return "Flag Order";
        case "UPDATE_ORDER_STATUS": return "Update Status";
        case "APPLY_DISCOUNT": return "Apply Discount";
        default: return a.type;
      }
    }).join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Rules</h1>
          <p className="text-muted-foreground">
            Create smart rules to automate your store operations.
          </p>
        </div>
        <Button onClick={() => { setEditRule(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rules</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Rules</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTriggers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates section */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Quick Templates</h2>
        <p className="text-sm text-muted-foreground">One-click activate pre-built automation rules.</p>
        <RuleTemplates
          onActivate={fetchRules}
          existingRuleNames={rules.map((r) => r.name)}
        />
      </div>

      {/* Rules list */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading rules...</p>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No automation rules yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first rule to automate store operations.
            </p>
            <Button onClick={() => { setEditRule(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Create Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className={`transition-opacity ${!rule.isActive ? "opacity-60" : ""}`}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleRule(rule.id, rule.isActive)}
                    className={`shrink-0 rounded-full p-2 transition-colors ${
                      rule.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                    title={rule.isActive ? "Active — click to disable" : "Inactive — click to enable"}
                  >
                    {rule.isActive ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
                  </button>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{rule.name}</p>
                      <Badge variant="secondary" className={triggerColors[rule.trigger] || ""}>
                        {triggerLabels[rule.trigger] || rule.trigger}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Actions: {formatActions(rule.actions)}
                      {rule.description ? ` · ${rule.description}` : ""}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 shrink-0 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{rule.triggerCount}</p>
                      <p className="text-xs">Runs</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{rule._count.logs}</p>
                      <p className="text-xs">Logs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs">
                        {rule.lastTriggeredAt
                          ? new Date(rule.lastTriggeredAt).toLocaleDateString()
                          : "Never"}
                      </p>
                      <p className="text-xs">Last Run</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => testRule(rule.id)}
                    disabled={testing === rule.id}
                    title="Test rule against latest order"
                  >
                    <Play className={`h-4 w-4 ${testing === rule.id ? "animate-spin" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openLogs(rule)}
                    title="View execution logs"
                  >
                    <ScrollText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setEditRule(rule); setDialogOpen(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRule(rule.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RuleDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRule(null); }}
        onSave={fetchRules}
        rule={editRule}
      />

      <RuleLogsDialog
        open={logsOpen}
        onClose={() => setLogsOpen(false)}
        ruleId={logsRuleId}
        ruleName={logsRuleName}
      />
    </div>
  );
}
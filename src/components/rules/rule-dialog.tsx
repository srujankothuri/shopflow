"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Types ---
interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ConditionGroup {
  id: string;
  logic: "all" | "any";
  conditions: Condition[];
}

interface Action {
  id: string;
  type: string;
  params: Record<string, string>;
}

interface RuleData {
  id?: string;
  name: string;
  description: string | null;
  trigger: string;
  conditions: unknown;
  actions: unknown;
  priority: number;
  isActive: boolean;
}

interface RuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  rule?: RuleData | null;
}

// --- Constants ---
const TRIGGERS = [
  { value: "ORDER_PLACED", label: "When an order is placed" },
  { value: "ORDER_STATUS_CHANGED", label: "When order status changes" },
  { value: "LOW_STOCK", label: "When product stock is low" },
  { value: "HIGH_VALUE_ORDER", label: "When a high-value order is placed" },
  { value: "REPEAT_CUSTOMER", label: "When a repeat customer orders" },
];

const CONDITION_FIELDS = [
  { value: "order.totalPrice", label: "Order Total" },
  { value: "order.itemCount", label: "Order Item Count" },
  { value: "customer.orderCount", label: "Customer Order Count" },
  { value: "customer.totalSpend", label: "Customer Total Spend" },
  { value: "customer.tag", label: "Customer Tag" },
  { value: "product.stock", label: "Product Stock" },
  { value: "product.price", label: "Product Price" },
];

const OPERATORS = [
  { value: "greaterThan", label: ">" },
  { value: "greaterThanOrEqual", label: ">=" },
  { value: "lessThan", label: "<" },
  { value: "lessThanOrEqual", label: "<=" },
  { value: "equal", label: "=" },
  { value: "notEqual", label: "!=" },
];

const ACTION_TYPES = [
  { value: "SEND_EMAIL", label: "Send Email Notification" },
  { value: "TAG_CUSTOMER", label: "Tag Customer" },
  { value: "FLAG_ORDER", label: "Flag Order for Review" },
  { value: "UPDATE_ORDER_STATUS", label: "Update Order Status" },
  { value: "APPLY_DISCOUNT", label: "Apply Discount" },
];

const TAG_OPTIONS = ["REGULAR", "VIP", "WHOLESALE", "FLAGGED"];
const STATUS_OPTIONS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

// --- Helpers ---
const uid = () => Math.random().toString(36).slice(2, 9);

function newCondition(): Condition {
  return { id: uid(), field: "order.totalPrice", operator: "greaterThan", value: "" };
}

function newGroup(): ConditionGroup {
  return { id: uid(), logic: "all", conditions: [newCondition()] };
}

function newAction(): Action {
  return { id: uid(), type: "SEND_EMAIL", params: { to: "", subject: "", body: "" } };
}

function getDefaultParams(type: string): Record<string, string> {
  switch (type) {
    case "SEND_EMAIL": return { to: "", subject: "", body: "" };
    case "TAG_CUSTOMER": return { tag: "VIP" };
    case "FLAG_ORDER": return { reason: "" };
    case "UPDATE_ORDER_STATUS": return { status: "PROCESSING" };
    case "APPLY_DISCOUNT": return { percentage: "10" };
    default: return {};
  }
}

// --- Component ---
export function RuleDialog({ open, onClose, onSave, rule }: RuleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("ORDER_PLACED");
  const [groups, setGroups] = useState<ConditionGroup[]>([newGroup()]);
  const [actions, setActions] = useState<Action[]>([newAction()]);
  const [priority, setPriority] = useState("0");

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description || "");
      setTrigger(rule.trigger);
      setPriority(String(rule.priority));
      // Parse saved conditions
      const saved = rule.conditions as { groups?: ConditionGroup[] };
      if (saved?.groups) setGroups(saved.groups);
      else setGroups([newGroup()]);
      // Parse saved actions
      const savedActions = rule.actions as Action[];
      if (Array.isArray(savedActions) && savedActions.length > 0) setActions(savedActions);
      else setActions([newAction()]);
    } else {
      setName("");
      setDescription("");
      setTrigger("ORDER_PLACED");
      setGroups([newGroup()]);
      setActions([newAction()]);
      setPriority("0");
    }
    setStep(0);
    setError("");
  }, [rule, open]);

  // --- Condition Handlers ---
  const updateGroup = (gid: string, updates: Partial<ConditionGroup>) => {
    setGroups(groups.map((g) => (g.id === gid ? { ...g, ...updates } : g)));
  };

  const addConditionToGroup = (gid: string) => {
    setGroups(
      groups.map((g) =>
        g.id === gid ? { ...g, conditions: [...g.conditions, newCondition()] } : g
      )
    );
  };

  const updateCondition = (gid: string, cid: string, updates: Partial<Condition>) => {
    setGroups(
      groups.map((g) =>
        g.id === gid
          ? { ...g, conditions: g.conditions.map((c) => (c.id === cid ? { ...c, ...updates } : c)) }
          : g
      )
    );
  };

  const removeCondition = (gid: string, cid: string) => {
    setGroups(
      groups.map((g) =>
        g.id === gid ? { ...g, conditions: g.conditions.filter((c) => c.id !== cid) } : g
      )
    );
  };

  // --- Action Handlers ---
  const updateAction = (aid: string, updates: Partial<Action>) => {
    setActions(actions.map((a) => (a.id === aid ? { ...a, ...updates } : a)));
  };

  const updateActionType = (aid: string, type: string) => {
    setActions(
      actions.map((a) =>
        a.id === aid ? { ...a, type, params: getDefaultParams(type) } : a
      )
    );
  };

  const updateActionParam = (aid: string, key: string, value: string) => {
    setActions(
      actions.map((a) =>
        a.id === aid ? { ...a, params: { ...a.params, [key]: value } } : a
      )
    );
  };

  // --- Submit ---
  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Rule name is required"); return; }
    if (groups.some((g) => g.conditions.some((c) => !c.value))) {
      setError("All condition values must be filled");
      return;
    }

    setLoading(true);
    try {
      const url = rule?.id ? `/api/rules/${rule.id}` : "/api/rules";
      const method = rule?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          trigger,
          conditions: { groups },
          actions,
          priority: parseInt(priority) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }

      onSave();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Basics", "Conditions", "Actions"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule?.id ? "Edit Rule" : "Create Automation Rule"}</DialogTitle>
          <DialogDescription>
            Define when this rule triggers and what actions it performs.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex gap-1 mb-2">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                step === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {/* STEP 0: Basics */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rule Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Flag high-value orders" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this rule do?" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Trigger *</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This determines when the rule is evaluated.</p>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="0" />
              <p className="text-xs text-muted-foreground">Higher priority rules run first (0 = default).</p>
            </div>
          </div>
        )}

        {/* STEP 1: Conditions */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define conditions that must be met for this rule to fire.
            </p>

            {groups.map((group, gi) => (
              <div key={group.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Match</span>
                    <Select
                      value={group.logic}
                      onValueChange={(v) => updateGroup(group.id, { logic: v as "all" | "any" })}
                    >
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ALL of</SelectItem>
                        <SelectItem value="any">ANY of</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">these conditions</span>
                  </div>
                  {groups.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setGroups(groups.filter((g) => g.id !== group.id))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {group.conditions.map((cond) => (
                  <div key={cond.id} className="flex items-center gap-2">
                    <Select value={cond.field} onValueChange={(v) => updateCondition(group.id, cond.id, { field: v })}>
                      <SelectTrigger className="flex-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={cond.operator} onValueChange={(v) => updateCondition(group.id, cond.id, { operator: v })}>
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      className="w-28 h-8 text-xs"
                      value={cond.value}
                      onChange={(e) => updateCondition(group.id, cond.id, { value: e.target.value })}
                      placeholder="Value"
                    />

                    {group.conditions.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeCondition(group.id, cond.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button variant="ghost" size="sm" className="text-xs" onClick={() => addConditionToGroup(group.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Condition
                </Button>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={() => setGroups([...groups, newGroup()])}>
              <Plus className="h-3 w-3 mr-1" /> Add Condition Group (OR)
            </Button>
            <p className="text-xs text-muted-foreground">
              Multiple groups are joined with OR logic. Conditions within a group use the selected logic (ALL/ANY).
            </p>
          </div>
        )}

        {/* STEP 2: Actions */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define what happens when conditions are met.
            </p>

            {actions.map((action) => (
              <div key={action.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Select value={action.type} onValueChange={(v) => updateActionType(action.id, v)}>
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {actions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => setActions(actions.filter((a) => a.id !== action.id))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Dynamic params based on action type */}
                {action.type === "SEND_EMAIL" && (
                  <div className="space-y-2">
                    <Input className="h-8 text-xs" placeholder="Recipient email" value={action.params.to || ""} onChange={(e) => updateActionParam(action.id, "to", e.target.value)} />
                    <Input className="h-8 text-xs" placeholder="Subject" value={action.params.subject || ""} onChange={(e) => updateActionParam(action.id, "subject", e.target.value)} />
                    <Textarea className="text-xs" rows={2} placeholder="Email body..." value={action.params.body || ""} onChange={(e) => updateActionParam(action.id, "body", e.target.value)} />
                  </div>
                )}

                {action.type === "TAG_CUSTOMER" && (
                  <Select value={action.params.tag || "VIP"} onValueChange={(v) => updateActionParam(action.id, "tag", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TAG_OPTIONS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )}

                {action.type === "FLAG_ORDER" && (
                  <Input className="h-8 text-xs" placeholder="Reason for flagging" value={action.params.reason || ""} onChange={(e) => updateActionParam(action.id, "reason", e.target.value)} />
                )}

                {action.type === "UPDATE_ORDER_STATUS" && (
                  <Select value={action.params.status || "PROCESSING"} onValueChange={(v) => updateActionParam(action.id, "status", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )}

                {action.type === "APPLY_DISCOUNT" && (
                  <div className="flex items-center gap-2">
                    <Input className="h-8 text-xs w-24" type="number" placeholder="10" value={action.params.percentage || ""} onChange={(e) => updateActionParam(action.id, "percentage", e.target.value)} />
                    <span className="text-xs text-muted-foreground">% discount</span>
                  </div>
                )}
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={() => setActions([...actions, newAction()])}>
              <Plus className="h-3 w-3 mr-1" /> Add Action
            </Button>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : rule?.id ? "Update Rule" : "Create Rule"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
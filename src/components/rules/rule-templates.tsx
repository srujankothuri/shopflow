"use client";

import { useState } from "react";
import { Zap, Shield, Star, AlertTriangle, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RuleTemplatesProps {
  onActivate: () => void;
  existingRuleNames: string[];
}

const templates = [
  {
    name: "Flag High-Value Orders",
    description: "Auto-flag orders over $500 for manual review",
    icon: Shield,
    color: "text-red-500",
    data: {
      trigger: "HIGH_VALUE_ORDER",
      conditions: { groups: [{ id: "g1", logic: "all", conditions: [{ id: "c1", field: "order.totalPrice", operator: "greaterThan", value: "500" }] }] },
      actions: [{ id: "a1", type: "FLAG_ORDER", params: { reason: "Order exceeds $500 threshold" } }],
      priority: 10,
    },
  },
  {
    name: "VIP Customer Auto-Tag",
    description: "Tag customers as VIP when spend exceeds $1000",
    icon: Star,
    color: "text-amber-500",
    data: {
      trigger: "ORDER_PLACED",
      conditions: { groups: [{ id: "g1", logic: "all", conditions: [{ id: "c1", field: "customer.totalSpend", operator: "greaterThan", value: "1000" }] }] },
      actions: [{ id: "a1", type: "TAG_CUSTOMER", params: { tag: "VIP" } }],
      priority: 5,
    },
  },
  {
    name: "Low Stock Alert",
    description: "Send notification when stock falls below 5 units",
    icon: AlertTriangle,
    color: "text-orange-500",
    data: {
      trigger: "LOW_STOCK",
      conditions: { groups: [{ id: "g1", logic: "all", conditions: [{ id: "c1", field: "product.stock", operator: "lessThan", value: "5" }] }] },
      actions: [{ id: "a1", type: "SEND_EMAIL", params: { to: "inventory@shopflow.com", subject: "Low Stock Alert", body: "A product has fallen below 5 units." } }],
      priority: 8,
    },
  },
  {
    name: "Repeat Customer Discount",
    description: "Apply 10% discount for customers with 5+ orders",
    icon: Percent,
    color: "text-green-500",
    data: {
      trigger: "REPEAT_CUSTOMER",
      conditions: { groups: [{ id: "g1", logic: "all", conditions: [{ id: "c1", field: "customer.orderCount", operator: "greaterThanOrEqual", value: "5" }] }] },
      actions: [{ id: "a1", type: "APPLY_DISCOUNT", params: { percentage: "10" } }],
      priority: 3,
    },
  },
];

export function RuleTemplates({ onActivate, existingRuleNames }: RuleTemplatesProps) {
  const [activating, setActivating] = useState<string | null>(null);

  const activate = async (template: (typeof templates)[0]) => {
    setActivating(template.name);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          ...template.data,
        }),
      });

      if (res.ok) onActivate();
      else alert("Failed to create rule");
    } catch {
      alert("Something went wrong");
    } finally {
      setActivating(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {templates.map((t) => {
        const exists = existingRuleNames.includes(t.name);
        return (
          <Card key={t.name} className={exists ? "opacity-50" : ""}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className={`shrink-0 rounded-lg bg-muted p-2.5 ${t.color}`}>
                <t.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <Button
                size="sm"
                variant={exists ? "ghost" : "default"}
                disabled={exists || activating === t.name}
                onClick={() => activate(t)}
              >
                {exists ? "Active" : activating === t.name ? "..." : "Activate"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
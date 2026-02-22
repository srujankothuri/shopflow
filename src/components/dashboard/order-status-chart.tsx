"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface OrderStatusChartProps {
  data: { status: string; count: number }[];
}

const COLORS: Record<string, string> = {
  PENDING: "#eab308",
  PROCESSING: "#3b82f6",
  SHIPPED: "#a855f7",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
};

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  const filtered = data.filter((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status</CardTitle>
        <CardDescription>Distribution of order statuses</CardDescription>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No orders yet.
          </p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filtered}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={2}
                >
                  {filtered.map((entry) => (
                    <Cell key={entry.status} fill={COLORS[entry.status] || "#888"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--card-foreground)",
                  }}
                />
                <Legend
                  formatter={(value: string) =>
                    value.charAt(0) + value.slice(1).toLowerCase()
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
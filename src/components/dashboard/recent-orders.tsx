import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  orderNum: string;
  status: string;
  totalPrice: number;
  createdAt: Date;
  customer: { name: string; email: string };
}

interface RecentOrdersProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Latest orders from your store</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No orders yet. Seed data will populate this.
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{order.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.orderNum} · {order.customer.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={statusColors[order.status] || ""}>
                    {order.status}
                  </Badge>
                  <span className="text-sm font-semibold w-20 text-right">
                    ${order.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
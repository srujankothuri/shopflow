import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  totalRevenue: number;
  orderCount: number;
  productCount: number;
  customerCount: number;
}

export function StatsCards({ totalRevenue, orderCount, productCount, customerCount }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "From processed orders",
    },
    {
      title: "Orders",
      value: orderCount.toLocaleString(),
      icon: ShoppingCart,
      description: "Total orders placed",
    },
    {
      title: "Products",
      value: productCount.toLocaleString(),
      icon: Package,
      description: "Active products",
    },
    {
      title: "Customers",
      value: customerCount.toLocaleString(),
      icon: Users,
      description: "Registered customers",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
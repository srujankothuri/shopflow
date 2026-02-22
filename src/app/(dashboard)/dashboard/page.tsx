import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, getOrderStatusCounts } from "@/lib/dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { OrderStatusChart } from "@/components/dashboard/order-status-chart";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [stats, statusCounts] = await Promise.all([
    getDashboardStats(),
    getOrderStatusCounts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your store overview and key metrics.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalRevenue={stats.totalRevenue}
        orderCount={stats.orderCount}
        productCount={stats.productCount}
        customerCount={stats.customerCount}
      />

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueChart data={stats.monthlyRevenue} />
        </div>
        <div className="lg:col-span-3">
          <OrderStatusChart data={statusCounts} />
        </div>
      </div>

      {/* Recent Orders */}
      <RecentOrders orders={stats.recentOrders} />
    </div>
  );
}
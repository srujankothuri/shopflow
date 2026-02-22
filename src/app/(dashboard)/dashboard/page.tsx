import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, getOrderStatusCounts, getRecentActivity } from "@/lib/dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { OrderStatusChart } from "@/components/dashboard/order-status-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [stats, statusCounts, activities] = await Promise.all([
    getDashboardStats(),
    getOrderStatusCounts(),
    getRecentActivity(),
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

      {/* Recent Orders + Activity */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RecentOrders orders={stats.recentOrders} />
        </div>
        <div className="lg:col-span-3">
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
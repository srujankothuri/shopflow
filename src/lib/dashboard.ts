import { db } from "@/lib/db";

export async function getDashboardStats() {
  const [totalRevenue, orderCount, productCount, customerCount, recentOrders, monthlyRevenue] =
    await Promise.all([
      // Total revenue from all delivered/shipped/processing orders
      db.order.aggregate({
        _sum: { totalPrice: true },
        where: { status: { in: ["DELIVERED", "SHIPPED", "PROCESSING"] } },
      }),

      // Total orders
      db.order.count(),

      // Active products
      db.product.count({ where: { status: "ACTIVE" } }),

      // Total customers
      db.customer.count(),

      // Recent 5 orders
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true, email: true } },
        },
      }),

      // Monthly revenue for the last 6 months
      getMonthlyRevenue(),
    ]);

  return {
    totalRevenue: totalRevenue._sum.totalPrice || 0,
    orderCount,
    productCount,
    customerCount,
    recentOrders,
    monthlyRevenue,
  };
}

async function getMonthlyRevenue() {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const revenue = await db.order.aggregate({
      _sum: { totalPrice: true },
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: ["DELIVERED", "SHIPPED", "PROCESSING"] },
      },
    });

    months.push({
      month: start.toLocaleString("default", { month: "short" }),
      revenue: revenue._sum.totalPrice || 0,
    });
  }

  return months;
}

export async function getOrderStatusCounts() {
  const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

  const counts = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await db.order.count({ where: { status } }),
    }))
  );

  return counts;
}

export async function getRecentActivity() {
  const [recentOrders, recentCustomers, recentRuleLogs] = await Promise.all([
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
    db.customer.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
    db.ruleLog.findMany({
      take: 3,
      orderBy: { executedAt: "desc" },
      where: { status: "SUCCESS" },
      include: { rule: { select: { name: true } } },
    }),
  ]);

  const activities = [
    ...recentOrders.map((o) => ({
      type: "order" as const,
      message: `${o.customer.name} placed order ${o.orderNum} for $${o.totalPrice.toFixed(2)}`,
      timestamp: o.createdAt,
    })),
    ...recentCustomers.map((c) => ({
      type: "customer" as const,
      message: `${c.name} joined as a new customer`,
      timestamp: c.createdAt,
    })),
    ...recentRuleLogs.map((l) => ({
      type: "rule" as const,
      message: `Rule "${l.rule.name}" executed successfully`,
      timestamp: l.executedAt,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);

  return activities;
}
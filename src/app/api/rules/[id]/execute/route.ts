import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { executeRulesForTrigger } from "@/lib/rule-engine";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const rule = await db.rule.findUnique({ where: { id } });
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Build a test context based on the latest order
    const latestOrder = await db.order.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        customer: {
          include: {
            orders: { select: { totalPrice: true } },
            _count: { select: { orders: true } },
          },
        },
      },
    });

    if (!latestOrder) {
      return NextResponse.json(
        { error: "No orders found. Create an order first to test rules." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email: session.user?.email! } });

    const ctx = {
      order: {
        id: latestOrder.id,
        totalPrice: latestOrder.totalPrice,
        itemCount: latestOrder.items.length,
        status: latestOrder.status,
        customerId: latestOrder.customerId,
      },
      customer: {
        id: latestOrder.customer.id,
        orderCount: latestOrder.customer._count.orders,
        totalSpend: latestOrder.customer.orders.reduce((s, o) => s + o.totalPrice, 0),
        tag: latestOrder.customer.tag,
      },
    };

    const results = await executeRulesForTrigger(rule.trigger, ctx, user?.id);

    return NextResponse.json({ results, context: ctx });
  } catch (error) {
    console.error("Error executing rule:", error);
    return NextResponse.json({ error: "Failed to execute" }, { status: 500 });
  }
}
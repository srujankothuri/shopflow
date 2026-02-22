import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { runHighValueOrderRules } from "@/lib/rule-engine";

export async function GET() {
  try {
    const orders = await db.order.findMany({
      include: {
        customer: { select: { name: true, email: true, tag: true } },
        items: {
          include: {
            product: { select: { name: true, imageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId, items, note } = await req.json();

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Customer and at least one item required" },
        { status: 400 }
      );
    }

    // Calculate total price
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await db.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }
      totalPrice += product.price * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    // Generate order number
    const count = await db.order.count();
    const orderNum = `ORD-${String(count + 1).padStart(5, "0")}`;

    const order = await db.order.create({
      data: {
        orderNum,
        customerId,
        totalPrice,
        note: note || null,
        items: { create: orderItems },
      },
      include: {
        customer: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    // Fire automation rules in the background
    const user = await db.user.findUnique({ where: { email: session.user?.email! } });
    runHighValueOrderRules(order.id, user?.id).catch((err) =>
      console.error("Rule execution error:", err)
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
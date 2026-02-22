import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      include: {
        orders: {
          select: {
            id: true,
            orderNum: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add computed fields
    const enriched = customers.map((c) => ({
      ...c,
      totalSpend: c.orders.reduce((sum, o) => sum + o.totalPrice, 0),
      orderCount: c._count.orders,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone, address, tag } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    const existing = await db.customer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const customer = await db.customer.create({
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
        tag: tag || "REGULAR",
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
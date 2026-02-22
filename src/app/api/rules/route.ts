import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const rules = await db.rule.findMany({
      include: {
        createdBy: { select: { name: true, email: true } },
        _count: { select: { logs: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, trigger, conditions, actions, priority } = body;

    if (!name || !trigger || !conditions || !actions) {
      return NextResponse.json(
        { error: "Name, trigger, conditions, and actions are required" },
        { status: 400 }
      );
    }

    // Find the user in our DB
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rule = await db.rule.create({
      data: {
        name,
        description: description || null,
        trigger,
        conditions,
        actions,
        priority: priority || 0,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
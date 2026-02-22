import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const rule = await db.rule.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.trigger !== undefined && { trigger: body.trigger }),
        ...(body.conditions !== undefined && { conditions: body.conditions }),
        ...(body.actions !== undefined && { actions: body.actions }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.priority !== undefined && { priority: body.priority }),
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error updating rule:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.rule.delete({ where: { id } });

    return NextResponse.json({ message: "Rule deleted" });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const logs = await db.ruleLog.findMany({
      where: { ruleId: id },
      orderBy: { executedAt: "desc" },
      take: 50,
      include: {
        executedBy: { select: { name: true } },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
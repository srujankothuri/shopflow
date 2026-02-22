import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "products") {
      const products = await db.product.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" },
      });

      const headers = ["Name", "SKU", "Category", "Price", "Stock", "Status", "Created"];
      const rows = products.map((p) => [
        p.name,
        p.sku,
        p.category?.name || "",
        p.price.toFixed(2),
        p.stock.toString(),
        p.status,
        new Date(p.createdAt).toLocaleDateString(),
      ]);

      const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="shopflow-products-${Date.now()}.csv"`,
        },
      });
    }

    if (type === "orders") {
      const orders = await db.order.findMany({
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      });

      const headers = ["Order #", "Customer", "Email", "Items", "Total", "Status", "Date"];
      const rows = orders.map((o) => [
        o.orderNum,
        o.customer.name,
        o.customer.email,
        o.items.map((i) => `${i.product.name} x${i.quantity}`).join("; "),
        o.totalPrice.toFixed(2),
        o.status,
        new Date(o.createdAt).toLocaleDateString(),
      ]);

      const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="shopflow-orders-${Date.now()}.csv"`,
        },
      });
    }

    if (type === "customers") {
      const customers = await db.customer.findMany({
        include: { _count: { select: { orders: true } }, orders: { select: { totalPrice: true } } },
        orderBy: { createdAt: "desc" },
      });

      const headers = ["Name", "Email", "Phone", "Tag", "Orders", "Total Spend", "Joined"];
      const rows = customers.map((c) => [
        c.name,
        c.email,
        c.phone || "",
        c.tag,
        c._count.orders.toString(),
        c.orders.reduce((s, o) => s + o.totalPrice, 0).toFixed(2),
        new Date(c.createdAt).toLocaleDateString(),
      ]);

      const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="shopflow-customers-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: string;
  orderNum: string;
  status: string;
  totalPrice: number;
  note: string | null;
  createdAt: string;
  customer: { name: string; email: string; tag: string };
  items: { id: string; quantity: number; unitPrice: number; product: { name: string; imageUrl: string | null } }[];
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusFlow = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

function getNextStatus(current: string): string | null {
  const idx = statusFlow.indexOf(current);
  if (idx === -1 || idx === statusFlow.length - 1) return null;
  return statusFlow[idx + 1];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNum.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage and track customer orders.
        </p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => {
          const count = orders.filter((o) => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "ALL" : status)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                statusFilter === status ? "ring-2 ring-primary" : "hover:bg-accent"
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </p>
              <p className="text-2xl font-bold">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {orders.length === 0
                    ? "No orders yet. Orders will appear here after seeding data."
                    : "No orders match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => {
                const next = getNextStatus(order.status);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {order.orderNum}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{order.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {order.items.map((i) => i.product.name).join(", ")}
                      </p>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${order.totalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusStyles[order.status] || ""}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {next && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(order.id, next)}
                          >
                            {next.charAt(0) + next.slice(1).toLowerCase()}
                            <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                        {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => updateStatus(order.id, "CANCELLED")}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
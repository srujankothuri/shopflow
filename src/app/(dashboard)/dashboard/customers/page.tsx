"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp, Download } from "lucide-react";
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
import { CustomerDialog } from "@/components/customers/customer-dialog";

interface Order {
  id: string;
  orderNum: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  tag: string;
  createdAt: string;
  orders: Order[];
  totalSpend: number;
  orderCount: number;
}

const tagStyles: Record<string, string> = {
  REGULAR: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  VIP: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  WHOLESALE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  FLAGGED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer? This will fail if they have orders.")) return;
    try {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      fetchCustomers();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchTag = tagFilter === "ALL" || c.tag === tagFilter;
    return matchSearch && matchTag;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage customers and view order history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open("/api/export?type=customers")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => { setEditCustomer(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["REGULAR", "VIP", "WHOLESALE", "FLAGGED"].map((tag) => {
          const count = customers.filter((c) => c.tag === tag).length;
          return (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? "ALL" : tag)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                tagFilter === tag ? "ring-2 ring-primary" : "hover:bg-accent"
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {tag.charAt(0) + tag.slice(1).toLowerCase()}
              </p>
              <p className="text-2xl font-bold">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Tags</SelectItem>
            <SelectItem value="REGULAR">Regular</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="WHOLESALE">Wholesale</SelectItem>
            <SelectItem value="FLAGGED">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spend</TableHead>
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
                  {customers.length === 0
                    ? "No customers yet. Click 'Add Customer' to create one."
                    : "No customers match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => (
                <>
                  <TableRow key={customer.id} className="cursor-pointer">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          setExpandedId(expandedId === customer.id ? null : customer.id)
                        }
                      >
                        {expandedId === customer.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {customer.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={tagStyles[customer.tag] || ""}>
                        {customer.tag}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{customer.orderCount}</TableCell>
                    <TableCell className="font-semibold">
                      ${customer.totalSpend.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditCustomer(customer); setDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded order history */}
                  {expandedId === customer.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/30 p-4">
                        {customer.orders.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center">
                            No orders from this customer yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm font-medium mb-2">Order History</p>
                            {customer.orders.slice(0, 5).map((order) => (
                              <div
                                key={order.id}
                                className="flex items-center justify-between rounded border bg-card p-2 px-3"
                              >
                                <span className="font-mono text-sm">{order.orderNum}</span>
                                <Badge
                                  variant="secondary"
                                  className={statusStyles[order.status] || ""}
                                >
                                  {order.status}
                                </Badge>
                                <span className="text-sm font-medium">
                                  ${order.totalPrice.toFixed(2)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                            {customer.orders.length > 5 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{customer.orders.length - 5} more orders
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditCustomer(null); }}
        onSave={fetchCustomers}
        customer={editCustomer}
      />
    </div>
  );
}
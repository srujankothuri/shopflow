"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
}

interface OrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function OrderDialog({ open, onClose, onSave }: OrderDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ productId: "", quantity: 1 }]);

  useEffect(() => {
    if (open) {
      fetch("/api/customers").then((r) => r.json()).then(setCustomers).catch(console.error);
      fetch("/api/products").then((r) => r.json()).then(setProducts).catch(console.error);
      setCustomerId("");
      setNote("");
      setItems([{ productId: "", quantity: 1 }]);
      setError("");
    }
  }, [open]);

  const addItem = () => setItems([...items, { productId: "", quantity: 1 }]);

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, updates: Partial<OrderItem>) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, ...updates } : item)));
  };

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleSubmit = async () => {
    setError("");
    if (!customerId) { setError("Select a customer"); return; }
    if (items.some((i) => !i.productId)) { setError("Select a product for each item"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, items, note }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create order"); return; }

      onSave();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Order</DialogTitle>
          <DialogDescription>Create a new order for a customer.</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="space-y-4">
          {/* Customer */}
          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <Label>Items *</Label>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select
                  value={item.productId}
                  onValueChange={(v) => updateItem(idx, { productId: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p) => p.stock > 0)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — ${p.price.toFixed(2)} ({p.stock} in stock)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  className="w-20"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                />
                {items.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3 mr-1" /> Add Item
            </Button>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note..."
              rows={2}
            />
          </div>

          {/* Total */}
          <div className="rounded-lg bg-muted p-3 flex justify-between items-center">
            <span className="text-sm font-medium">Estimated Total</span>
            <span className="text-lg font-bold">${getTotal().toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and app settings.</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{session?.user?.name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{session?.user?.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant="secondary">{session?.user?.role || "ADMIN"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About Card */}
      <Card>
        <CardHeader>
          <CardTitle>About ShopFlow</CardTitle>
          <CardDescription>E-Commerce Operations Hub with Smart Automation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tech Stack</p>
              <p className="font-medium">Next.js 16, Prisma 7, PostgreSQL, TypeScript</p>
            </div>
            <div>
              <p className="text-muted-foreground">Features</p>
              <p className="font-medium">Products, Orders, Customers, Automation Rules Engine</p>
            </div>
            <div>
              <p className="text-muted-foreground">Author</p>
              <p className="font-medium">Srujan Kothuri</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
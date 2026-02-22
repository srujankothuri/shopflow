import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your store overview and key metrics.
        </p>
      </div>

      {/* Placeholder cards - will be built in Commit 5 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Total Revenue", "Orders", "Products", "Customers"].map((title) => (
          <div key={title} className="rounded-lg border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">--</p>
          </div>
        ))}
      </div>
    </div>
  );
}
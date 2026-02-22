import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome, {session.user?.name}!</h1>
        <p className="text-muted-foreground">
          Dashboard coming in the next commit.
        </p>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, UserPlus, Zap, Package } from "lucide-react";

interface Activity {
  type: "order" | "customer" | "rule" | "product";
  message: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const iconMap = {
  order: ShoppingCart,
  customer: UserPlus,
  rule: Zap,
  product: Package,
};

const colorMap = {
  order: "text-blue-500 bg-blue-100 dark:bg-blue-900",
  customer: "text-green-500 bg-green-100 dark:bg-green-900",
  rule: "text-amber-500 bg-amber-100 dark:bg-amber-900",
  product: "text-purple-500 bg-purple-100 dark:bg-purple-900",
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across your store</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, i) => {
              const Icon = iconMap[activity.type];
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={`shrink-0 rounded-full p-1.5 ${colorMap[activity.type]}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
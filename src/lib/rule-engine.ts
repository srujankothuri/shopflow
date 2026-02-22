 import { db } from "@/lib/db";

// --- Types ---
interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface ConditionGroup {
  logic: "all" | "any";
  conditions: Condition[];
}

interface Action {
  type: string;
  params: Record<string, string>;
}

interface RuleWithRelations {
  id: string;
  name: string;
  trigger: string;
  conditions: { groups?: ConditionGroup[] };
  actions: Action[];
  priority: number;
  isActive: boolean;
  createdById: string;
}

interface TriggerContext {
  order?: {
    id: string;
    totalPrice: number;
    itemCount: number;
    status: string;
    customerId: string;
  };
  customer?: {
    id: string;
    orderCount: number;
    totalSpend: number;
    tag: string;
  };
  product?: {
    id: string;
    stock: number;
    price: number;
  };
}

// --- Evaluation ---
function getFieldValue(field: string, ctx: TriggerContext): number | string | null {
  const [entity, prop] = field.split(".");
  const obj = ctx[entity as keyof TriggerContext];
  if (!obj) return null;
  return (obj as Record<string, unknown>)[prop] as number | string | null;
}

function evaluateCondition(cond: Condition, ctx: TriggerContext): boolean {
  const actual = getFieldValue(cond.field, ctx);
  if (actual === null || actual === undefined) return false;

  const target = isNaN(Number(cond.value)) ? cond.value : Number(cond.value);
  const val = typeof actual === "string" && !isNaN(Number(actual)) ? Number(actual) : actual;

  switch (cond.operator) {
    case "greaterThan": return val > target;
    case "greaterThanOrEqual": return val >= target;
    case "lessThan": return val < target;
    case "lessThanOrEqual": return val <= target;
    case "equal": return val == target;
    case "notEqual": return val != target;
    default: return false;
  }
}

function evaluateGroups(groups: ConditionGroup[], ctx: TriggerContext): boolean {
  // Groups are joined with OR — at least one group must pass
  return groups.some((group) => {
    if (group.logic === "all") {
      return group.conditions.every((c) => evaluateCondition(c, ctx));
    } else {
      return group.conditions.some((c) => evaluateCondition(c, ctx));
    }
  });
}

// --- Action Execution ---
async function executeAction(action: Action, ctx: TriggerContext): Promise<string> {
  switch (action.type) {
    case "TAG_CUSTOMER": {
      if (!ctx.customer?.id) return "No customer in context";
      await db.customer.update({
        where: { id: ctx.customer.id },
        data: { tag: action.params.tag as "REGULAR" | "VIP" | "WHOLESALE" | "FLAGGED" },
      });
      return `Tagged customer as ${action.params.tag}`;
    }

    case "FLAG_ORDER": {
      if (!ctx.order?.id) return "No order in context";
      await db.order.update({
        where: { id: ctx.order.id },
        data: { note: `⚠️ FLAGGED: ${action.params.reason || "Rule triggered"}` },
      });
      return `Flagged order: ${action.params.reason || "Rule triggered"}`;
    }

    case "UPDATE_ORDER_STATUS": {
      if (!ctx.order?.id) return "No order in context";
      await db.order.update({
        where: { id: ctx.order.id },
        data: { status: action.params.status as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" },
      });
      return `Updated order status to ${action.params.status}`;
    }

    case "APPLY_DISCOUNT": {
      if (!ctx.order?.id) return "No order in context";
      const pct = parseFloat(action.params.percentage) / 100;
      const order = await db.order.findUnique({ where: { id: ctx.order.id } });
      if (!order) return "Order not found";
      const discounted = order.totalPrice * (1 - pct);
      await db.order.update({
        where: { id: ctx.order.id },
        data: {
          totalPrice: Math.round(discounted * 100) / 100,
          note: `${action.params.percentage}% discount applied by automation`,
        },
      });
      return `Applied ${action.params.percentage}% discount`;
    }

    case "SEND_EMAIL": {
      // In production, this would call Resend/SendGrid
      // For now, we log it as a successful simulation
      return `Email sent to ${action.params.to || "admin"}: ${action.params.subject || "Notification"}`;
    }

    default:
      return `Unknown action: ${action.type}`;
  }
}

// --- Main Engine ---
export async function executeRulesForTrigger(
  triggerType: string,
  ctx: TriggerContext,
  executedById?: string
) {
  // Fetch all active rules for this trigger, sorted by priority
  const rules = await db.rule.findMany({
    where: {
      trigger: triggerType as RuleWithRelations["trigger"],
      isActive: true,
    },
    orderBy: { priority: "desc" },
  });

  const results = [];

  for (const rule of rules) {
    const conditions = rule.conditions as { groups?: ConditionGroup[] };
    const actions = rule.actions as Action[];

    const groups = conditions?.groups || [];

    // If no conditions, always pass
    const passed = groups.length === 0 || evaluateGroups(groups, ctx);

    if (passed) {
      const actionResults: string[] = [];
      let status: "SUCCESS" | "FAILURE" = "SUCCESS";
      let error: string | null = null;

      try {
        for (const action of actions) {
          const result = await executeAction(action, ctx);
          actionResults.push(result);
        }
      } catch (e) {
        status = "FAILURE";
        error = e instanceof Error ? e.message : "Unknown error";
      }

      // Log the execution
      await db.ruleLog.create({
        data: {
          ruleId: rule.id,
          status,
          triggerData: ctx as object,
          actionsRun: actionResults,
          error,
          executedById: executedById || null,
        },
      });

      // Update rule stats
      await db.rule.update({
        where: { id: rule.id },
        data: {
          triggerCount: { increment: 1 },
          lastTriggeredAt: new Date(),
        },
      });

      results.push({ ruleId: rule.id, ruleName: rule.name, status, actionResults, error });
    } else {
      // Log as skipped
      await db.ruleLog.create({
        data: {
          ruleId: rule.id,
          status: "SKIPPED",
          triggerData: ctx as object,
          actionsRun: [],
          executedById: executedById || null,
        },
      });

      results.push({ ruleId: rule.id, ruleName: rule.name, status: "SKIPPED" });
    }
  }

  return results;
}

// --- Convenience functions for specific triggers ---
export async function runOrderPlacedRules(orderId: string, executedById?: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: {
        include: {
          orders: { select: { totalPrice: true } },
          _count: { select: { orders: true } },
        },
      },
    },
  });

  if (!order) return [];

  const ctx: TriggerContext = {
    order: {
      id: order.id,
      totalPrice: order.totalPrice,
      itemCount: order.items.length,
      status: order.status,
      customerId: order.customerId,
    },
    customer: {
      id: order.customer.id,
      orderCount: order.customer._count.orders,
      totalSpend: order.customer.orders.reduce((s, o) => s + o.totalPrice, 0),
      tag: order.customer.tag,
    },
  };

  return executeRulesForTrigger("ORDER_PLACED", ctx, executedById);
}

export async function runHighValueOrderRules(orderId: string, executedById?: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: {
        include: {
          orders: { select: { totalPrice: true } },
          _count: { select: { orders: true } },
        },
      },
    },
  });

  if (!order) return [];

  const ctx: TriggerContext = {
    order: {
      id: order.id,
      totalPrice: order.totalPrice,
      itemCount: order.items.length,
      status: order.status,
      customerId: order.customerId,
    },
    customer: {
      id: order.customer.id,
      orderCount: order.customer._count.orders,
      totalSpend: order.customer.orders.reduce((s, o) => s + o.totalPrice, 0),
      tag: order.customer.tag,
    },
  };

  // Run both ORDER_PLACED and HIGH_VALUE_ORDER triggers
  const r1 = await executeRulesForTrigger("ORDER_PLACED", ctx, executedById);
  const r2 = await executeRulesForTrigger("HIGH_VALUE_ORDER", ctx, executedById);
  const r3 = await executeRulesForTrigger("REPEAT_CUSTOMER", ctx, executedById);

  return [...r1, ...r2, ...r3];
}

export async function runLowStockRules(productId: string, executedById?: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return [];

  const ctx: TriggerContext = {
    product: {
      id: product.id,
      stock: product.stock,
      price: product.price,
    },
  };

  return executeRulesForTrigger("LOW_STOCK", ctx, executedById);
}
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

// Manually parse .env
const envFile = readFileSync(".env", "utf-8");
const dbUrl = envFile.match(/DATABASE_URL="(.+)"/)?.[1];
if (!dbUrl) throw new Error("DATABASE_URL not found in .env");

console.log("DB URL found:", dbUrl.substring(0, 30) + "...");

const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // --- Clear existing data ---
  await prisma.ruleLog.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // --- Admin User ---
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@shopflow.com",
      hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created (admin@shopflow.com / admin123)");

  // --- Categories ---
  const categories = await Promise.all(
    ["Electronics", "Clothing", "Home & Kitchen", "Sports", "Books", "Accessories"].map(
      (name) => prisma.category.create({ data: { name } })
    )
  );
  console.log(`✅ ${categories.length} categories created`);

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  // --- Products ---
  const productsData = [
    { name: "Wireless Bluetooth Headphones", sku: "ELEC-001", price: 79.99, stock: 45, cat: "Electronics", img: "https://picsum.photos/seed/headphones/200" },
    { name: "USB-C Fast Charger", sku: "ELEC-002", price: 29.99, stock: 120, cat: "Electronics", img: "https://picsum.photos/seed/charger/200" },
    { name: "Mechanical Keyboard", sku: "ELEC-003", price: 149.99, stock: 30, cat: "Electronics", img: "https://picsum.photos/seed/keyboard/200" },
    { name: "4K Webcam Pro", sku: "ELEC-004", price: 199.99, stock: 15, cat: "Electronics", img: "https://picsum.photos/seed/webcam/200" },
    { name: "Portable SSD 1TB", sku: "ELEC-005", price: 89.99, stock: 60, cat: "Electronics", img: "https://picsum.photos/seed/ssd/200" },
    { name: "Smart Watch Elite", sku: "ELEC-006", price: 299.99, stock: 8, cat: "Electronics", img: "https://picsum.photos/seed/watch/200" },
    { name: "Classic Cotton T-Shirt", sku: "CLO-001", price: 24.99, stock: 200, cat: "Clothing", img: "https://picsum.photos/seed/tshirt/200" },
    { name: "Slim Fit Jeans", sku: "CLO-002", price: 59.99, stock: 85, cat: "Clothing", img: "https://picsum.photos/seed/jeans/200" },
    { name: "Winter Puffer Jacket", sku: "CLO-003", price: 129.99, stock: 35, cat: "Clothing", img: "https://picsum.photos/seed/jacket/200" },
    { name: "Running Sneakers", sku: "CLO-004", price: 89.99, stock: 50, cat: "Clothing", img: "https://picsum.photos/seed/sneakers/200" },
    { name: "Stainless Steel Water Bottle", sku: "HOME-001", price: 19.99, stock: 150, cat: "Home & Kitchen", img: "https://picsum.photos/seed/bottle/200" },
    { name: "Non-stick Cookware Set", sku: "HOME-002", price: 149.99, stock: 20, cat: "Home & Kitchen", img: "https://picsum.photos/seed/cookware/200" },
    { name: "Smart LED Desk Lamp", sku: "HOME-003", price: 44.99, stock: 70, cat: "Home & Kitchen", img: "https://picsum.photos/seed/lamp/200" },
    { name: "Coffee Maker Deluxe", sku: "HOME-004", price: 79.99, stock: 25, cat: "Home & Kitchen", img: "https://picsum.photos/seed/coffee/200" },
    { name: "Yoga Mat Premium", sku: "SPO-001", price: 34.99, stock: 90, cat: "Sports", img: "https://picsum.photos/seed/yoga/200" },
    { name: "Resistance Band Set", sku: "SPO-002", price: 22.99, stock: 110, cat: "Sports", img: "https://picsum.photos/seed/bands/200" },
    { name: "Dumbbell Pair 10kg", sku: "SPO-003", price: 49.99, stock: 40, cat: "Sports", img: "https://picsum.photos/seed/dumbbell/200" },
    { name: "Programming in TypeScript", sku: "BOK-001", price: 39.99, stock: 65, cat: "Books", img: "https://picsum.photos/seed/tsbook/200" },
    { name: "System Design Interview", sku: "BOK-002", price: 44.99, stock: 55, cat: "Books", img: "https://picsum.photos/seed/sysdesign/200" },
    { name: "Leather Wallet", sku: "ACC-001", price: 34.99, stock: 75, cat: "Accessories", img: "https://picsum.photos/seed/wallet/200" },
    { name: "Sunglasses Aviator", sku: "ACC-002", price: 59.99, stock: 3, cat: "Accessories", img: "https://picsum.photos/seed/sunglasses/200" },
    { name: "Laptop Backpack", sku: "ACC-003", price: 69.99, stock: 45, cat: "Accessories", img: "https://picsum.photos/seed/backpack/200" },
  ];

  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.create({
        data: {
          name: p.name,
          sku: p.sku,
          price: p.price,
          stock: p.stock,
          categoryId: catMap[p.cat],
          imageUrl: p.img,
          status: p.stock < 5 ? "ACTIVE" : "ACTIVE",
          description: `High quality ${p.name.toLowerCase()} for everyday use.`,
        },
      })
    )
  );
  console.log(`✅ ${products.length} products created`);

  // --- Customers ---
  const customersData = [
    { name: "Emma Johnson", email: "emma@example.com", phone: "+1-555-0101", tag: "VIP" },
    { name: "James Wilson", email: "james@example.com", phone: "+1-555-0102", tag: "REGULAR" },
    { name: "Sophia Martinez", email: "sophia@example.com", phone: "+1-555-0103", tag: "VIP" },
    { name: "Liam Anderson", email: "liam@example.com", phone: "+1-555-0104", tag: "WHOLESALE" },
    { name: "Olivia Brown", email: "olivia@example.com", phone: "+1-555-0105", tag: "REGULAR" },
    { name: "Noah Davis", email: "noah@example.com", phone: "+1-555-0106", tag: "REGULAR" },
    { name: "Ava Garcia", email: "ava@example.com", phone: "+1-555-0107", tag: "VIP" },
    { name: "William Lee", email: "william@example.com", phone: "+1-555-0108", tag: "REGULAR" },
    { name: "Isabella Clark", email: "isabella@example.com", phone: "+1-555-0109", tag: "FLAGGED" },
    { name: "Mason Taylor", email: "mason@example.com", phone: "+1-555-0110", tag: "REGULAR" },
    { name: "Mia Robinson", email: "mia@example.com", phone: "+1-555-0111", tag: "REGULAR" },
    { name: "Ethan White", email: "ethan@example.com", phone: "+1-555-0112", tag: "WHOLESALE" },
    { name: "Charlotte Hall", email: "charlotte@example.com", phone: "+1-555-0113", tag: "VIP" },
    { name: "Alexander King", email: "alex@example.com", phone: "+1-555-0114", tag: "REGULAR" },
    { name: "Amelia Wright", email: "amelia@example.com", phone: "+1-555-0115", tag: "REGULAR" },
  ];

  const customers = await Promise.all(
    customersData.map((c) =>
      prisma.customer.create({
        data: {
          name: c.name,
          email: c.email,
          phone: c.phone,
          tag: c.tag as "REGULAR" | "VIP" | "WHOLESALE" | "FLAGGED",
          address: `${Math.floor(Math.random() * 999) + 1} Main St, City, ST ${String(Math.floor(Math.random() * 90000) + 10000)}`,
        },
      })
    )
  );
  console.log(`✅ ${customers.length} customers created`);

  // --- Orders (spread over last 6 months) ---
  const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
  const now = new Date();
  let orderCount = 0;

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const ordersThisMonth = monthOffset === 0 ? 15 : Math.floor(Math.random() * 20) + 10;

    for (let i = 0; i < ordersThisMonth; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const orderProducts = [];
      let total = 0;

      for (let j = 0; j < itemCount; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        total += prod.price * qty;
        orderProducts.push({ productId: prod.id, quantity: qty, unitPrice: prod.price });
      }

      // Weight towards DELIVERED for older months
      let statusIdx: number;
      if (monthOffset >= 3) statusIdx = Math.random() < 0.8 ? 3 : Math.floor(Math.random() * 5);
      else if (monthOffset >= 1) statusIdx = Math.floor(Math.random() * 4);
      else statusIdx = Math.floor(Math.random() * 3);

      const day = Math.floor(Math.random() * 28) + 1;
      const createdAt = new Date(now.getFullYear(), now.getMonth() - monthOffset, day);

      orderCount++;
      await prisma.order.create({
        data: {
          orderNum: `ORD-${String(orderCount).padStart(5, "0")}`,
          customerId: customer.id,
          totalPrice: Math.round(total * 100) / 100,
          status: statuses[statusIdx],
          createdAt,
          items: { create: orderProducts },
          note: total > 300 ? "⚠️ High value order" : null,
        },
      });
    }
  }
  console.log(`✅ ${orderCount} orders created`);

  // --- Automation Rules ---
  await prisma.rule.create({
    data: {
      name: "Flag High-Value Orders",
      description: "Automatically flag orders over $500 for manual review",
      trigger: "HIGH_VALUE_ORDER",
      conditions: {
        groups: [
          {
            id: "g1",
            logic: "all",
            conditions: [
              { id: "c1", field: "order.totalPrice", operator: "greaterThan", value: "500" },
            ],
          },
        ],
      },
      actions: [
        { id: "a1", type: "FLAG_ORDER", params: { reason: "Order exceeds $500 threshold" } },
      ],
      isActive: true,
      priority: 10,
      createdById: admin.id,
      triggerCount: 12,
      lastTriggeredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  });

  await prisma.rule.create({
    data: {
      name: "VIP Customer Tagging",
      description: "Tag customers as VIP when their total spend exceeds $1000",
      trigger: "ORDER_PLACED",
      conditions: {
        groups: [
          {
            id: "g1",
            logic: "all",
            conditions: [
              { id: "c1", field: "customer.totalSpend", operator: "greaterThan", value: "1000" },
            ],
          },
        ],
      },
      actions: [
        { id: "a1", type: "TAG_CUSTOMER", params: { tag: "VIP" } },
        { id: "a2", type: "SEND_EMAIL", params: { to: "admin@shopflow.com", subject: "New VIP Customer", body: "A customer just crossed the $1000 spend threshold." } },
      ],
      isActive: true,
      priority: 5,
      createdById: admin.id,
      triggerCount: 8,
      lastTriggeredAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  await prisma.rule.create({
    data: {
      name: "Low Stock Alert",
      description: "Send notification when product stock falls below 5 units",
      trigger: "LOW_STOCK",
      conditions: {
        groups: [
          {
            id: "g1",
            logic: "all",
            conditions: [
              { id: "c1", field: "product.stock", operator: "lessThan", value: "5" },
            ],
          },
        ],
      },
      actions: [
        { id: "a1", type: "SEND_EMAIL", params: { to: "inventory@shopflow.com", subject: "Low Stock Alert", body: "A product has fallen below 5 units." } },
      ],
      isActive: true,
      priority: 8,
      createdById: admin.id,
      triggerCount: 3,
      lastTriggeredAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
  });

  await prisma.rule.create({
    data: {
      name: "Repeat Customer Discount",
      description: "Apply 10% discount for customers with 5+ orders",
      trigger: "REPEAT_CUSTOMER",
      conditions: {
        groups: [
          {
            id: "g1",
            logic: "all",
            conditions: [
              { id: "c1", field: "customer.orderCount", operator: "greaterThanOrEqual", value: "5" },
            ],
          },
        ],
      },
      actions: [
        { id: "a1", type: "APPLY_DISCOUNT", params: { percentage: "10" } },
      ],
      isActive: false,
      priority: 3,
      createdById: admin.id,
      triggerCount: 0,
    },
  });

  console.log("✅ 4 automation rules created");
  console.log("\n🎉 Seeding complete!\n");
  console.log("Login with: admin@shopflow.com / admin123\n");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
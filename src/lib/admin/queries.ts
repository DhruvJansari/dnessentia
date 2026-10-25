import "server-only";
import { and, count, desc, eq, gte, inArray, like, lte, or, sql, sum, type SQL } from "drizzle-orm";
import { auditLogs, db, orders, products, productVariants, users, type OrderStatus } from "@/db";
import { getSettings } from "../settings";

/** Orders that count as revenue: confirmed or further along, never pending/cancelled/returned. */
const revenueStatuses: OrderStatus[] = ["confirmed", "processing", "shipped", "delivered"];
const IST_OFFSET_MS = 5.5 * 3600e3;

function startOfTodayIST() {
  const now = Date.now() + IST_OFFSET_MS;
  return new Date(now - (now % 864e5) - IST_OFFSET_MS);
}

async function revenueSince(from: Date) {
  const [row] = await db
    .select({ revenue: sum(orders.total), n: count() })
    .from(orders)
    .where(and(gte(orders.createdAt, from), inArray(orders.status, revenueStatuses)));
  return { revenue: Number(row?.revenue ?? 0), orders: row?.n ?? 0 };
}

export async function getDashboard() {
  const today = startOfTodayIST();
  const d7 = new Date(today.getTime() - 6 * 864e5);
  const d30 = new Date(today.getTime() - 29 * 864e5);
  const settings = await getSettings();

  const [todayStats, weekStats, monthStats, daily, byStatus, awaitingPayment, lowStock, recent, activity, customers] = await Promise.all([
    revenueSince(today),
    revenueSince(d7),
    revenueSince(d30),
    db
      .select({
        day: sql<string>`DATE_FORMAT(CONVERT_TZ(${orders.createdAt}, '+00:00', '+05:30'), '%Y-%m-%d')`.as("day"),
        revenue: sum(orders.total),
        n: count(),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, d30), inArray(orders.status, revenueStatuses)))
      .groupBy(sql`day`),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db
      .select({ n: count() })
      .from(orders)
      .where(and(eq(orders.status, "pending"), eq(orders.paymentMethod, "razorpay"))),
    db
      .select({ id: productVariants.id, productId: products.id, name: products.name, label: productVariants.label, stock: productVariants.stock })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(and(lte(productVariants.stock, settings.store.lowStockThreshold), eq(productVariants.isActive, true), eq(products.isActive, true)))
      .orderBy(productVariants.stock)
      .limit(8),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(6),
    db.select({ n: count() }).from(users).where(eq(users.role, "customer")),
  ]);

  // Fill missing days so the chart has 30 evenly spaced bars.
  const map = new Map(daily.map((d) => [d.day, { revenue: Number(d.revenue ?? 0), orders: d.n }]));
  const chart = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(d30.getTime() + i * 864e5 + IST_OFFSET_MS);
    const key = date.toISOString().slice(0, 10);
    return { day: key, ...(map.get(key) ?? { revenue: 0, orders: 0 }) };
  });

  const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s.n])) as Partial<Record<OrderStatus, number>>;
  return {
    today: todayStats,
    week: weekStats,
    month: monthStats,
    aov: monthStats.orders ? Math.round(monthStats.revenue / monthStats.orders) : 0,
    chart,
    statusCounts,
    toShip: (statusCounts.confirmed ?? 0) + (statusCounts.processing ?? 0),
    awaitingPayment: awaitingPayment[0]?.n ?? 0,
    lowStock,
    lowStockThreshold: settings.store.lowStockThreshold,
    recent,
    activity,
    customers: customers[0]?.n ?? 0,
  };
}

export const PAGE_SIZE = 20;

export type OrderFilters = { q?: string; status?: string; payment?: string; page?: number };

export async function listOrders(f: OrderFilters) {
  const where: SQL[] = [];
  if (f.status && f.status !== "all") {
    if (f.status === "to_ship") where.push(inArray(orders.status, ["confirmed", "processing"]));
    else where.push(eq(orders.status, f.status as OrderStatus));
  }
  if (f.payment && f.payment !== "all") where.push(eq(orders.paymentStatus, f.payment as "paid"));
  if (f.q) {
    const q = `%${f.q.trim()}%`;
    where.push(or(like(orders.orderNumber, q), like(orders.email, q), like(orders.phone, q), like(orders.customerName, q), like(orders.awbCode, q))!);
  }
  const condition = where.length ? and(...where) : undefined;
  const page = Math.max(1, f.page ?? 1);
  const [rows, [{ n }], byStatus] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(condition)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(orders).where(condition),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
  ]);
  return { rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)), byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s.n])) };
}

export async function listCustomers(q: string | undefined, page: number) {
  const where: SQL[] = [];
  if (q) {
    const like_ = `%${q.trim()}%`;
    where.push(or(like(users.email, like_), like(users.name, like_), like(users.phone, like_))!);
  }
  const condition = where.length ? and(...where) : undefined;
  const stats = db
    .select({
      userId: orders.userId,
      orderCount: count().as("order_count"),
      spent: sql<string>`SUM(CASE WHEN ${inArray(orders.status, revenueStatuses)} THEN ${orders.total} ELSE 0 END)`.as("spent"),
      lastOrder: sql<Date>`MAX(${orders.createdAt})`.as("last_order"),
    })
    .from(orders)
    .groupBy(orders.userId)
    .as("stats");
  const [rows, [{ n }]] = await Promise.all([
    db
      .select({ user: users, orderCount: stats.orderCount, spent: stats.spent, lastOrder: stats.lastOrder })
      .from(users)
      .leftJoin(stats, eq(stats.userId, users.id))
      .where(condition)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(users).where(condition),
  ]);
  return { rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)) };
}

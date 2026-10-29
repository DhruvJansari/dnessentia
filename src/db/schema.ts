/**
 * Database schema (MySQL, via Drizzle). Column names are snake_case in the database; see `casing` in src/db/index.ts.
 * All money columns are whole rupees (INT). Razorpay amounts are converted to paise at the API boundary.
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const createdAt = () => timestamp({ mode: "date" }).notNull().defaultNow();
const updatedAt = () => timestamp({ mode: "date" }).notNull().defaultNow().onUpdateNow();

/* ---------------------------------- People --------------------------------- */

export const users = mysqlTable(
  "users",
  {
    id: int().autoincrement().primaryKey(),
    email: varchar({ length: 191 }).notNull(),
    name: varchar({ length: 120 }).notNull().default(""),
    phone: varchar({ length: 20 }),
    passwordHash: varchar({ length: 100 }),
    role: mysqlEnum(["customer", "staff", "admin"]).notNull().default("customer"),
    isActive: boolean().notNull().default(true),
    emailVerifiedAt: timestamp({ mode: "date" }),
    lastLoginAt: timestamp({ mode: "date" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email), index("users_role_idx").on(t.role)],
);

export const sessions = mysqlTable(
  "sessions",
  {
    /** SHA-256 of the cookie token; the raw token never touches the database. */
    id: varchar({ length: 64 }).primaryKey(),
    userId: int().notNull(),
    expiresAt: timestamp({ mode: "date" }).notNull(),
    ip: varchar({ length: 64 }),
    userAgent: varchar({ length: 255 }),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** One-time tokens for password reset and email verification (hashed like sessions). */
export const authTokens = mysqlTable(
  "auth_tokens",
  {
    id: varchar({ length: 64 }).primaryKey(),
    userId: int().notNull(),
    purpose: mysqlEnum(["password_reset", "verify_email"]).notNull(),
    expiresAt: timestamp({ mode: "date" }).notNull(),
    usedAt: timestamp({ mode: "date" }),
    createdAt: createdAt(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId)],
);

export const addresses = mysqlTable(
  "addresses",
  {
    id: int().autoincrement().primaryKey(),
    userId: int().notNull(),
    name: varchar({ length: 120 }).notNull(),
    phone: varchar({ length: 20 }).notNull(),
    line1: varchar({ length: 255 }).notNull(),
    line2: varchar({ length: 255 }),
    city: varchar({ length: 100 }).notNull(),
    state: varchar({ length: 100 }).notNull(),
    pincode: varchar({ length: 10 }).notNull(),
    isDefault: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

/* --------------------------------- Catalog --------------------------------- */

export type FragranceNotes = { top: string[]; heart: string[]; base: string[] };

export const products = mysqlTable(
  "products",
  {
    id: int().autoincrement().primaryKey(),
    slug: varchar({ length: 160 }).notNull(),
    type: mysqlEnum(["attar", "combo"]).notNull(),
    name: varchar({ length: 160 }).notNull(),
    /** e.g. "Modern • Confident • Sharp" */
    character: varchar({ length: 160 }).notNull().default(""),
    bestFor: varchar({ length: 255 }).notNull().default(""),
    about: text().notNull(),
    notes: json().$type<FragranceNotes>(),
    categories: json().$type<string[]>().notNull(),
    images: json().$type<string[]>().notNull(),
    /** Combos: how many attars the customer chooses (7 = whole range) and the size of each. */
    pickCount: int(),
    sizeMl: int(),
    includes: json().$type<string[]>(),
    perfectFor: json().$type<string[]>(),
    howToUse: text(),
    whyChoose: json().$type<string[]>(),
    isActive: boolean().notNull().default(true),
    isBestSeller: boolean().notNull().default(false),
    sortOrder: int().notNull().default(0),
    seoTitle: varchar({ length: 160 }),
    seoDescription: varchar({ length: 320 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("products_slug_uq").on(t.slug), index("products_type_idx").on(t.type)],
);

export const productVariants = mysqlTable(
  "product_variants",
  {
    id: int().autoincrement().primaryKey(),
    productId: int().notNull(),
    label: varchar({ length: 60 }).notNull(),
    sku: varchar({ length: 60 }).notNull(),
    price: int().notNull(),
    compareAtPrice: int(),
    stock: int().notNull().default(0),
    weightGrams: int().notNull().default(50),
    isActive: boolean().notNull().default(true),
    sortOrder: int().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("variants_sku_uq").on(t.sku), index("variants_product_idx").on(t.productId)],
);

/* --------------------------------- Orders ---------------------------------- */

export const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export const paymentStatuses = ["unpaid", "paid", "failed", "refunded"] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];

export const orders = mysqlTable(
  "orders",
  {
    id: int().autoincrement().primaryKey(),
    orderNumber: varchar({ length: 20 }).notNull(),
    /** Replacement orders are free re-shipments created from an approved replacement request. */
    kind: mysqlEnum(["standard", "replacement"]).notNull().default("standard"),
    parentOrderId: int(),
    invoiceNumber: varchar({ length: 30 }),
    invoicedAt: timestamp({ mode: "date" }),
    /** Hash of the secret in the guest tracking link emailed to the customer. */
    accessTokenHash: varchar({ length: 64 }).notNull(),
    userId: int(),
    email: varchar({ length: 191 }).notNull(),
    phone: varchar({ length: 20 }).notNull(),
    customerName: varchar({ length: 120 }).notNull(),
    shipLine1: varchar({ length: 255 }).notNull(),
    shipLine2: varchar({ length: 255 }),
    shipCity: varchar({ length: 100 }).notNull(),
    shipState: varchar({ length: 100 }).notNull(),
    shipPincode: varchar({ length: 10 }).notNull(),
    status: mysqlEnum(orderStatuses).notNull().default("pending"),
    paymentStatus: mysqlEnum(paymentStatuses).notNull().default("unpaid"),
    paymentMethod: mysqlEnum(["razorpay", "cod"]).notNull(),
    subtotal: int().notNull(),
    discount: int().notNull().default(0),
    shippingFee: int().notNull().default(0),
    codFee: int().notNull().default(0),
    total: int().notNull(),
    couponCode: varchar({ length: 40 }),
    giftNote: varchar({ length: 255 }),
    customerNote: varchar({ length: 500 }),
    razorpayOrderId: varchar({ length: 60 }),
    razorpayPaymentId: varchar({ length: 60 }),
    shiprocketOrderId: varchar({ length: 40 }),
    shiprocketShipmentId: varchar({ length: 40 }),
    awbCode: varchar({ length: 60 }),
    courierName: varchar({ length: 120 }),
    trackingStatus: varchar({ length: 120 }),
    stockDeducted: boolean().notNull().default(false),
    /** Amount kept when a customer cancels (cancellation charge) and amount refunded so far. */
    cancellationCharge: int().notNull().default(0),
    refundedAmount: int().notNull().default(0),
    cancelReason: varchar({ length: 255 }),
    paymentReminderSentAt: timestamp({ mode: "date" }),
    paidAt: timestamp({ mode: "date" }),
    shippedAt: timestamp({ mode: "date" }),
    deliveredAt: timestamp({ mode: "date" }),
    cancelledAt: timestamp({ mode: "date" }),
    ip: varchar({ length: 64 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("orders_number_uq").on(t.orderNumber),
    uniqueIndex("orders_invoice_uq").on(t.invoiceNumber),
    index("orders_user_idx").on(t.userId),
    index("orders_email_idx").on(t.email),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    index("orders_rzp_idx").on(t.razorpayOrderId),
    index("orders_awb_idx").on(t.awbCode),
  ],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: int().autoincrement().primaryKey(),
    orderId: int().notNull(),
    productId: int().notNull(),
    variantId: int().notNull(),
    name: varchar({ length: 160 }).notNull(),
    variantLabel: varchar({ length: 60 }).notNull(),
    sku: varchar({ length: 60 }).notNull(),
    image: varchar({ length: 255 }).notNull(),
    unitPrice: int().notNull(),
    quantity: int().notNull(),
    lineTotal: int().notNull(),
    /** Combo packs: the attars the customer picked. */
    selections: json().$type<string[]>(),
    /** Free gift lines (e.g. FREEGIFT sample) are priced at 0. */
    isGift: boolean().notNull().default(false),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/** Everything that happens to an order, in order. This is the audit trail shown on the admin order page. */
export const orderEvents = mysqlTable(
  "order_events",
  {
    id: int().autoincrement().primaryKey(),
    orderId: int().notNull(),
    type: mysqlEnum(["created", "status", "payment", "shipment", "email", "note", "stock"]).notNull(),
    message: varchar({ length: 500 }).notNull(),
    data: json().$type<Record<string, unknown>>(),
    actorType: mysqlEnum(["system", "customer", "admin", "webhook"]).notNull(),
    actorId: int(),
    /** Internal notes stay hidden from the customer timeline. */
    isInternal: boolean().notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

export const payments = mysqlTable(
  "payments",
  {
    id: int().autoincrement().primaryKey(),
    orderId: int().notNull(),
    provider: mysqlEnum(["razorpay", "cod"]).notNull(),
    providerOrderId: varchar({ length: 60 }),
    providerPaymentId: varchar({ length: 60 }),
    amount: int().notNull(),
    status: mysqlEnum(["created", "captured", "failed", "refunded"]).notNull(),
    method: varchar({ length: 40 }),
    raw: json().$type<Record<string, unknown>>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payments_order_idx").on(t.orderId), index("payments_provider_payment_idx").on(t.providerPaymentId)],
);

/* --------------------------------- Coupons --------------------------------- */

export const coupons = mysqlTable(
  "coupons",
  {
    id: int().autoincrement().primaryKey(),
    code: varchar({ length: 40 }).notNull(),
    description: varchar({ length: 255 }).notNull().default(""),
    /** free_gift adds a gift note to the order instead of a price reduction. */
    type: mysqlEnum(["percent", "fixed", "free_gift"]).notNull(),
    value: int().notNull().default(0),
    /** free_gift coupons: the variant size the customer chooses a free sample in, e.g. "1 ml". */
    giftSize: varchar({ length: 20 }),
    minOrder: int().notNull().default(0),
    maxUses: int(),
    usedCount: int().notNull().default(0),
    startsAt: timestamp({ mode: "date" }),
    endsAt: timestamp({ mode: "date" }),
    isActive: boolean().notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("coupons_code_uq").on(t.code)],
);

/* ---------------------------- Traceability logs ---------------------------- */

export const emailLogs = mysqlTable(
  "email_logs",
  {
    id: int().autoincrement().primaryKey(),
    to: varchar({ length: 191 }).notNull(),
    subject: varchar({ length: 255 }).notNull(),
    template: varchar({ length: 60 }).notNull(),
    status: mysqlEnum(["sent", "failed", "skipped"]).notNull(),
    error: text(),
    messageId: varchar({ length: 255 }),
    orderId: int(),
    userId: int(),
    createdAt: createdAt(),
  },
  (t) => [index("email_logs_order_idx").on(t.orderId), index("email_logs_created_idx").on(t.createdAt)],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int().autoincrement().primaryKey(),
    actorId: int(),
    actorEmail: varchar({ length: 191 }),
    action: varchar({ length: 80 }).notNull(),
    entityType: varchar({ length: 40 }).notNull(),
    entityId: varchar({ length: 40 }),
    summary: varchar({ length: 500 }).notNull(),
    changes: json().$type<Record<string, unknown>>(),
    ip: varchar({ length: 64 }),
    createdAt: createdAt(),
  },
  (t) => [index("audit_entity_idx").on(t.entityType, t.entityId), index("audit_created_idx").on(t.createdAt)],
);

export const webhookEvents = mysqlTable(
  "webhook_events",
  {
    id: int().autoincrement().primaryKey(),
    provider: mysqlEnum(["razorpay", "shiprocket"]).notNull(),
    eventType: varchar({ length: 80 }).notNull(),
    externalId: varchar({ length: 120 }),
    payload: json().$type<Record<string, unknown>>().notNull(),
    status: mysqlEnum(["received", "processed", "ignored", "failed"]).notNull().default("received"),
    error: text(),
    createdAt: createdAt(),
  },
  (t) => [index("webhooks_provider_idx").on(t.provider, t.createdAt)],
);

/* ------------------------- Customer engagement ------------------------- */

export const reviews = mysqlTable(
  "reviews",
  {
    id: int().autoincrement().primaryKey(),
    productId: int().notNull(),
    userId: int(),
    name: varchar({ length: 120 }).notNull(),
    rating: int().notNull(),
    title: varchar({ length: 160 }).notNull().default(""),
    body: text().notNull(),
    status: mysqlEnum(["pending", "approved", "rejected"]).notNull().default("pending"),
    verifiedPurchase: boolean().notNull().default(false),
    adminReply: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("reviews_product_idx").on(t.productId, t.status), index("reviews_user_idx").on(t.userId)],
);

export const wishlistItems = mysqlTable(
  "wishlist_items",
  {
    id: int().autoincrement().primaryKey(),
    userId: int().notNull(),
    productId: int().notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("wishlist_user_product_uq").on(t.userId, t.productId)],
);

export type ReplacementItem = { orderItemId: number; quantity: number };

export const replacementRequests = mysqlTable(
  "replacement_requests",
  {
    id: int().autoincrement().primaryKey(),
    orderId: int().notNull(),
    userId: int(),
    items: json().$type<ReplacementItem[]>().notNull(),
    reason: mysqlEnum(["damaged", "leaked", "wrong_item", "missing_item", "other"]).notNull(),
    details: text().notNull(),
    photos: json().$type<string[]>().notNull(),
    videoUrl: varchar({ length: 500 }),
    status: mysqlEnum(["requested", "approved", "rejected", "completed"]).notNull().default("requested"),
    adminNote: varchar({ length: 500 }),
    replacementOrderId: int(),
    decidedBy: int(),
    decidedAt: timestamp({ mode: "date" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("replacements_order_idx").on(t.orderId), index("replacements_status_idx").on(t.status)],
);

export const contactMessages = mysqlTable(
  "contact_messages",
  {
    id: int().autoincrement().primaryKey(),
    name: varchar({ length: 120 }).notNull(),
    email: varchar({ length: 191 }).notNull(),
    phone: varchar({ length: 20 }),
    orderNumber: varchar({ length: 20 }),
    subject: varchar({ length: 160 }).notNull(),
    message: text().notNull(),
    status: mysqlEnum(["new", "replied", "closed"]).notNull().default("new"),
    ip: varchar({ length: 64 }),
    createdAt: createdAt(),
  },
  (t) => [index("contact_status_idx").on(t.status, t.createdAt)],
);

/** Gap-free sequences (invoice numbers per financial year). */
export const counters = mysqlTable("counters", {
  key: varchar({ length: 40 }).primaryKey(),
  value: int().notNull().default(0),
});

export const settings = mysqlTable("settings", {
  key: varchar({ length: 80 }).primaryKey(),
  value: json().$type<unknown>().notNull(),
  updatedAt: updatedAt(),
});

/* -------------------------------- Relations -------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
}));

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
}));

export const replacementRelations = relations(replacementRequests, ({ one }) => ({
  order: one(orders, { fields: [replacementRequests.orderId], references: [orders.id] }),
}));

export const variantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  events: many(orderEvents),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

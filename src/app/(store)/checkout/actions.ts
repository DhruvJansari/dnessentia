"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addresses, db, orders } from "@/db";
import { orderEvent } from "@/lib/audit";
import { createCustomer, findUserByEmail, sendVerificationEmail } from "@/lib/auth/accounts";
import { createSession, getSessionUser, isStaff } from "@/lib/auth/session";
import { env, integrations } from "@/lib/env";
import { isValidOrderKey, orderAccessKey } from "@/lib/orders/access";
import { quoteCart, type CartLineInput } from "@/lib/orders/pricing";
import { createOrder, errorText, markOrderPaid, startRazorpayPayment, type OrderRow } from "@/lib/orders/service";
import { fetchPayment, verifyCheckoutSignature } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import { getSettings } from "@/lib/settings";
import { addressSchema, emailField, fieldErrors, passwordField, type FieldErrors } from "@/lib/validation";

const lineSchema = z.object({
  variantId: z.number().int().positive(),
  qty: z.number().int().min(1).max(20),
  selections: z.array(z.string().max(80)).max(10).optional(),
});
const linesSchema = z.array(lineSchema).min(1).max(50);
const paymentMethodSchema = z.enum(["razorpay", "cod"]);

export type QuoteSummary = {
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  total: number;
  couponCode: string | null;
  couponError: string | null;
  giftNote: string | null;
  errors: string[];
  freeShippingThreshold: number;
};

export async function quoteAction(input: { lines: CartLineInput[]; couponCode?: string; paymentMethod: "razorpay" | "cod" }): Promise<QuoteSummary> {
  const lines = linesSchema.safeParse(input.lines);
  const settings = await getSettings();
  const empty = {
    subtotal: 0, discount: 0, shippingFee: 0, codFee: 0, total: 0,
    couponCode: null, couponError: null, giftNote: null, errors: ["Your bag is empty."],
    freeShippingThreshold: settings.shipping.freeShippingThreshold,
  };
  if (!lines.success) return empty;
  const quote = await quoteCart(lines.data, {
    couponCode: input.couponCode,
    paymentMethod: paymentMethodSchema.catch("razorpay").parse(input.paymentMethod),
    settings,
  });
  return {
    subtotal: quote.subtotal,
    discount: quote.discount,
    shippingFee: quote.shippingFee,
    codFee: quote.codFee,
    total: quote.total,
    couponCode: quote.coupon?.code ?? null,
    couponError: quote.couponError,
    giftNote: quote.giftNote,
    errors: quote.errors,
    freeShippingThreshold: settings.shipping.freeShippingThreshold,
  };
}

export type RazorpayPayload = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  name: string;
  email: string;
  contact: string;
  orderNumber: string;
  key: string;
};

export type PlaceOrderResult =
  | { ok: true; redirectUrl: string; razorpay: RazorpayPayload | null }
  | { ok: false; error?: string; fieldErrors?: FieldErrors };

const checkoutSchema = z
  .object({
    email: emailField,
    firstName: z.string().trim().min(1, "Enter your first name").max(60),
    lastName: z.string().trim().min(1, "Enter your last name").max(60),
    address: addressSchema.omit({ name: true }),
    createAccount: z.boolean().default(false),
    password: z.string().optional(),
    saveAddress: z.boolean().default(false),
    note: z.string().trim().max(500).optional(),
    couponCode: z.string().trim().max(40).optional(),
    paymentMethod: paymentMethodSchema,
    lines: linesSchema,
  })
  .superRefine((d, ctx) => {
    if (d.createAccount) {
      const r = passwordField.safeParse(d.password ?? "");
      if (!r.success) ctx.addIssue({ code: "custom", path: ["password"], message: r.error.issues[0].message });
    }
  });

export type CheckoutPayload = z.input<typeof checkoutSchema>;

export async function placeOrderAction(payload: CheckoutPayload): Promise<PlaceOrderResult> {
  try {
    return await placeOrder(payload);
  } catch (err) {
    console.error("[checkout] placeOrder failed", err);
    return { ok: false, error: "We couldn't place your order due to a server error. Please try again, or contact us on WhatsApp." };
  }
}

async function placeOrder(payload: CheckoutPayload): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const { ip } = await requestMeta();
  if (!rateLimit(`checkout:${ip}`, 15, 10 * 60e3)) return { ok: false, error: "Too many attempts. Please wait a few minutes." };

  const settings = await getSettings();
  if (data.paymentMethod === "cod" && !settings.payments.codEnabled) {
    return { ok: false, error: "Cash on Delivery isn't available right now." };
  }
  if (data.paymentMethod === "razorpay" && (!settings.payments.razorpayEnabled || !integrations.razorpay())) {
    return { ok: false, error: "Online payment isn't set up yet. Please try again later or contact us on WhatsApp." };
  }

  const quote = await quoteCart(data.lines, { couponCode: data.couponCode, paymentMethod: data.paymentMethod, settings });
  if (quote.errors.length) return { ok: false, error: quote.errors[0] };
  if (data.couponCode && quote.couponError) return { ok: false, fieldErrors: { couponCode: quote.couponError }, error: quote.couponError };

  const customerName = `${data.firstName} ${data.lastName}`.trim();
  const user = await getSessionUser();
  let userId = user?.id ?? null;
  const email = user ? user.email : data.email;

  if (!user && data.createAccount) {
    if (await findUserByEmail(data.email)) {
      return {
        ok: false,
        fieldErrors: { email: "An account with this email already exists. Log in, or untick “Create an account”." },
      };
    }
    userId = await createCustomer({ email: data.email, name: customerName, phone: data.address.phone, password: data.password! });
    await createSession(userId);
    await sendVerificationEmail({ id: userId, email: data.email, name: customerName });
  }

  if (userId && data.saveAddress) {
    const existing = await db.query.addresses.findFirst({
      where: and(eq(addresses.userId, userId), eq(addresses.line1, data.address.line1), eq(addresses.pincode, data.address.pincode)),
    });
    if (!existing) {
      const count = (await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, userId))).length;
      await db.insert(addresses).values({ userId, name: customerName, ...data.address, isDefault: count === 0 });
    }
  }

  const order = await createOrder({
    quote,
    userId,
    email,
    phone: data.address.phone,
    customerName,
    address: data.address,
    paymentMethod: data.paymentMethod,
    customerNote: data.note,
    ip,
  });
  const key = orderAccessKey(order.orderNumber);
  const redirectUrl = `/order/${order.orderNumber}?key=${key}`;

  if (data.paymentMethod === "cod") return { ok: true, redirectUrl, razorpay: null };

  try {
    const rzp = await startRazorpayPayment(order);
    return { ok: true, redirectUrl, razorpay: razorpayPayload(order, rzp.id, key) };
  } catch (err) {
    await orderEvent({ orderId: order.id, type: "payment", message: `Could not start Razorpay: ${errorText(err)}`, isInternal: true });
    return { ok: false, error: "We couldn't start the payment. Please try again in a moment." };
  }
}

function razorpayPayload(order: OrderRow, razorpayOrderId: string, key: string): RazorpayPayload {
  return {
    keyId: env.razorpay.keyId,
    razorpayOrderId,
    amount: order.total * 100,
    name: order.customerName,
    email: order.email,
    contact: order.phone,
    orderNumber: order.orderNumber,
    key,
  };
}

/** Loads an order the caller is allowed to see: via the signed link, as its owner, or as staff. */
async function authorisedOrder(orderNumber: string, key: string | null | undefined) {
  const order = await db.query.orders.findFirst({ where: eq(orders.orderNumber, orderNumber) });
  if (!order) return null;
  if (isValidOrderKey(orderNumber, key)) return order;
  const user = await getSessionUser();
  if (user && (user.id === order.userId || isStaff(user))) return order;
  return null;
}

export async function confirmPaymentAction(input: {
  orderNumber: string;
  key: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): Promise<{ ok: boolean; error?: string }> {
  const order = await authorisedOrder(input.orderNumber, input.key);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.razorpayOrderId !== input.razorpayOrderId || !verifyCheckoutSignature(input.razorpayOrderId, input.razorpayPaymentId, input.signature)) {
    await orderEvent({ orderId: order.id, type: "payment", message: "Rejected a payment confirmation with an invalid signature", isInternal: true });
    return { ok: false, error: "We couldn't verify this payment. If money was deducted, contact us with your order number." };
  }
  const payment = await fetchPayment(input.razorpayPaymentId).catch(() => null);
  await markOrderPaid(
    order.id,
    {
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      method: payment?.method ?? null,
      raw: payment ? (payment as unknown as Record<string, unknown>) : undefined,
    },
    { type: "customer", id: order.userId },
  );
  return { ok: true };
}

export async function paymentFailedAction(input: { orderNumber: string; key: string; reason: string }) {
  const order = await authorisedOrder(input.orderNumber, input.key);
  if (!order || order.paymentStatus === "paid") return;
  await orderEvent({
    orderId: order.id,
    type: "payment",
    message: `Payment attempt failed: ${input.reason || "unknown reason"}`.slice(0, 500),
    actorType: "customer",
  });
}

export async function retryPaymentAction(input: { orderNumber: string; key: string }): Promise<{ ok: true; razorpay: RazorpayPayload } | { ok: false; error: string }> {
  const order = await authorisedOrder(input.orderNumber, input.key);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.paymentMethod !== "razorpay" || order.paymentStatus === "paid" || order.status !== "pending") {
    return { ok: false, error: "This order doesn't need a payment." };
  }
  if (!integrations.razorpay()) return { ok: false, error: "Online payment isn't set up yet." };
  try {
    const rzp = await startRazorpayPayment(order);
    return { ok: true, razorpay: razorpayPayload(order, rzp.id, orderAccessKey(order.orderNumber)) };
  } catch (err) {
    return { ok: false, error: errorText(err) };
  }
}

const trackSchema = z.object({ orderNumber: z.string().trim().toUpperCase().regex(/^DN\d+$/, "Order numbers look like DN10023"), email: emailField });

export async function trackOrderAction(_: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const parsed = trackSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { ip } = await requestMeta();
  if (!rateLimit(`track:${ip}`, 10, 10 * 60e3)) return { error: "Too many lookups. Please wait a few minutes." };
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.orderNumber, parsed.data.orderNumber), eq(orders.email, parsed.data.email)),
  });
  if (!order) return { error: "We couldn't find an order with that number and email." };
  redirect(`/order/${order.orderNumber}?key=${orderAccessKey(order.orderNumber)}`);
}

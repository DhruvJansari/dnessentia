"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db, orderItems, orders, products, reviews } from "@/db";
import { getSessionUser } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, type FormState } from "@/lib/validation";

const schema = z.object({
  productId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1, "Choose a star rating").max(5),
  title: z.string().trim().max(160).optional().default(""),
  body: z.string().trim().min(10, "Write at least 10 characters").max(2000),
});

/**
 * One review per customer per product (a second submission updates the first).
 * Customers with a delivered order of the product are marked "Verified buyer" and published right away;
 * other reviews wait for approval in Admin → Reviews.
 */
export async function submitReviewAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Please log in to write a review." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (!rateLimit(`review:${user.id}`, 10, 60 * 60e3)) return { error: "You've written a lot of reviews recently. Try again later." };

  const product = await db.query.products.findFirst({ where: eq(products.id, parsed.data.productId), columns: { id: true } });
  if (!product) return { error: "Product not found." };

  const bought = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(orders.userId, user.id), eq(orders.status, "delivered"), eq(orderItems.productId, product.id)))
    .limit(1);
  const verified = bought.length > 0;
  const values = {
    productId: product.id,
    userId: user.id,
    name: user.name || user.email.split("@")[0],
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
    verifiedPurchase: verified,
    status: verified ? ("approved" as const) : ("pending" as const),
  };

  const existing = await db.query.reviews.findFirst({ where: and(eq(reviews.userId, user.id), eq(reviews.productId, product.id)) });
  if (existing) await db.update(reviews).set(values).where(eq(reviews.id, existing.id));
  else await db.insert(reviews).values(values);
  if (verified) updateTag(CATALOG_TAG);

  return {
    ok: true,
    message: verified ? "Thank you! Your review is live." : "Thank you! Your review will appear once it's approved.",
  };
}

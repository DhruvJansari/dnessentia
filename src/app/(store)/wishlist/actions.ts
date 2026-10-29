"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db, wishlistItems } from "@/db";
import { getSessionUser } from "@/lib/auth/session";

/** Returns the saved wishlist for a signed-in customer (null when signed out), merging in ids saved while signed out. */
export async function syncWishlistAction(localIds: number[]): Promise<number[] | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const clean = [...new Set(localIds.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 100);
  if (clean.length) {
    await db
      .insert(wishlistItems)
      .values(clean.map((productId) => ({ userId: user.id, productId })))
      .onDuplicateKeyUpdate({ set: { productId: sql`${wishlistItems.productId}` } });
  }
  const rows = await db.select({ productId: wishlistItems.productId }).from(wishlistItems).where(eq(wishlistItems.userId, user.id));
  return rows.map((r) => r.productId);
}

export async function setWishlistAction(productId: number, saved: boolean) {
  const user = await getSessionUser();
  if (!user) return;
  if (saved) {
    await db.insert(wishlistItems).values({ userId: user.id, productId }).onDuplicateKeyUpdate({ set: { productId } });
  } else {
    await db.delete(wishlistItems).where(and(eq(wishlistItems.userId, user.id), inArray(wishlistItems.productId, [productId])));
  }
}

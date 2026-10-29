"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { db, reviews } from "@/db";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog";

export async function moderateReviewAction(id: number, status: "approved" | "rejected") {
  const actor = await requireStaff();
  const r = await db.query.reviews.findFirst({ where: eq(reviews.id, id) });
  if (!r) return;
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  await audit({ actor, action: `review.${status}`, entityType: "review", entityId: id, summary: `${status === "approved" ? "Published" : "Rejected"} ${r.rating}★ review by ${r.name}` });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/reviews");
}

export async function replyReviewAction(id: number, reply: string) {
  const actor = await requireStaff();
  await db.update(reviews).set({ adminReply: reply.trim().slice(0, 1000) || null }).where(eq(reviews.id, id));
  await audit({ actor, action: "review.reply", entityType: "review", entityId: id, summary: reply.trim() ? "Replied to a review" : "Removed a review reply" });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/reviews");
}

export async function deleteReviewAction(id: number) {
  const actor = await requireStaff();
  const r = await db.query.reviews.findFirst({ where: eq(reviews.id, id) });
  if (!r) return;
  await db.delete(reviews).where(eq(reviews.id, id));
  await audit({ actor, action: "review.delete", entityType: "review", entityId: id, summary: `Deleted ${r.rating}★ review by ${r.name}`, changes: { body: r.body } });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/reviews");
}

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { coupons, db } from "@/db";
import { audit, diff } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { fieldErrors, type FormState } from "@/lib/validation";

const couponSchema = z
  .object({
    id: z.coerce.number().int().optional(),
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,40}$/, "3-40 letters, numbers, - or _"),
    description: z.string().trim().max(255),
    type: z.enum(["percent", "fixed", "free_gift"]),
    value: z.coerce.number().int().min(0),
    minOrder: z.coerce.number().int().min(0),
    maxUses: z.union([z.literal(""), z.coerce.number().int().min(1)]).transform((v) => (v === "" ? null : v)),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    isActive: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  })
  .refine((c) => c.type !== "percent" || (c.value > 0 && c.value <= 100), { path: ["value"], message: "Percent must be 1 to 100" })
  .refine((c) => c.type !== "fixed" || c.value > 0, { path: ["value"], message: "Enter the rupee amount" });

const toDate = (s?: string) => (s ? new Date(`${s}T00:00:00+05:30`) : null);

export async function saveCouponAction(_: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireAdmin();
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { id, startsAt, endsAt, ...data } = parsed.data;
  const values = { ...data, startsAt: toDate(startsAt), endsAt: toDate(endsAt) };

  const clash = await db.query.coupons.findFirst({ where: eq(coupons.code, data.code) });
  if (clash && clash.id !== id) return { fieldErrors: { code: "This code already exists" } };

  if (id) {
    const before = await db.query.coupons.findFirst({ where: eq(coupons.id, id) });
    await db.update(coupons).set(values).where(eq(coupons.id, id));
    await audit({ actor, action: "coupon.update", entityType: "coupon", entityId: id, summary: `Updated coupon ${data.code}`, changes: before ? diff(before as unknown as Record<string, unknown>, values) : undefined });
  } else {
    const [res] = await db.insert(coupons).values(values);
    await audit({ actor, action: "coupon.create", entityType: "coupon", entityId: res.insertId, summary: `Created coupon ${data.code}` });
  }
  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon ${data.code} saved.` };
}

export async function toggleCouponAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = Number(formData.get("id"));
  const c = await db.query.coupons.findFirst({ where: eq(coupons.id, id) });
  if (!c) return;
  await db.update(coupons).set({ isActive: !c.isActive }).where(eq(coupons.id, id));
  await audit({ actor, action: "coupon.toggle", entityType: "coupon", entityId: id, summary: `${c.isActive ? "Paused" : "Activated"} coupon ${c.code}` });
  revalidatePath("/admin/coupons");
}

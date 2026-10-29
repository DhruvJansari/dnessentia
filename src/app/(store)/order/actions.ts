"use server";

import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, orders } from "@/db";
import { getSessionUser, isStaff } from "@/lib/auth/session";
import { isValidOrderKey } from "@/lib/orders/access";
import { cancelByCustomer, createReplacementRequest } from "@/lib/orders/after-sales";
import { errorText } from "@/lib/orders/service";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";

async function ownedOrder(orderNumber: string, key: string | null | undefined) {
  const order = await db.query.orders.findFirst({ where: eq(orders.orderNumber, orderNumber) });
  if (!order) return null;
  const user = await getSessionUser();
  if (isValidOrderKey(orderNumber, key) || (user && (user.id === order.userId || isStaff(user)))) return { order, user };
  return null;
}

export async function cancelOrderAction(input: { orderNumber: string; key: string; reason: string }): Promise<{ ok: boolean; message: string }> {
  const found = await ownedOrder(input.orderNumber, input.key);
  if (!found) return { ok: false, message: "Order not found." };
  try {
    await cancelByCustomer(found.order.id, input.reason.trim().slice(0, 200), { type: "customer", id: found.user?.id ?? null });
    revalidatePath(`/order/${input.orderNumber}`);
    return { ok: true, message: "Your order has been cancelled." };
  } catch (err) {
    return { ok: false, message: errorText(err) };
  }
}

const MAX_PHOTO = 5 * 1024 * 1024;
const EXT: Record<string, string> = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };

const replacementSchema = z.object({
  orderNumber: z.string(),
  key: z.string().optional(),
  reason: z.enum(["damaged", "leaked", "wrong_item", "missing_item", "other"]),
  details: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000),
  videoUrl: z.union([z.literal(""), z.url("Paste a valid link (Google Drive, WeTransfer, etc.)")]),
});

export async function requestReplacementAction(_: { ok?: boolean; message?: string }, formData: FormData): Promise<{ ok?: boolean; message?: string }> {
  const parsed = replacementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { ip } = await requestMeta();
  if (!rateLimit(`replacement:${ip}`, 5, 60 * 60e3)) return { ok: false, message: "Too many requests. Please try again later." };
  const found = await ownedOrder(parsed.data.orderNumber, parsed.data.key);
  if (!found) return { ok: false, message: "Order not found." };

  const items = formData
    .getAll("item")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0)
    .map((orderItemId) => ({ orderItemId, quantity: Math.max(1, Number(formData.get(`qty-${orderItemId}`) ?? 1)) }));

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3);
  const photos: string[] = [];
  for (const file of files) {
    const ext = EXT[file.type];
    if (!ext) return { ok: false, message: "Photos must be PNG, JPG or WebP." };
    if (file.size > MAX_PHOTO) return { ok: false, message: "Each photo must be under 5 MB." };
  }
  if (!parsed.data.videoUrl && files.length === 0) {
    return { ok: false, message: "Please add photos or a link to your unboxing video. Without it we can't process the request." };
  }
  const dir = path.join(process.cwd(), "storage", "uploads", "replacements");
  await mkdir(dir, { recursive: true });
  for (const file of files) {
    const name = `${found.order.orderNumber}-${randomBytes(4).toString("hex")}${EXT[file.type]}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    photos.push(`/media/replacements/${name}`);
  }

  try {
    await createReplacementRequest({
      orderId: found.order.id,
      userId: found.user?.id ?? null,
      items,
      reason: parsed.data.reason,
      details: parsed.data.details,
      photos,
      videoUrl: parsed.data.videoUrl || null,
    });
  } catch (err) {
    return { ok: false, message: errorText(err) };
  }
  revalidatePath(`/order/${found.order.orderNumber}`);
  return { ok: true, message: "Request received. We'll review it within 1-2 business days and email you." };
}

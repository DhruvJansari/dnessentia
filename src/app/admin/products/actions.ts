"use server";

import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { db, orderItems, products, productVariants } from "@/db";
import { audit, diff } from "@/lib/audit";
import { requireStaff } from "@/lib/auth/session";
import { CATALOG_TAG } from "@/lib/catalog";
import { fieldErrors, type FieldErrors } from "@/lib/validation";

const list = z.array(z.string().trim().min(1).max(200)).max(30);

const variantSchema = z.object({
  id: z.number().int().positive().optional(),
  label: z.string().trim().min(1, "Label required").max(60),
  sku: z.string().trim().min(2, "SKU required").max(60).toUpperCase(),
  price: z.number().int().min(1, "Price must be at least ₹1"),
  compareAtPrice: z.number().int().min(0).nullable(),
  stock: z.number().int().min(0),
  weightGrams: z.number().int().min(1).max(20000),
  isActive: z.boolean(),
});

const productSchema = z
  .object({
    id: z.number().int().positive().optional(),
    type: z.enum(["attar", "combo"]),
    name: z.string().trim().min(2, "Name required").max(160),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
    character: z.string().trim().max(160),
    bestFor: z.string().trim().max(255),
    about: z.string().trim().min(10, "Write a short description").max(5000),
    notes: z.object({ top: list, heart: list, base: list }),
    categories: list,
    images: z.array(z.string().max(255)).min(1, "Add at least one image").max(10),
    pickCount: z.number().int().min(1).max(7).nullable(),
    sizeMl: z.number().int().min(1).max(100).nullable(),
    includes: list,
    perfectFor: list,
    howToUse: z.string().trim().max(2000),
    whyChoose: list,
    isActive: z.boolean(),
    isBestSeller: z.boolean(),
    sortOrder: z.number().int(),
    seoTitle: z.string().trim().max(160),
    seoDescription: z.string().trim().max(320),
    variants: z.array(variantSchema).min(1, "Add at least one variant").max(10),
  })
  .superRefine((p, ctx) => {
    if (p.type === "combo" && (!p.pickCount || !p.sizeMl)) {
      ctx.addIssue({ code: "custom", path: ["pickCount"], message: "Combos need how many attars and the size of each" });
    }
    const skus = p.variants.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) ctx.addIssue({ code: "custom", path: ["variants"], message: "Each variant needs a unique SKU" });
  });

export type ProductInput = z.input<typeof productSchema>;
export type SaveResult = { ok: boolean; message: string; id?: number; fieldErrors?: FieldErrors };

export async function saveProductAction(input: ProductInput): Promise<SaveResult> {
  const user = await requireStaff();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const { variants, id, ...data } = parsed.data;

  const slugOwner = await db.query.products.findFirst({ where: eq(products.slug, data.slug) });
  if (slugOwner && slugOwner.id !== id) return { ok: false, message: "That URL slug is already used.", fieldErrors: { slug: "Already used by another product" } };
  const skuOwners = await db.select({ id: productVariants.id, sku: productVariants.sku }).from(productVariants).where(inArray(productVariants.sku, variants.map((v) => v.sku)));
  const ownVariantIds = new Set(variants.map((v) => v.id).filter(Boolean));
  const clash = skuOwners.find((s) => !ownVariantIds.has(s.id));
  if (clash) return { ok: false, message: `SKU ${clash.sku} is already used by another product.` };

  const values = {
    ...data,
    notes: data.type === "attar" ? data.notes : null,
    pickCount: data.type === "combo" ? data.pickCount : null,
    sizeMl: data.type === "combo" ? data.sizeMl : null,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
  };

  let productId = id;
  if (id) {
    const before = await db.query.products.findFirst({ where: eq(products.id, id), with: { variants: true } });
    if (!before) return { ok: false, message: "Product not found." };
    await db.update(products).set(values).where(eq(products.id, id));
    const changes: Record<string, unknown> = diff(before as unknown as Record<string, unknown>, values);
    for (const v of variants) {
      const old = before.variants.find((b) => b.id === v.id);
      if (old) {
        const vd = diff(old as unknown as Record<string, unknown>, v);
        if (Object.keys(vd).length) changes[`variant ${old.label}`] = vd;
      }
    }
    await syncVariants(id, variants);
    await audit({ actor: user, action: "product.update", entityType: "product", entityId: id, summary: `Updated ${data.name}`, changes });
  } else {
    const [res] = await db.insert(products).values(values);
    productId = res.insertId;
    await syncVariants(productId, variants);
    await audit({ actor: user, action: "product.create", entityType: "product", entityId: productId, summary: `Created ${data.name}` });
  }

  updateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
  return { ok: true, message: "Saved. The store is updated.", id: productId };
}

/** Updates/creates variants; removed ones are deleted, or hidden if past orders reference them. */
async function syncVariants(productId: number, variants: z.infer<typeof variantSchema>[]) {
  const keepIds: number[] = [];
  for (const [i, v] of variants.entries()) {
    const row = { label: v.label, sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, stock: v.stock, weightGrams: v.weightGrams, isActive: v.isActive, sortOrder: i };
    if (v.id) {
      await db.update(productVariants).set(row).where(and(eq(productVariants.id, v.id), eq(productVariants.productId, productId)));
      keepIds.push(v.id);
    } else {
      const [res] = await db.insert(productVariants).values({ ...row, productId });
      keepIds.push(res.insertId);
    }
  }
  const removed = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(and(eq(productVariants.productId, productId), notInArray(productVariants.id, keepIds)));
  for (const r of removed) {
    const used = await db.query.orderItems.findFirst({ where: eq(orderItems.variantId, r.id), columns: { id: true } });
    if (used) await db.update(productVariants).set({ isActive: false }).where(eq(productVariants.id, r.id));
    else await db.delete(productVariants).where(eq(productVariants.id, r.id));
  }
}

export async function setProductActiveAction(id: number, isActive: boolean) {
  const user = await requireStaff();
  const p = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!p) return;
  await db.update(products).set({ isActive }).where(eq(products.id, id));
  await audit({ actor: user, action: isActive ? "product.publish" : "product.hide", entityType: "product", entityId: id, summary: `${isActive ? "Published" : "Hid"} ${p.name}` });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
}

const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };

export async function uploadImageAction(formData: FormData): Promise<{ ok: boolean; url?: string; message?: string }> {
  const user = await requireStaff();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image." };
  const ext = EXT[file.type];
  if (!ext) return { ok: false, message: "Use a PNG, JPG or WebP image." };
  if (file.size > MAX_BYTES) return { ok: false, message: "Images must be under 5 MB." };
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "storage", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  await audit({ actor: user, action: "media.upload", entityType: "media", entityId: name, summary: `Uploaded image ${file.name}` });
  return { ok: true, url: `/media/products/${name}` };
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { saveProductAction, uploadImageAction, type ProductInput } from "@/app/admin/products/actions";
import { CloseIcon, PlusIcon } from "../icons";
import { Spinner } from "../ui/form";
import { btn, Card, input } from "./ui";

type Variant = ProductInput["variants"][number];

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const commas = (s: string) => s.split(",").map((l) => l.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Label({ children, hint, error }: { children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <span className="mb-1.5 block text-[13px] font-medium text-stone-700">
      {children}
      {hint && <span className="ml-1 font-normal text-stone-400">{hint}</span>}
      {error && <span className="ml-2 font-normal text-red-700">{error}</span>}
    </span>
  );
}

export function ProductEditor({ initial }: { initial: ProductInput }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [notesText, setNotesText] = useState({
    top: initial.notes.top.join(", "),
    heart: initial.notes.heart.join(", "),
    base: initial.notes.base.join(", "),
  });
  const [listText, setListText] = useState({
    includes: initial.includes.join("\n"),
    perfectFor: initial.perfectFor.join("\n"),
    whyChoose: initial.whyChoose.join("\n"),
  });
  const [categoriesText, setCategoriesText] = useState(initial.categories.join(", "));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !initial.id;

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setP((prev) => ({ ...prev, [k]: v }));
  const setVariant = (i: number, patch: Partial<Variant>) =>
    setP((prev) => ({ ...prev, variants: prev.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImageAction(fd);
      if (res.ok && res.url) setP((prev) => ({ ...prev, images: [...prev.images, res.url!] }));
      else setMessage({ ok: false, text: res.message ?? "Upload failed" });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function save() {
    setMessage(null);
    setErrors({});
    const payload: ProductInput = {
      ...p,
      notes: { top: commas(notesText.top), heart: commas(notesText.heart), base: commas(notesText.base) },
      categories: commas(categoriesText),
      includes: lines(listText.includes),
      perfectFor: lines(listText.perfectFor),
      whyChoose: lines(listText.whyChoose),
    };
    startSave(async () => {
      const res = await saveProductAction(payload);
      setMessage({ ok: res.ok, text: res.message });
      setErrors(res.fieldErrors ?? {});
      if (res.ok && isNew && res.id) router.replace(`/admin/products/${res.id}`);
      else if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <Label error={errors.name}>Name</Label>
                <input
                  className={input}
                  value={p.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setP((prev) => ({ ...prev, name, slug: isNew && (!prev.slug || prev.slug === slugify(prev.name)) ? slugify(name) : prev.slug }));
                  }}
                />
              </label>
              <label>
                <Label hint="dnessentia.com/product/…" error={errors.slug}>URL slug</Label>
                <input className={input} value={p.slug} onChange={(e) => set("slug", e.target.value)} />
              </label>
              <label>
                <Label hint="lower shows first">Sort order</Label>
                <input type="number" className={input} value={p.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
              </label>
              {p.type === "attar" && (
                <>
                  <label>
                    <Label hint="e.g. Bold • Elegant • Timeless">Character</Label>
                    <input className={input} value={p.character} onChange={(e) => set("character", e.target.value)} />
                  </label>
                  <label>
                    <Label>Best for</Label>
                    <input className={input} value={p.bestFor} onChange={(e) => set("bestFor", e.target.value)} />
                  </label>
                </>
              )}
              <label className="sm:col-span-2">
                <Label error={errors.about}>Description</Label>
                <textarea className={`${input} h-auto py-2`} rows={5} value={p.about} onChange={(e) => set("about", e.target.value)} />
              </label>
              <label className="sm:col-span-2">
                <Label hint="comma separated, e.g. Men, Women, Oud, Fresh">Categories / filters</Label>
                <input className={input} value={categoriesText} onChange={(e) => setCategoriesText(e.target.value)} />
              </label>
            </div>
          </Card>

          {p.type === "attar" ? (
            <Card title="Fragrance notes">
              <div className="grid gap-4 sm:grid-cols-3">
                {(["top", "heart", "base"] as const).map((k) => (
                  <label key={k}>
                    <Label hint="comma separated">{k[0].toUpperCase() + k.slice(1)} notes</Label>
                    <input className={input} value={notesText[k]} onChange={(e) => setNotesText((n) => ({ ...n, [k]: e.target.value }))} />
                  </label>
                ))}
              </div>
            </Card>
          ) : (
            <Card title="Combo pack">
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <Label hint="7 = all attars included" error={errors.pickCount}>Attars the customer picks</Label>
                  <input type="number" min={1} max={7} className={input} value={p.pickCount ?? ""} onChange={(e) => set("pickCount", e.target.value ? Number(e.target.value) : null)} />
                </label>
                <label>
                  <Label>Size of each (ml)</Label>
                  <input type="number" min={1} className={input} value={p.sizeMl ?? ""} onChange={(e) => set("sizeMl", e.target.value ? Number(e.target.value) : null)} />
                </label>
                {(["includes", "perfectFor", "whyChoose"] as const).map((k) => (
                  <label key={k} className="sm:col-span-2">
                    <Label hint="one per line">{k === "includes" ? "What's in the box" : k === "perfectFor" ? "Perfect for" : "Why choose"}</Label>
                    <textarea className={`${input} h-auto py-2`} rows={4} value={listText[k]} onChange={(e) => setListText((t) => ({ ...t, [k]: e.target.value }))} />
                  </label>
                ))}
                <label className="sm:col-span-2">
                  <Label>How to use</Label>
                  <textarea className={`${input} h-auto py-2`} rows={3} value={p.howToUse} onChange={(e) => set("howToUse", e.target.value)} />
                </label>
              </div>
            </Card>
          )}

          <Card
            title="Variants, prices & stock"
            actions={
              <button
                type="button"
                onClick={() =>
                  set("variants", [
                    ...p.variants,
                    { label: "", sku: `${p.slug.toUpperCase()}-${p.variants.length + 1}`, price: 0, compareAtPrice: null, stock: 0, weightGrams: 50, isActive: true },
                  ])
                }
                className={btn.ghost}
              >
                <PlusIcon className="size-4" /> Add variant
              </button>
            }
          >
            {errors.variants && <p className="mb-3 text-sm text-red-700">{errors.variants}</p>}
            <div className="space-y-3">
              {p.variants.map((v, i) => (
                <div key={v.id ?? `new-${i}`} className="grid grid-cols-2 gap-3 rounded-xl border border-stone-200 p-3 sm:grid-cols-[1fr_1.4fr_0.9fr_0.9fr_0.8fr_0.8fr_auto] sm:items-end">
                  <label>
                    <Label error={errors[`variants.${i}.label`]}>Label</Label>
                    <input className={input} value={v.label} placeholder="3 ml" onChange={(e) => setVariant(i, { label: e.target.value })} />
                  </label>
                  <label>
                    <Label error={errors[`variants.${i}.sku`]}>SKU</Label>
                    <input className={`${input} font-mono text-[12px]`} value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} />
                  </label>
                  <label>
                    <Label error={errors[`variants.${i}.price`]}>Price ₹</Label>
                    <input type="number" min={0} className={input} value={v.price} onChange={(e) => setVariant(i, { price: Number(e.target.value) })} />
                  </label>
                  <label>
                    <Label hint="MRP">Was ₹</Label>
                    <input type="number" min={0} className={input} value={v.compareAtPrice ?? ""} onChange={(e) => setVariant(i, { compareAtPrice: e.target.value ? Number(e.target.value) : null })} />
                  </label>
                  <label>
                    <Label>Stock</Label>
                    <input type="number" min={0} className={input} value={v.stock} onChange={(e) => setVariant(i, { stock: Number(e.target.value) })} />
                  </label>
                  <label>
                    <Label hint="g">Weight</Label>
                    <input type="number" min={1} className={input} value={v.weightGrams} onChange={(e) => setVariant(i, { weightGrams: Number(e.target.value) })} />
                  </label>
                  <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:h-10">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={v.isActive} onChange={(e) => setVariant(i, { isActive: e.target.checked })} className="size-4 accent-stone-900" />
                      On sale
                    </label>
                    {p.variants.length > 1 && (
                      <button type="button" onClick={() => set("variants", p.variants.filter((_, j) => j !== i))} aria-label="Remove variant" className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-700">
                        <CloseIcon className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <label className="flex items-center justify-between gap-3 text-sm">
              Visible on store
              <input type="checkbox" checked={p.isActive} onChange={(e) => set("isActive", e.target.checked)} className="size-5 accent-stone-900" />
            </label>
            {p.type === "attar" && (
              <label className="mt-3 flex items-center justify-between gap-3 text-sm">
                Show in Best Sellers
                <input type="checkbox" checked={p.isBestSeller} onChange={(e) => set("isBestSeller", e.target.checked)} className="size-5 accent-stone-900" />
              </label>
            )}
            {!isNew && (
              <Link href={`/product/${initial.slug}`} target="_blank" className="mt-4 inline-block text-sm underline underline-offset-4">
                View on store
              </Link>
            )}
          </Card>

          <Card title="Images" actions={<span className="text-[12px] text-stone-500">First image is the main one</span>}>
            {errors.images && <p className="mb-3 text-sm text-red-700">{errors.images}</p>}
            <ul className="grid grid-cols-3 gap-2">
              {p.images.map((src, i) => (
                <li key={src + i} className="group relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                  <Image src={src} alt="" fill sizes="110px" className="object-contain" />
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" disabled={i === 0} onClick={() => set("images", [src, ...p.images.filter((_, j) => j !== i)])} className="px-1 text-[11px] disabled:opacity-30">
                      Main
                    </button>
                    <button type="button" onClick={() => set("images", p.images.filter((_, j) => j !== i))} className="px-1 text-[11px] text-red-700">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid aspect-square w-full place-items-center rounded-lg border border-dashed border-stone-300 text-stone-500 transition-colors hover:border-stone-500 hover:text-stone-800"
                >
                  {uploading ? <Spinner /> : <PlusIcon className="size-5" />}
                </button>
              </li>
            </ul>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
            <p className="mt-2 text-[12px] text-stone-500">PNG, JPG or WebP, up to 5 MB. Square or 4:5 photos on white look best.</p>
          </Card>

          <Card title="Search engines">
            <label>
              <Label hint="optional">SEO title</Label>
              <input className={input} value={p.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
            </label>
            <label className="mt-3 block">
              <Label hint="optional">SEO description</Label>
              <textarea className={`${input} h-auto py-2`} rows={3} value={p.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
            </label>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <p className={`text-sm ${message ? (message.ok ? "text-emerald-700" : "text-red-700") : "text-stone-500"}`} role="status">
            {message?.text ?? (isNew ? "New product, not saved yet." : "Edits are saved when you click Save.")}
          </p>
          <div className="flex gap-2">
            <Link href="/admin/products" className={btn.secondary}>
              Back
            </Link>
            <button type="button" onClick={save} disabled={saving || uploading} className={btn.primary}>
              {saving && <Spinner />} {isNew ? "Create product" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

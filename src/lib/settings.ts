import "server-only";
import { inArray } from "drizzle-orm";
import { db, settings } from "@/db";
import { defaultSettings, type SettingsKey, type StoreSettings } from "./settings-defaults";

/** All settings, with defaults filled in for anything missing from the database. */
export async function getSettings(): Promise<StoreSettings> {
  const rows = await db.select().from(settings).where(inArray(settings.key, Object.keys(defaultSettings)));
  const merged = structuredClone(defaultSettings) as Record<string, Record<string, unknown>>;
  for (const row of rows) {
    if (row.value && typeof row.value === "object") {
      merged[row.key] = { ...merged[row.key], ...(row.value as Record<string, unknown>) };
    }
  }
  return merged as StoreSettings;
}

export async function saveSetting<K extends SettingsKey>(key: K, value: StoreSettings[K]) {
  await db.insert(settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}

/** Internal key/value storage that isn't user-editable (e.g. the cached Shiprocket token). */
export async function getInternal<T>(key: string): Promise<T | null> {
  const row = await db.query.settings.findFirst({ where: (s, { eq }) => eq(s.key, key) });
  return (row?.value as T) ?? null;
}

export async function setInternal(key: string, value: unknown) {
  await db.insert(settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}

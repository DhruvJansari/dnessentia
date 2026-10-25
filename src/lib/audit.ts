import "server-only";
import { auditLogs, db, orderEvents } from "@/db";
import type { SessionUser } from "./auth/session";
import { requestMeta } from "./request";

type AuditInput = {
  actor: SessionUser | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  summary: string;
  changes?: Record<string, unknown>;
};

/** Records who did what in the admin. Shown under Admin → Activity. */
export async function audit({ actor, action, entityType, entityId, summary, changes }: AuditInput) {
  const { ip } = await requestMeta().catch(() => ({ ip: null }));
  await db.insert(auditLogs).values({
    actorId: actor?.id ?? null,
    actorEmail: actor?.email ?? null,
    action,
    entityType,
    entityId: entityId == null ? null : String(entityId),
    summary: summary.slice(0, 500),
    changes: changes ?? null,
    ip,
  });
}

type OrderEventInput = {
  orderId: number;
  type: (typeof orderEvents.$inferInsert)["type"];
  message: string;
  data?: Record<string, unknown>;
  actorType?: (typeof orderEvents.$inferInsert)["actorType"];
  actorId?: number | null;
  isInternal?: boolean;
};

/** Appends to an order's timeline. */
export async function orderEvent({ orderId, type, message, data, actorType = "system", actorId, isInternal }: OrderEventInput) {
  await db.insert(orderEvents).values({
    orderId,
    type,
    message: message.slice(0, 500),
    data: data ?? null,
    actorType,
    actorId: actorId ?? null,
    isInternal: isInternal ?? false,
  });
}

/** Only keeps fields whose values actually changed, for compact audit diffs. */
export function diff<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const [k, v] of Object.entries(after)) {
    if (JSON.stringify(before[k]) !== JSON.stringify(v)) out[k] = { from: before[k], to: v };
  }
  return out;
}

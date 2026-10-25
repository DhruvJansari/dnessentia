import "server-only";
import type { orderItems, orders } from "@/db";
import { env } from "./env";
import { getInternal, setInternal } from "./settings";
import type { StoreSettings } from "./settings-defaults";

const API = "https://apiv2.shiprocket.in/v1/external";
const TOKEN_KEY = "internal.shiprocketToken";

type Order = typeof orders.$inferSelect;
type OrderItem = typeof orderItems.$inferSelect;

/** Shiprocket tokens last 10 days; we cache one in the settings table and refresh after 9. */
async function getToken(force = false) {
  if (!force) {
    const cached = await getInternal<{ token: string; expiresAt: number }>(TOKEN_KEY);
    if (cached && cached.expiresAt > Date.now()) return cached.token;
  }
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.shiprocket.email, password: env.shiprocket.password }),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.token) throw new Error(body?.message ?? `Shiprocket login failed (${res.status})`);
  await setInternal(TOKEN_KEY, { token: body.token, expiresAt: Date.now() + 9 * 864e5 });
  return body.token as string;
}

async function call<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  if (res.status === 401 && !retried) {
    await getToken(true);
    return call<T>(path, init, true);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.errors ? ` ${JSON.stringify(body.errors)}` : "";
    throw new Error(`${body?.message ?? `Shiprocket ${res.status}`}${detail}`);
  }
  return body as T;
}

export async function testShiprocket() {
  try {
    await getToken(true);
    return { ok: true, message: `Authenticated as ${env.shiprocket.email}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

function formatDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export type ShiprocketCreated = { order_id: number; shipment_id: number; status: string };

/** Creates the order in Shiprocket ("adhoc" order). */
export function createShiprocketOrder(order: Order, items: OrderItem[], fulfilment: StoreSettings["fulfilment"], weightGrams: number) {
  const [first, ...rest] = order.customerName.trim().split(/\s+/);
  return call<ShiprocketCreated>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id: order.orderNumber,
      order_date: formatDate(order.createdAt),
      pickup_location: env.shiprocket.pickupLocation,
      billing_customer_name: first,
      billing_last_name: rest.join(" ") || ".",
      billing_address: order.shipLine1,
      billing_address_2: order.shipLine2 ?? "",
      billing_city: order.shipCity,
      billing_pincode: order.shipPincode,
      billing_state: order.shipState,
      billing_country: "India",
      billing_email: order.email,
      billing_phone: order.phone.replace(/\D/g, "").slice(-10),
      shipping_is_billing: true,
      order_items: items.map((i) => ({
        name: `${i.name} ${i.variantLabel}`,
        sku: i.sku,
        units: i.quantity,
        selling_price: i.unitPrice,
        discount: 0,
        tax: 0,
        hsn: 3303,
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      shipping_charges: order.shippingFee,
      total_discount: order.discount,
      sub_total: order.total - order.shippingFee,
      length: fulfilment.packageLengthCm,
      breadth: fulfilment.packageBreadthCm,
      height: fulfilment.packageHeightCm,
      weight: Math.max(0.1, weightGrams / 1000),
    }),
  });
}

type AwbResponse = {
  awb_assign_status: number;
  response?: { data?: { awb_code?: string; courier_name?: string; shipment_id?: number } };
  message?: string;
};

/** Lets Shiprocket pick the recommended courier and assigns a tracking number. */
export async function assignAwb(shipmentId: string) {
  const res = await call<AwbResponse>("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: Number(shipmentId) }),
  });
  const data = res.response?.data;
  if (res.awb_assign_status !== 1 || !data?.awb_code) throw new Error(res.message ?? "Shiprocket could not assign an AWB");
  return { awbCode: data.awb_code, courierName: data.courier_name ?? null };
}

export function requestPickup(shipmentId: string) {
  return call<{ pickup_status: number }>("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
  });
}

export type TrackingActivity = { date: string; activity: string; location: string };
type TrackResponse = {
  tracking_data?: {
    shipment_status?: number;
    shipment_track?: { current_status?: string; delivered_date?: string | null }[];
    shipment_track_activities?: TrackingActivity[] | null;
    track_url?: string;
  };
};

export async function trackAwb(awb: string) {
  const res = await call<TrackResponse>(`/courier/track/awb/${encodeURIComponent(awb)}`);
  const data = res.tracking_data;
  return {
    currentStatus: data?.shipment_track?.[0]?.current_status ?? null,
    deliveredDate: data?.shipment_track?.[0]?.delivered_date ?? null,
    activities: data?.shipment_track_activities ?? [],
    trackUrl: data?.track_url ?? publicTrackingUrl(awb),
  };
}

export function cancelShiprocketOrder(shiprocketOrderId: string) {
  return call<unknown>("/orders/cancel", { method: "POST", body: JSON.stringify({ ids: [Number(shiprocketOrderId)] }) });
}

export function publicTrackingUrl(awb: string) {
  return `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
}

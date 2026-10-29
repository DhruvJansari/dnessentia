import "server-only";
import type { orderItems, orders } from "@/db";
import { env } from "./env";
import { getInternal, setInternal } from "./settings";
import type { StoreSettings } from "./settings-defaults";

const API = env.shiprocket.apiUrl;
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
  // Free-gift lines travel in the same box but aren't declared separately. Replacements are free re-shipments,
  // declared at the original item value and never collected as COD.
  const shipped = items.filter((i) => !i.isGift);
  const isReplacement = order.kind === "replacement";
  const declared = shipped.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
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
      order_items: shipped.map((i) => ({
        name: `${i.name} ${i.variantLabel}`,
        sku: i.sku,
        units: i.quantity,
        selling_price: i.unitPrice,
        discount: 0,
        tax: 0,
        hsn: 3303,
      })),
      payment_method: !isReplacement && order.paymentMethod === "cod" ? "COD" : "Prepaid",
      shipping_charges: isReplacement ? 0 : order.shippingFee,
      total_discount: isReplacement ? 0 : order.discount,
      sub_total: isReplacement ? declared : order.total - order.shippingFee,
      length: fulfilment.packageLengthCm,
      breadth: fulfilment.packageBreadthCm,
      height: fulfilment.packageHeightCm,
      weight: parcelWeightKg(weightGrams),
    }),
  });
}

type AwbResponse = {
  awb_assign_status: number;
  response?: { data?: { awb_code?: string; courier_name?: string; shipment_id?: number } };
  message?: string;
};

/** Books a courier and assigns a tracking number. Without courierId, Shiprocket picks its recommended courier. */
export async function assignAwb(shipmentId: string, courierId?: number) {
  const res = await call<AwbResponse>("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: Number(shipmentId), ...(courierId ? { courier_id: courierId } : {}) }),
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

/** Box and padding added on top of the products' own weight. */
export const PACKAGING_GRAMS = 100;

export function parcelWeightKg(productGrams: number) {
  return Math.max(0.1, Math.round((productGrams + PACKAGING_GRAMS) / 10) / 100);
}

export type CourierChoice = "cheapest" | "fastest" | "recommended";
export type CourierQuote = { id: number; name: string; rate: number; days: number | null; etd: string | null };
/** `courier` is the one picked by the store's courier choice; etd/days describe that courier. */
export type Serviceability = { serviceable: boolean; etd: string | null; days: number | null; codAvailable: boolean; courier: CourierQuote | null };
const serviceCache = new Map<string, { at: number; value: Serviceability }>();

type ServiceabilityResponse = {
  data?: {
    recommended_courier_company_id?: number;
    available_courier_companies?: {
      courier_company_id: number;
      courier_name: string;
      freight_charge?: number;
      rate?: number;
      etd?: string;
      estimated_delivery_days?: string | number;
      cod?: number;
    }[];
  };
};

function pickCourier(options: CourierQuote[], choice: CourierChoice, recommendedId?: number) {
  if (!options.length) return null;
  const byRate = (a: CourierQuote, b: CourierQuote) => a.rate - b.rate;
  const byDays = (a: CourierQuote, b: CourierQuote) => (a.days ?? 99) - (b.days ?? 99) || byRate(a, b);
  if (choice === "recommended") return options.find((o) => o.id === recommendedId) ?? [...options].sort(byRate)[0];
  return [...options].sort(choice === "fastest" ? byDays : (a, b) => byRate(a, b) || byDays(a, b))[0];
}

/**
 * Which couriers can deliver this parcel to this PIN code, at what freight rate, and by when.
 * Cached for 6 hours per PIN / weight / COD / choice, so checkout and "Create shipment" see the same courier.
 */
export async function checkServiceability(
  deliveryPincode: string,
  opts: { weightKg?: number; cod?: boolean; choice?: CourierChoice } = {},
): Promise<Serviceability> {
  const { weightKg = 0.2, cod = false, choice = "cheapest" } = opts;
  const key = `${deliveryPincode}:${weightKg}:${cod ? 1 : 0}:${choice}`;
  const hit = serviceCache.get(key);
  if (hit && Date.now() - hit.at < 6 * 3600e3) return hit.value;
  const q = new URLSearchParams({
    pickup_postcode: env.shiprocket.pickupPincode,
    delivery_postcode: deliveryPincode,
    weight: String(weightKg),
    cod: cod ? "1" : "0",
  });
  let value: Serviceability;
  try {
    const res = await call<ServiceabilityResponse>(`/courier/serviceability/?${q}`);
    const raw = res.data?.available_courier_companies ?? [];
    const options = raw
      .filter((o) => !cod || o.cod === 1)
      .map((o) => ({
        id: o.courier_company_id,
        name: o.courier_name,
        rate: Number(o.freight_charge ?? o.rate ?? 0),
        days: Number(o.estimated_delivery_days) || null,
        etd: o.etd ?? null,
      }));
    const courier = pickCourier(options, choice, res.data?.recommended_courier_company_id);
    value = {
      serviceable: options.length > 0,
      etd: courier?.etd ?? null,
      days: courier?.days ?? null,
      codAvailable: raw.some((o) => o.cod === 1),
      courier,
    };
  } catch (err) {
    // Shiprocket answers 404 for PIN codes it can't serve.
    if (err instanceof Error && /no courier|not serviceable|404/i.test(err.message)) {
      value = { serviceable: false, etd: null, days: null, codAvailable: false, courier: null };
    } else {
      throw err;
    }
  }
  serviceCache.set(key, { at: Date.now(), value });
  return value;
}

/** Courier shipping label PDF for a shipment. Returns a URL to open and print. */
export async function generateLabel(shipmentId: string) {
  const res = await call<{ label_created?: number; label_url?: string; response?: string }>("/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
  });
  if (!res.label_url) throw new Error(res.response ?? "Shiprocket did not return a label");
  return res.label_url;
}

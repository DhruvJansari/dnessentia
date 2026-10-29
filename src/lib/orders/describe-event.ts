/** Turns raw order_events rows into short, plain-language timeline entries for people. Pure; safe on client or server. */

export type TimelineTone = "neutral" | "good" | "info" | "warn" | "bad" | "muted";
export type TimelineEntry = {
  id: number;
  title: string;
  detail: string | null;
  who: string;
  tone: TimelineTone;
  /** Emails and stock bookkeeping: hidden by default to keep the timeline readable. */
  routine: boolean;
  internal: boolean;
  at: string;
};

type RawEvent = {
  id: number;
  type: string;
  message: string;
  actorType: string;
  actorId: number | null;
  isInternal: boolean;
  createdAt: Date;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const statusWords: Record<string, string> = {
  pending: "Waiting for payment",
  confirmed: "Confirmed",
  processing: "Being packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned to us",
};

function describe(e: RawEvent): Omit<TimelineEntry, "id" | "who" | "internal" | "at"> {
  const m = e.message;
  let match: RegExpMatchArray | null;

  switch (e.type) {
    case "created": {
      match = m.match(/Order placed by (.+) \((.+)\)/);
      return { title: "Order placed", detail: match ? `${match[1]} chose ${match[2]}` : m, tone: "neutral", routine: false };
    }
    case "status": {
      if ((match = m.match(/Status changed from (\w+) to (\w+)(?::\s*(.+))?/))) {
        const to = match[2];
        return {
          title: `Marked as ${statusWords[to] ?? cap(to)}`,
          detail: match[3] ?? null,
          tone: to === "cancelled" || to === "returned" ? "bad" : to === "delivered" ? "good" : "info",
          routine: false,
        };
      }
      if (/Cash on Delivery/i.test(m)) return { title: "Order confirmed", detail: "Cash on Delivery order, payment due on delivery", tone: "good", routine: false };
      if (/after successful payment/i.test(m)) return { title: "Order confirmed", detail: "Payment was successful", tone: "good", routine: false };
      return { title: cap(m), detail: null, tone: "info", routine: false };
    }
    case "payment": {
      if ((match = m.match(/Payment of ₹([\d,]+) received via Razorpay(?: \((\w+)\))?/)))
        return { title: `Payment received: ₹${match[1]}`, detail: match[2] ? `Paid by ${match[2].toUpperCase()}` : "Paid online", tone: "good", routine: false };
      if (/Razorpay payment started/.test(m)) return { title: "Customer opened the payment window", detail: null, tone: "muted", routine: true };
      if ((match = m.match(/Payment (?:attempt )?failed(?: \(webhook\))?: (.+)/)))
        return { title: "Payment attempt failed", detail: match[1], tone: "warn", routine: false };
      if ((match = m.match(/Refund of ₹([\d,.]+) issued/))) return { title: `Refunded ₹${match[1]}`, detail: "Money is on its way back to the customer", tone: "warn", routine: false };
      if ((match = m.match(/Cash on Delivery collected \(₹([\d,]+)\)/))) return { title: `Cash collected: ₹${match[1]}`, detail: null, tone: "good", routine: false };
      if ((match = m.match(/Cancellation charge of ₹([\d,]+) kept/))) return { title: `Cancellation charge kept: ₹${match[1]}`, detail: m.replace(/^.*kept\s*/, ""), tone: "muted", routine: false };
      if (/invalid signature/i.test(m)) return { title: "Rejected a suspicious payment confirmation", detail: "The payment signature didn't match", tone: "bad", routine: false };
      if (/Could not start Razorpay/i.test(m)) return { title: "Payment window failed to open", detail: m.replace(/^.*Razorpay:\s*/, ""), tone: "bad", routine: false };
      return { title: cap(m), detail: null, tone: "info", routine: false };
    }
    case "shipment": {
      if (/Created in Shiprocket/.test(m)) return { title: "Sent to Shiprocket", detail: "Shipment created, waiting for a courier", tone: "info", routine: false };
      if ((match = m.match(/AWB (\S+) assigned(?: \((.+)\))?/))) return { title: `Courier assigned${match[2] ? `: ${match[2]}` : ""}`, detail: `Tracking number ${match[1]}`, tone: "info", routine: false };
      if (/Pickup requested/.test(m)) return { title: "Pickup scheduled", detail: "The courier will collect the parcel", tone: "info", routine: false };
      if ((match = m.match(/Courier status: (.+)/))) return { title: `Courier update: ${cap(match[1].toLowerCase())}`, detail: null, tone: "info", routine: false };
      if (/Shiprocket order cancelled/.test(m)) return { title: "Shipment cancelled in Shiprocket", detail: null, tone: "warn", routine: false };
      if (/failed/i.test(m)) return { title: "Shipping step failed", detail: m.replace(/^[^:]*:\s*/, ""), tone: "bad", routine: false };
      return { title: cap(m), detail: null, tone: "info", routine: false };
    }
    case "email": {
      match = m.match(/Email "(.+)" to (\S+): (\w+)/);
      if (!match) return { title: "Email", detail: m, tone: "muted", routine: true };
      const [, subject, to, status] = match;
      const toAdmin = !subject.toLowerCase().includes("your") && /new order|replacement request|contact/i.test(subject);
      return {
        title: status === "sent" ? `Email sent to ${toAdmin ? "store team" : "customer"}` : status === "skipped" ? "Email not sent (SMTP not set up)" : "Email failed to send",
        detail: `"${subject}" to ${to}`,
        tone: status === "failed" ? "bad" : "muted",
        routine: status !== "failed",
      };
    }
    case "stock": {
      if (/Oversold: (.+)/.test(m)) return { title: "Stock ran short", detail: m.replace(/^.*Oversold:\s*/, "Not enough stock for: "), tone: "bad", routine: false };
      if (/returned/i.test(m)) return { title: "Items put back in stock", detail: null, tone: "muted", routine: true };
      return { title: "Items taken out of stock", detail: null, tone: "muted", routine: true };
    }
    case "note":
      return { title: e.isInternal ? "Internal note" : "Note to customer", detail: m, tone: "neutral", routine: false };
    default:
      return { title: cap(m), detail: null, tone: "neutral", routine: false };
  }
}

export function describeEvents(events: RawEvent[], actorNames: Map<number, string> = new Map()): TimelineEntry[] {
  return events.map((e) => {
    const d = describe(e);
    const who =
      e.actorType === "admin"
        ? (e.actorId != null && actorNames.get(e.actorId)) || "Store team"
        : e.actorType === "customer"
          ? "Customer"
          : e.actorType === "webhook"
            ? e.type === "shipment" || e.type === "status"
              ? "Courier update"
              : "Razorpay"
            : "Automatic";
    return { id: e.id, ...d, who, internal: e.isInternal, at: e.createdAt.toISOString() };
  });
}

/** Today's date (YYYY-MM-DD) in India, for "Today"/"Yesterday" headings. */
export function todayIST() {
  return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
}

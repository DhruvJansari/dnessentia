import "server-only";
import type { orderItems, orders } from "@/db";
import { env } from "../env";

type Order = typeof orders.$inferSelect;
type OrderItem = typeof orderItems.$inferSelect;
type Email = { subject: string; html: string; text: string };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const C = { ink: "#1c1712", muted: "#6f655b", gold: "#a6803d", line: "#e6ddcf", cream: "#f6f1e9", ivory: "#fbf8f3" };

/** Shared branded shell: logo, content card, footer. Table layout + inline styles for email clients. */
function layout(preheader: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DN Essentia</title></head>
<body style="margin:0;padding:0;background:${C.cream};font-family:Helvetica,Arial,sans-serif;color:${C.ink};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td align="center" style="padding:8px 0 24px;">
  <a href="${env.appUrl}" style="text-decoration:none;color:${C.ink};">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:bold;letter-spacing:1px;line-height:1">DN</div>
    <div style="font-size:10px;letter-spacing:6px;margin-top:4px;">ESSENTIA</div>
  </a>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${C.line};padding:32px 28px;">${body}</td></tr>
<tr><td align="center" style="padding:24px 8px;font-size:12px;line-height:1.6;color:${C.muted};">
  Premium alcohol-free attars · <a href="${env.appUrl}" style="color:${C.muted};">dnessentia.com</a><br>
  Questions? Reply to this email or WhatsApp us on +91 92747 00645.
</td></tr>
</table></td></tr></table></body></html>`;
}

const heading = (text: string) =>
  `<h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:1.2;">${esc(text)}</h1>`;
const para = (html: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${C.ink};">${html}</p>`;
const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="background:${C.ink};">
  <a href="${href}" style="display:inline-block;padding:14px 26px;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;">${esc(label)}</a></td></tr></table>`;
const small = (html: string) => `<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${C.muted};">${html}</p>`;

function itemsTable(order: Order, items: OrderItem[]) {
  const rows = items
    .map(
      (i) => `<tr>
  <td style="padding:12px 0;border-bottom:1px solid ${C.line};font-size:14px;line-height:1.4;">
    <strong>${esc(i.name)}</strong><br><span style="color:${C.muted};font-size:12px;">${esc(i.variantLabel)} × ${i.quantity}${
      i.selections?.length ? `<br>${esc(i.selections.join(", "))}` : ""
    }</span>
  </td>
  <td align="right" style="padding:12px 0;border-bottom:1px solid ${C.line};font-size:14px;white-space:nowrap;">${i.isGift ? "Free" : inr(i.lineTotal)}</td>
</tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;font-size:14px;color:${bold ? C.ink : C.muted};${bold ? "font-weight:bold;" : ""}">${label}</td><td align="right" style="padding:4px 0;font-size:14px;${bold ? "font-weight:bold;" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">${rows}
${line("Subtotal", inr(order.subtotal))}
${order.discount ? line(`Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}`, `− ${inr(order.discount)}`) : ""}
${line("Shipping", order.shippingFee ? inr(order.shippingFee) : "Free")}
${order.codFee ? line("COD fee", inr(order.codFee)) : ""}
${line("Total", inr(order.total), true)}
</table>${order.giftNote ? para(`🎁 <strong>${esc(order.giftNote)}</strong>`) : ""}`;
}

function addressBlock(order: Order) {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${C.muted};">
<strong style="color:${C.ink}">Shipping to</strong><br>${esc(order.customerName)}<br>${esc(order.shipLine1)}${
    order.shipLine2 ? `, ${esc(order.shipLine2)}` : ""
  }<br>${esc(order.shipCity)}, ${esc(order.shipState)} ${esc(order.shipPincode)}<br>${esc(order.phone)}</p>`;
}

const textItems = (order: Order, items: OrderItem[]) =>
  items.map((i) => `- ${i.name} (${i.variantLabel}) x ${i.quantity}: ${inr(i.lineTotal)}`).join("\n") +
  `\nTotal: ${inr(order.total)}`;

/* -------------------------------- Templates -------------------------------- */

export function verifyEmailTemplate(name: string, link: string): Email {
  return {
    subject: "Confirm your email for DN Essentia",
    html: layout(
      "Confirm your email to activate your account",
      heading(`Welcome${name ? `, ${esc(name.split(" ")[0])}` : ""}`) +
        para("Thanks for creating a DN Essentia account. Confirm your email to see all your orders in one place.") +
        button(link, "Confirm email") +
        small("This link expires in 48 hours. If you didn't create an account, you can ignore this email."),
    ),
    text: `Welcome to DN Essentia. Confirm your email: ${link}`,
  };
}

export function passwordResetTemplate(link: string): Email {
  return {
    subject: "Reset your DN Essentia password",
    html: layout(
      "Reset your password",
      heading("Reset your password") +
        para("We received a request to reset your password. Click below to choose a new one.") +
        button(link, "Choose new password") +
        small("This link expires in 1 hour and can only be used once. If you didn't ask for this, ignore this email."),
    ),
    text: `Reset your DN Essentia password: ${link} (expires in 1 hour)`,
  };
}

export function orderConfirmationTemplate(order: Order, items: OrderItem[], trackLink: string): Email {
  const paid = order.paymentStatus === "paid";
  return {
    subject: `Order ${order.orderNumber} confirmed`,
    html: layout(
      `Thank you! Your order ${order.orderNumber} is confirmed.`,
      heading("Thank you for your order") +
        para(
          `Hi ${esc(order.customerName.split(" ")[0])}, we've received order <strong>${order.orderNumber}</strong>${
            paid ? " and your payment" : ""
          }. We'll email you again when it ships.`,
        ) +
        itemsTable(order, items) +
        para(`Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : paid ? "Paid online (Razorpay)" : "Pending"}`) +
        addressBlock(order) +
        button(trackLink, "View your order"),
    ),
    text: `Order ${order.orderNumber} confirmed.\n${textItems(order, items)}\nTrack: ${trackLink}`,
  };
}

export function adminNewOrderTemplate(order: Order, items: OrderItem[], adminLink: string): Email {
  return {
    subject: `New order ${order.orderNumber} · ${inr(order.total)} · ${order.paymentMethod === "cod" ? "COD" : "Paid"}`,
    html: layout(
      `New order from ${order.customerName}`,
      heading(`New order ${order.orderNumber}`) +
        para(`${esc(order.customerName)} · ${esc(order.email)} · ${esc(order.phone)}`) +
        itemsTable(order, items) +
        addressBlock(order) +
        button(adminLink, "Open in admin"),
    ),
    text: `New order ${order.orderNumber} from ${order.customerName}\n${textItems(order, items)}\n${adminLink}`,
  };
}

export function orderShippedTemplate(order: Order, trackLink: string, courierTrackUrl: string | null): Email {
  return {
    subject: `Your order ${order.orderNumber} is on its way`,
    html: layout(
      `Order ${order.orderNumber} has shipped`,
      heading("Your order is on its way") +
        para(
          `Good news! Order <strong>${order.orderNumber}</strong> has shipped${
            order.courierName ? ` with ${esc(order.courierName)}` : ""
          }.`,
        ) +
        (order.awbCode ? para(`Tracking number (AWB): <strong>${esc(order.awbCode)}</strong>`) : "") +
        button(courierTrackUrl ?? trackLink, "Track shipment") +
        addressBlock(order),
    ),
    text: `Order ${order.orderNumber} has shipped. AWB: ${order.awbCode ?? "-"}. Track: ${courierTrackUrl ?? trackLink}`,
  };
}

export function orderDeliveredTemplate(order: Order, trackLink: string): Email {
  return {
    subject: `Order ${order.orderNumber} delivered`,
    html: layout(
      "Your attars have arrived",
      heading("Delivered") +
        para(`Order <strong>${order.orderNumber}</strong> has been delivered. We hope you love your new fragrance.`) +
        para("Tip: apply to pulse points on moisturised skin and let it settle naturally.") +
        button(trackLink, "View order"),
    ),
    text: `Order ${order.orderNumber} has been delivered. ${trackLink}`,
  };
}

export function orderCancelledTemplate(order: Order, reason: string | null): Email {
  const refund =
    order.refundedAmount > 0
      ? para(
          `A refund of <strong>${inr(order.refundedAmount)}</strong> has been issued to your original payment method${
            order.cancellationCharge ? ` (cancellation charge of ${inr(order.cancellationCharge)} deducted)` : ""
          }. It usually reaches your account in 5-7 business days.`,
        )
      : order.paymentStatus === "paid"
        ? para("Your refund will be processed to the original payment method within 5-7 business days.")
        : "";
  return {
    subject: `Order ${order.orderNumber} cancelled`,
    html: layout(
      `Order ${order.orderNumber} was cancelled`,
      heading("Order cancelled") +
        para(`Order <strong>${order.orderNumber}</strong> has been cancelled.${reason ? ` Reason: ${esc(reason)}` : ""}`) +
        refund +
        small("Questions? Just reply to this email."),
    ),
    text: `Order ${order.orderNumber} has been cancelled.${reason ? ` Reason: ${reason}` : ""}${
      order.refundedAmount ? ` Refund: ${inr(order.refundedAmount)}.` : ""
    }`,
  };
}

export function paymentReminderTemplate(order: Order, link: string, expiresInHours: number): Email {
  return {
    subject: `Complete your payment for order ${order.orderNumber}`,
    html: layout(
      "Your attars are waiting",
      heading("Your order is waiting") +
        para(`Hi ${esc(order.customerName.split(" ")[0])}, we saved order <strong>${order.orderNumber}</strong> (${inr(order.total)}) but the payment wasn't completed.`) +
        button(link, "Complete payment") +
        small(`Unpaid orders are cancelled automatically after about ${expiresInHours} hours.`),
    ),
    text: `Complete your payment for order ${order.orderNumber}: ${link}`,
  };
}

const reasonText: Record<string, string> = {
  damaged: "Damaged product",
  leaked: "Leaked bottle",
  wrong_item: "Wrong product received",
  missing_item: "Item missing",
  other: "Other issue",
};
export const replacementReasonLabel = (r: string) => reasonText[r] ?? r;

export function replacementReceivedTemplate(order: Order, reason: string, link: string): Email {
  return {
    subject: `We received your replacement request for ${order.orderNumber}`,
    html: layout(
      "Replacement request received",
      heading("Request received") +
        para(`We've received your replacement request for order <strong>${order.orderNumber}</strong> (${esc(replacementReasonLabel(reason))}). Our team will review it within 1-2 business days.`) +
        para("Please keep the product and its packaging until the review is complete.") +
        button(link, "View order"),
    ),
    text: `Replacement request received for order ${order.orderNumber}. We will review it within 1-2 business days.`,
  };
}

export function replacementDecisionTemplate(order: Order, approved: boolean, note: string | null, link: string): Email {
  return {
    subject: approved ? `Replacement approved for order ${order.orderNumber}` : `Update on your replacement request for ${order.orderNumber}`,
    html: layout(
      approved ? "Replacement approved" : "Replacement request update",
      heading(approved ? "Replacement approved" : "Replacement request declined") +
        para(
          approved
            ? `Good news! We're sending a replacement for order <strong>${order.orderNumber}</strong>. You'll get tracking details as soon as it ships.`
            : `We reviewed your replacement request for order <strong>${order.orderNumber}</strong> and couldn't approve it.`,
        ) +
        (note ? para(`<em>${esc(note)}</em>`) : "") +
        button(link, "View order"),
    ),
    text: `${approved ? "Replacement approved" : "Replacement declined"} for order ${order.orderNumber}.${note ? ` ${note}` : ""}`,
  };
}

export function adminAlertTemplate(subject: string, lines: string[], link: string): Email {
  return {
    subject,
    html: layout(subject, heading(subject) + lines.map((l) => para(esc(l))).join("") + button(link, "Open in admin")),
    text: [subject, ...lines, link].join("\n"),
  };
}

export function contactAckTemplate(name: string): Email {
  return {
    subject: "We got your message",
    html: layout(
      "Thanks for reaching out",
      heading(`Thanks, ${esc(name.split(" ")[0])}`) + para("We've received your message and will reply within one business day."),
    ),
    text: "Thanks for contacting DN Essentia. We will reply within one business day.",
  };
}

export function testEmailTemplate(): Email {
  return {
    subject: "DN Essentia SMTP test",
    html: layout("SMTP is working", heading("SMTP is working") + para("This test email was sent from the DN Essentia admin.")),
    text: "SMTP is working. This test email was sent from the DN Essentia admin.",
  };
}

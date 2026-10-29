"use server";

import { z } from "zod";
import { contactMessages, db } from "@/db";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mail/send";
import { adminAlertTemplate, contactAckTemplate } from "@/lib/mail/templates";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import { getSettings } from "@/lib/settings";
import { emailField, fieldErrors, type FormState } from "@/lib/validation";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: emailField,
  phone: z.string().trim().max(20).optional(),
  orderNumber: z.string().trim().toUpperCase().max(20).optional(),
  subject: z.string().trim().min(3, "Add a subject").max(160),
  message: z.string().trim().min(10, "Write at least 10 characters").max(4000),
  website: z.string().max(0).optional(), // honeypot: real people leave it empty
});

export async function contactAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { ip } = await requestMeta();
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60e3)) return { error: "Too many messages. Please try again later or WhatsApp us." };
  const { website: _hp, ...data } = parsed.data;
  void _hp;

  const [res] = await db.insert(contactMessages).values({ ...data, phone: data.phone || null, orderNumber: data.orderNumber || null, ip });
  const { notifications } = await getSettings();
  if (notifications.adminEmail) {
    await sendMail({
      ...adminAlertTemplate(
        `Contact form: ${data.subject}`,
        [`${data.name} <${data.email}>${data.phone ? ` · ${data.phone}` : ""}`, data.orderNumber ? `Order: ${data.orderNumber}` : "", data.message].filter(Boolean),
        `${env.appUrl}/admin/messages?id=${res.insertId}`,
      ),
      to: notifications.adminEmail,
      template: "admin_contact",
    });
  }
  await sendMail({ ...contactAckTemplate(data.name), to: data.email, template: "contact_ack" });
  return { ok: true, message: "Thanks! Your message is on its way. We reply within one business day." };
}

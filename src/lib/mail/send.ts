import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db, emailLogs } from "@/db";
import { env, integrations } from "../env";

let transporter: Transporter | null = null;

function getTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  orderId?: number | null;
  userId?: number | null;
};

/**
 * Sends one email over SMTP and records the attempt in email_logs (Admin → Emails).
 * Never throws: a failed email must not break checkout. Without SMTP settings the email is logged as "skipped".
 */
export async function sendMail(input: MailInput): Promise<"sent" | "failed" | "skipped"> {
  let status: "sent" | "failed" | "skipped" = "skipped";
  let error: string | null = null;
  let messageId: string | null = null;

  if (!integrations.smtp()) {
    console.info(`[mail:skipped] ${input.template} → ${input.to}: ${input.subject}\n${input.text}`);
  } else {
    try {
      const info = await getTransport().sendMail({
        from: env.smtp.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      status = "sent";
      messageId = info.messageId ?? null;
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
      console.error(`[mail:failed] ${input.template} → ${input.to}`, err);
    }
  }

  await db
    .insert(emailLogs)
    .values({
      to: input.to,
      subject: input.subject.slice(0, 255),
      template: input.template,
      status,
      error,
      messageId,
      orderId: input.orderId ?? null,
      userId: input.userId ?? null,
    })
    .catch((err) => console.error("[mail] could not write email log", err));

  return status;
}

/** Checks the SMTP connection and credentials without sending anything. */
export async function verifySmtp() {
  if (!integrations.smtp()) return { ok: false, message: "SMTP is not configured in .env.local" };
  try {
    await getTransport().verify();
    return { ok: true, message: `Connected to ${env.smtp.host}:${env.smtp.port}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

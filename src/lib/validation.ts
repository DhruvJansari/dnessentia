import { z } from "zod";

export type FieldErrors = Record<string, string>;
export type FormState = { ok?: boolean; message?: string; error?: string; fieldErrors?: FieldErrors };

/** Flattens zod issues into { field: firstMessage } for inline form errors. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const emailField = z.email("Enter a valid email address").trim().toLowerCase().max(191);
export const passwordField = z.string().min(8, "Use at least 8 characters").max(100);
export const phoneField = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));
export const pincodeField = z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code");

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Enter the full name").max(120),
  phone: phoneField,
  line1: z.string().trim().min(5, "Enter the house number and street").max(255),
  line2: z.string().trim().max(255).optional().default(""),
  city: z.string().trim().min(2, "Enter the city").max(100),
  state: z.string().trim().min(2, "Choose the state").max(100),
  pincode: pincodeField,
});

export const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

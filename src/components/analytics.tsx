"use client";

import { GoogleAnalytics, sendGAEvent } from "@next/third-parties/google";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** Loads GA4 when NEXT_PUBLIC_GA_MEASUREMENT_ID is set; renders nothing otherwise. */
export function Analytics() {
  return GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null;
}

type GaItem = { item_id: string; item_name: string; item_variant?: string; price: number; quantity?: number };
type GaEvent =
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "add_to_wishlist"
  | "begin_checkout"
  | "purchase"
  | "search"
  | "sign_up"
  | "login";

/** GA4 recommended e-commerce events. A no-op when analytics isn't configured. */
export function track(event: GaEvent, params: { items?: GaItem[]; value?: number; transaction_id?: string; search_term?: string; method?: string; [k: string]: unknown }) {
  if (!GA_ID) return;
  sendGAEvent("event", event, { currency: "INR", ...params });
}

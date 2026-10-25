import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { TrackForm } from "./track-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Look up a DN Essentia order with its order number and email address.",
};

export default function TrackPage() {
  return (
    <AuthShell title={<>Track your <em>order</em></>} subtitle="Enter the order number from your confirmation email and the email you ordered with.">
      <TrackForm />
    </AuthShell>
  );
}

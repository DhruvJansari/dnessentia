import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { PasswordForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default function ProfilePage() {
  return (
    <div>
      <p className="eyebrow">Profile</p>
      <h1 className="mt-3 text-5xl">Profile & password</h1>
      <Suspense fallback={<div className="mt-8 h-64 animate-pulse bg-cream" />}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const user = await requireUser("/account/profile");
  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-2">
      <div className="border border-line bg-white p-5 sm:p-8">
        <h2 className="text-3xl">Your details</h2>
        <p className="mt-1 text-sm text-muted">Email: {user.email}</p>
        <div className="mt-6">
          <ProfileForm name={user.name} phone={user.phone ?? ""} />
        </div>
      </div>
      <div className="border border-line bg-white p-5 sm:p-8">
        <h2 className="text-3xl">Change password</h2>
        <div className="mt-6">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}

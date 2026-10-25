import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · DN Essentia Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-[#f6f4f0] text-stone-900 lg:pl-64">
      <Suspense fallback={<aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200/80 bg-white lg:block" />}>
        <SidebarWithUser />
      </Suspense>
      <main className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

async function SidebarWithUser() {
  const user = await requireStaff();
  return <AdminSidebar user={{ name: user.name, email: user.email, role: user.role }} />;
}

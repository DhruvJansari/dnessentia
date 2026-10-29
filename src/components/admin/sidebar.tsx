"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { logoutAction } from "@/lib/auth/actions";
import {
  BoxIcon,
  CloseIcon,
  CogIcon,
  ExternalIcon,
  GridIcon,
  MailIcon,
  MenuIcon,
  PulseIcon,
  ReceiptIcon,
  ChatIcon,
  StarOutlineIcon,
  SwapIcon,
  TagIcon,
  UsersIcon,
} from "../icons";
import { Logo } from "../logo";

const nav = [
  { href: "/admin", label: "Dashboard", Icon: GridIcon },
  { href: "/admin/orders", label: "Orders", Icon: ReceiptIcon },
  { href: "/admin/products", label: "Products", Icon: BoxIcon },
  { href: "/admin/replacements", label: "Replacements", Icon: SwapIcon },
  { href: "/admin/customers", label: "Users", Icon: UsersIcon },
  { href: "/admin/reviews", label: "Reviews", Icon: StarOutlineIcon },
  { href: "/admin/messages", label: "Messages", Icon: ChatIcon },
  { href: "/admin/coupons", label: "Coupons", Icon: TagIcon, adminOnly: true },
  { href: "/admin/emails", label: "Emails", Icon: MailIcon },
  { href: "/admin/activity", label: "Activity", Icon: PulseIcon },
  { href: "/admin/settings", label: "Settings", Icon: CogIcon, adminOnly: true },
];

function NavLinks({ pathname, role, onNavigate }: { pathname: string | null; role: string; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {nav
        .filter((n) => !n.adminOnly || role === "admin")
        .map(({ href, label, Icon }) => {
          const active = pathname != null && (href === "/admin" ? pathname === href : pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <Icon className={`size-[18px] transition-transform duration-300 group-hover:scale-110 ${active ? "text-gold-soft" : ""}`} />
                {label}
              </Link>
            </li>
          );
        })}
    </ul>
  );
}

function ActiveNavLinks(props: { role: string; onNavigate?: () => void }) {
  return <NavLinks pathname={usePathname()} {...props} />;
}

function Panel({ user, onNavigate }: { user: { name: string; email: string; role: string }; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-5">
        <Logo className="h-8" />
        <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-stone-500">Admin</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        <Suspense fallback={<NavLinks pathname={null} role={user.role} onNavigate={onNavigate} />}>
          <ActiveNavLinks role={user.role} onNavigate={onNavigate} />
        </Suspense>
      </nav>
      <div className="border-t border-stone-100 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">
          <ExternalIcon className="size-4" /> View store
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-stone-50 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-stone-900 text-sm font-medium text-white">
            {(user.name || user.email)[0].toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name || "Admin"}</p>
            <p className="truncate text-[12px] capitalize text-stone-500">{user.role}</p>
          </div>
          <form action={logoutAction}>
            <button className="text-[12px] text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline">Log out</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ user }: { user: { name: string; email: string; role: string } }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-stone-200/80 bg-white lg:block">
        <Panel user={user} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" className="-ml-1 grid size-10 place-items-center">
          <MenuIcon className="size-6" />
        </button>
        <Logo className="h-7" />
        <span className="w-10" />
      </header>

      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-stone-900/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
        <div
          inert={!open}
          className={`absolute inset-y-0 left-0 w-72 bg-white shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 grid size-10 place-items-center">
            <CloseIcon className="size-5" />
          </button>
          <Panel user={user} onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}

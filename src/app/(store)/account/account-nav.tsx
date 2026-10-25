"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile & password" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28 lg:self-start">
      <p className="eyebrow">My account</p>
      <ul className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
        {links.map((l) => {
          const active = l.href === "/account" ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                className={`block whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors lg:rounded-none lg:border-0 lg:border-l-2 lg:px-4 lg:py-2.5 ${
                  active ? "border-ink bg-ink text-ivory lg:border-gold lg:bg-transparent lg:text-ink" : "border-line text-ink-soft hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-4">
          <form action={logoutAction}>
            <button type="submit" className="whitespace-nowrap rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-ink lg:border-0 lg:px-4">
              Log out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}

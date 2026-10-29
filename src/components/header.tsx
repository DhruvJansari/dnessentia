"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { mainNav, site } from "@/data/site";
import { useCart } from "./cart/cart-context";
import { BagIcon, CloseIcon, HeartIcon, InstagramIcon, MenuIcon, SearchIcon, UserIcon, WhatsAppIcon } from "./icons";
import { SearchDialog } from "./search-dialog";
import { useStore } from "./store-context";
import { Logo } from "./logo";

const announcements = [
  `🎁 FREE 1ml Attar Sample on Orders Above ₹${site.freeShippingThreshold}`,
  "🌿 Alcohol-Free Attars",
  "🚚 Fast Delivery Across India",
  `🎁 FREE 1ml Attar Sample on Orders Above ₹${site.freeShippingThreshold} – Use Code FREEGIFT`,
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

type NavItemsProps = { variant: "desktop" | "mobile"; onNavigate?: () => void };

function NavItems({ pathname, variant, onNavigate }: NavItemsProps & { pathname: string | null }) {
  return mainNav.map((item) =>
    variant === "desktop" ? (
      <li key={item.href}>
        <Link
          href={item.href}
          className={`link-underline pb-1 text-[13px] uppercase tracking-[0.04em] transition-colors hover:text-ink ${
            isActive(pathname, item.href) ? "text-ink [background-size:100%_1px]" : "text-ink-soft/80"
          }`}
        >
          {item.label}
        </Link>
      </li>
    ) : (
      <li key={item.href} className="border-b border-line">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center justify-between py-4 font-serif text-[2rem] leading-none ${
            isActive(pathname, item.href) ? "text-gold" : ""
          }`}
        >
          {item.label}
        </Link>
      </li>
    ),
  );
}

function ActiveNavItems(props: NavItemsProps) {
  const pathname = usePathname();
  return <NavItems pathname={pathname} {...props} />;
}

/** The current path is request data on dynamic routes, so the highlighted state streams in behind Suspense. */
function MainNavItems(props: NavItemsProps) {
  return (
    <Suspense fallback={<NavItems pathname={null} {...props} />}>
      <ActiveNavItems {...props} />
    </Suspense>
  );
}

export function Header() {
  const { count, open } = useCart();
  const { wishlist } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    // "/" opens search from anywhere, unless typing in a field.
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="overflow-hidden bg-espresso py-2.5 text-[13px] text-ivory/90">
        <p className="sr-only">{announcements.join(". ")}</p>
        {/* Four copies so one half is always wider than the screen; the animation shifts by exactly half. */}
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]" aria-hidden>
          {Array.from({ length: 4 }, () => announcements)
            .flat()
            .map((text, i) => (
              <span key={i} className="flex items-center gap-8 pr-8 whitespace-nowrap">
                {text}
                <span className="text-gold-soft">•</span>
              </span>
            ))}
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-500 ${
          scrolled
            ? "border-line bg-ivory/90 shadow-[0_8px_30px_-20px_rgba(28,23,18,0.35)] backdrop-blur-md"
            : "border-transparent bg-ivory"
        }`}
      >
        <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="-ml-2 grid size-10 place-items-center lg:hidden"
            >
              <MenuIcon className="size-6" />
            </button>
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-9">
                <MainNavItems variant="desktop" />
              </ul>
            </nav>
          </div>

          <Logo preload className="h-9 md:h-11" />

          <div className="flex items-center justify-end gap-1 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className="grid size-10 place-items-center text-ink-soft transition-colors hover:text-ink"
            >
              <SearchIcon className="size-[21px]" />
            </button>
            <Link
              href="/wishlist"
              aria-label={`Wishlist, ${wishlist.length} saved`}
              className="relative hidden size-10 place-items-center text-ink-soft transition-colors hover:text-ink sm:grid"
            >
              <HeartIcon className="size-[21px]" />
              {wishlist.length > 0 && (
                <span key={wishlist.length} className="absolute right-0.5 top-0.5 grid min-w-[18px] animate-pop place-items-center rounded-full bg-ink px-1 text-[10px] font-medium leading-[18px] text-ivory">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              aria-label="Your account"
              className="grid size-10 place-items-center text-ink-soft transition-colors hover:text-ink"
            >
              <UserIcon className="size-[22px]" />
            </Link>
            <button
              type="button"
              onClick={open}
              aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}
              className="relative -mr-2 grid size-10 place-items-center text-ink-soft hover:text-ink"
            >
              <BagIcon className="size-[22px]" />
              {count > 0 && (
                <span
                  key={count}
                  className="absolute right-0.5 top-0.5 grid min-w-[18px] animate-pop place-items-center rounded-full bg-gold px-1 text-[10px] font-medium leading-[18px] text-white"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile / tablet navigation */}
      <div className={`fixed inset-0 z-[70] lg:hidden ${menuOpen ? "" : "pointer-events-none"}`} aria-hidden={!menuOpen}>
        <div
          onClick={closeMenu}
          className={`absolute inset-0 bg-espresso/40 transition-opacity duration-500 ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          inert={!menuOpen}
          className={`absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-ivory transition-transform duration-500 ease-(--ease-luxe) ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <Logo className="h-9" onClick={closeMenu} />
            <button type="button" onClick={closeMenu} aria-label="Close menu" className="-mr-2 grid size-10 place-items-center">
              <CloseIcon className="size-6" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-6">
            <ul>
              <MainNavItems variant="mobile" onNavigate={closeMenu} />
            </ul>
            <ul className="mt-8 space-y-3 text-sm text-muted">
              <li><Link href="/account" onClick={closeMenu}>My account</Link></li>
              <li><Link href="/wishlist" onClick={closeMenu}>Wishlist{wishlist.length ? ` (${wishlist.length})` : ""}</Link></li>
              <li><Link href="/track" onClick={closeMenu}>Track order</Link></li>
              <li><Link href="/faq" onClick={closeMenu}>FAQs</Link></li>
              <li><Link href="/shipping-delivery" onClick={closeMenu}>Shipping & Delivery</Link></li>
              <li><Link href="/refund-returns" onClick={closeMenu}>Returns & Refunds</Link></li>
            </ul>
          </nav>
          <div className="flex gap-3 border-t border-line px-5 py-5">
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline h-11 flex-1 px-4">
              <WhatsAppIcon className="size-4" /> WhatsApp
            </a>
            <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline h-11 flex-1 px-4">
              <InstagramIcon className="size-4" /> Instagram
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

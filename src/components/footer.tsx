import Link from "next/link";
import { footerNav, site } from "@/data/site";
import { InstagramIcon, WhatsAppIcon } from "./icons";
import { Logo } from "./logo";

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="font-sans text-[11px] font-medium uppercase tracking-[0.04em] text-gold-soft">{title}</h3>
      <ul className="mt-5 space-y-3 text-[15px]">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="link-underline text-ivory/70 transition-colors hover:text-ivory">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-espresso text-ivory">
      {/* Community band */}
      <div className="jaali jaali-dark border-b border-white/10">
        <div className="container-x flex flex-col items-start gap-8 py-14 md:flex-row md:items-end md:justify-between md:py-16">
          <div className="reveal max-w-xl">
            <p className="eyebrow !text-gold-soft">Join the DN Essentia family</p>
            <h2 className="mt-4 text-4xl leading-[1.05] sm:text-5xl">
              New launches & private offers, <em className="text-gold-soft">first.</em>
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-light">
              <InstagramIcon className="size-4" /> Follow on Instagram
            </a>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn border border-white/25 text-ivory hover:border-ivory hover:bg-ivory hover:text-ink"
            >
              <WhatsAppIcon className="size-4" /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-12 py-14 sm:grid-cols-2 md:py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo inverted className="h-12" />
          <p className="mt-6 text-[15px] leading-relaxed text-ivory/65">
            Premium alcohol-free attars, crafted from 100% concentrated oils for those who appreciate timeless fragrance.
          </p>
          <div className="mt-6 flex gap-2">
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid size-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-gold-soft hover:text-gold-soft"
            >
              <InstagramIcon className="size-[18px]" />
            </a>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid size-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-gold-soft hover:text-gold-soft"
            >
              <WhatsAppIcon className="size-[18px]" />
            </a>
          </div>
        </div>
        <FooterColumn title="Shop" links={footerNav.shop} />
        <FooterColumn title="Customer Care" links={footerNav.help} />
        <div>
          <FooterColumn title="Company" links={footerNav.company} />
          <div className="mt-8 space-y-1 text-[15px] text-ivory/70">
            <a href={`mailto:${site.email}`} className="link-underline block w-fit hover:text-ivory">
              {site.email}
            </a>
            <a href={`https://wa.me/${site.whatsapp}`} className="link-underline block w-fit hover:text-ivory">
              {site.whatsappDisplay}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-[12px] text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {site.copyrightYear} DN Essentia. All rights reserved.</p>
          <p className="uppercase tracking-[0.04em]">Premium · Alcohol-free · Long lasting</p>
        </div>
      </div>
    </footer>
  );
}

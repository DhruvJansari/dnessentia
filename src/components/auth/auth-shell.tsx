import Image from "next/image";
import type { ReactNode } from "react";

/** Split layout for login/register/reset: brand image on desktop, form card everywhere. */
export function AuthShell({ title, subtitle, children }: { title: ReactNode; subtitle?: string; children: ReactNode }) {
  return (
    <section className="grid min-h-[calc(100svh-7rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/images/brand/craft.png" alt="" fill sizes="50vw" className="animate-hero-zoom object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/20 to-transparent" />
        <p className="absolute bottom-12 left-12 max-w-sm font-serif text-4xl leading-tight text-ivory">
          Pure essence, <em className="text-gold-soft">lasting impression.</em>
        </p>
      </div>
      <div className="jaali flex items-center justify-center bg-cream px-5 py-14 sm:px-8">
        <div className="stagger-in w-full max-w-md">
          <h1 className="text-[2.75rem] leading-none sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 text-ink-soft">{subtitle}</p>}
          <div className="mt-8 border border-line bg-ivory p-6 shadow-[0_24px_60px_-40px_rgba(28,23,18,0.45)] sm:p-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

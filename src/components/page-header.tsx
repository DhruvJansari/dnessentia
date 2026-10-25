import Link from "next/link";
import type { ReactNode } from "react";

type Crumb = { href?: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[12px] uppercase tracking-[0.04em] text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  crumbs: Crumb[];
}) {
  return (
    <section className="border-b border-line bg-cream">
      <div className="container-x pb-12 pt-8 md:pb-16 md:pt-10">
        <Breadcrumbs items={crumbs} />
        <div className="stagger-in mt-10 max-w-3xl md:mt-14">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 text-[3rem] leading-[0.98] sm:text-6xl lg:text-7xl">{title}</h1>
          {description && <p className="mt-5 max-w-xl text-ink-soft">{description}</p>}
        </div>
      </div>
    </section>
  );
}

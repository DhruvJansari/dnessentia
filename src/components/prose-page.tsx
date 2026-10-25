import type { ReactNode } from "react";
import { PageHeader } from "./page-header";

export type ProseSection = { heading: string; body?: string[]; list?: string[] };

/** Shared layout for policy pages: header, then numbered sections in a readable column. */
export function ProsePage({
  title,
  eyebrow,
  intro,
  updated,
  sections,
  children,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  updated?: string;
  sections: ProseSection[];
  children?: ReactNode;
}) {
  return (
    <>
      <PageHeader crumbs={[{ href: "/", label: "Home" }, { label: title }]} eyebrow={eyebrow} title={title} description={intro} />
      <section className="container-x section-y !pt-12 md:!pt-16">
        <div className="mx-auto max-w-3xl">
          {updated && <p className="text-[12px] uppercase tracking-[0.04em] text-muted">Last updated: {updated}</p>}
          <div className="mt-6 divide-y divide-line">
            {sections.map((s, i) => (
              <div key={s.heading} className="grid gap-4 py-10 first:pt-4 md:grid-cols-[4rem_1fr]">
                <p className="font-serif text-3xl text-gold">{String(i + 1).padStart(2, "0")}</p>
                <div>
                  <h2 className="text-3xl sm:text-4xl">{s.heading}</h2>
                  {s.body?.map((p) => (
                    <p key={p} className="mt-4 text-ink-soft">
                      {p}
                    </p>
                  ))}
                  {s.list && (
                    <ul className="mt-4 space-y-2 text-ink-soft">
                      {s.list.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-gold" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
          {children}
        </div>
      </section>
    </>
  );
}

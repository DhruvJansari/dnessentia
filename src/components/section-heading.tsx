import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  action?: ReactNode;
};

export function SectionHeading({ eyebrow, title, description, align = "center", action }: SectionHeadingProps) {
  if (align === "left") {
    return (
      <div className="reveal flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-4 text-[2.5rem] sm:text-5xl lg:text-[3.75rem]">{title}</h2>
          {description && <p className="mt-4 max-w-lg text-muted">{description}</p>}
        </div>
        {action}
      </div>
    );
  }
  return (
    <div className="reveal mx-auto max-w-2xl text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-[2.5rem] sm:text-5xl lg:text-[3.75rem]">{title}</h2>
      {description && <p className="mx-auto mt-4 max-w-md text-muted">{description}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

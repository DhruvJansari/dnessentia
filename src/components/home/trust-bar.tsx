import { site } from "@/data/site";
import { DropIcon, LeafIcon, ShieldIcon, TruckIcon } from "../icons";

const items = [
  { Icon: TruckIcon, title: "Free Shipping", text: `On orders above ₹${site.freeShippingThreshold}` },
  { Icon: LeafIcon, title: "Alcohol-Free", text: "Gentle & skin friendly" },
  { Icon: DropIcon, title: "100% Concentrated", text: "Pure perfume oils" },
  { Icon: ShieldIcon, title: "Secure Ordering", text: "Safe, assisted checkout" },
];

export function TrustBar() {
  return (
    <section aria-label="Why shop with us" className="border-y border-line bg-ivory">
      <ul className="reveal-stagger container-x grid grid-cols-2 lg:grid-cols-4">
        {items.map(({ Icon, title, text }, i) => (
          <li
            key={title}
            className={`flex flex-col items-center gap-3 px-2 py-7 text-center sm:flex-row sm:gap-4 sm:px-4 sm:text-left lg:justify-center lg:py-9 ${
              i % 2 === 0 ? "border-r border-line" : ""
            } ${i < 2 ? "border-b border-line lg:border-b-0" : ""} ${i === 1 ? "lg:border-r" : ""}`}
          >
            <Icon className="size-8 shrink-0 text-gold" />
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.04em]">{title}</p>
              <p className="mt-0.5 text-[13px] text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

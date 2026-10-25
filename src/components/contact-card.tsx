import { site } from "@/data/site";
import { WhatsAppIcon } from "./icons";

export function ContactCard({ title = "Need help with an order?" }: { title?: string }) {
  return (
    <div className="mt-12 flex flex-col gap-6 bg-sand p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
      <div>
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        <p className="mt-2 text-ink-soft">
          Email{" "}
          <a href={`mailto:${site.email}`} className="link-underline text-ink">
            {site.email}
          </a>{" "}
          or message us on WhatsApp.
        </p>
      </div>
      <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn btn-dark">
        <WhatsAppIcon className="size-4" /> {site.whatsappDisplay}
      </a>
    </div>
  );
}

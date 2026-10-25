import { site } from "@/data/site";
import { whatsappLink } from "@/lib/format";
import { WhatsAppIcon } from "./icons";

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink(site.whatsapp, "Hi DN Essentia, I have a question about your attars.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 isolate grid size-13 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.6)] transition-transform duration-300 hover:scale-105 md:bottom-7 md:right-7 md:size-14"
    >
      <span aria-hidden className="absolute inset-0 -z-10 animate-soft-ping rounded-full bg-[#25d366]" />
      <WhatsAppIcon className="size-7" />
    </a>
  );
}

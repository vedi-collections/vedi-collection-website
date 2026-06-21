import { WhatsAppIcon } from "@/components/ui/icons";
import { waHelloLink } from "@/lib/shop/whatsapp";

/** Persistent WhatsApp action button, bottom-right. Desktop only — on mobile the
 *  WhatsApp action lives in the header next to the bag. */
export function FloatingWhatsApp() {
  return (
    <a
      href={waHelloLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Vedi Collections on WhatsApp"
      className="fixed bottom-5 right-5 z-30 hidden h-13 w-13 place-items-center rounded-full bg-whatsapp text-whatsapp-fg shadow-lg min-[900px]:grid"
      style={{ height: 52, width: 52 }}
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}

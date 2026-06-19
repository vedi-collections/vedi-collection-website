import Link from "next/link";

import { Brand } from "@/components/layout/Brand";
import { Container } from "@/components/layout/Container";
import { WhatsAppIcon } from "@/components/ui/icons";
import type { MainTab, ShopLink } from "@/lib/shop/catalog";
import { waHelloLink } from "@/lib/shop/whatsapp";

type StoreFooterProps = {
  /** Jump to a category in the single-page catalog. */
  onNavigate: (main: MainTab, subLabel?: string) => void;
  /** "Shop" column links, derived from the live catalog (admin sub-categories). */
  links: ShopLink[];
};

export function StoreFooter({ onNavigate, links }: StoreFooterProps) {
  return (
    <footer className="bg-footer text-primary-fg/[0.78]">
      <Container className="pb-24 pt-9 min-[900px]:pb-10 min-[900px]:pt-12">
        <div className="grid gap-8 min-[900px]:grid-cols-3">
          <div>
            <Brand tone="light" />
            <p className="mt-3.5 max-w-[42ch] text-[15px] leading-relaxed">
              Delhi boutique fabrics, curated for everyday elegance and festive dressing. Share your
              choice on WhatsApp and we&apos;ll confirm availability, delivery and payment.
            </p>
            <a
              href={waHelloLink()}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-[15px] font-bold text-accent-light"
            >
              <WhatsAppIcon className="h-4 w-4" /> Message us on WhatsApp
            </a>
          </div>

          <div className="hidden min-[900px]:block">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-accent-light">Shop</h3>
            <ul className="mt-4 space-y-2 text-base">
              {links.map((link) => (
                <li key={link.label}>
                  <button type="button" onClick={() => onNavigate(link.main, link.sub)} className="hover:text-accent-light">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden min-[900px]:block">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-accent-light">Contact</h3>
            <ul className="mt-4 space-y-2 text-base">
              <li>Mon–Sat, 10am – 7pm IST</li>
              <li>
                <a href={waHelloLink()} target="_blank" rel="noreferrer" className="hover:text-accent-light">
                  WhatsApp: chat with us
                </a>
              </li>
              <li>
                <a href="mailto:vedicollections.official@gmail.com" className="hover:text-accent-light">
                  vedicollections.official@gmail.com
                </a>
              </li>
              <li>Delhi, India</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 text-[13px] text-primary-fg/50">
          <p>© 2026 Vedi Collections. All rights reserved.</p>
          <Link href="/admin/login" className="hover:text-accent-light">
            Admin
          </Link>
        </div>
      </Container>
    </footer>
  );
}

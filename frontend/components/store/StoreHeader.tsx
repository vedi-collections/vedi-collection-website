import { AccountButton } from "@/components/store/AccountButton";
import { Brand } from "@/components/layout/Brand";
import { Container } from "@/components/layout/Container";
import { BagIcon, WhatsAppIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { MAIN_TABS, type MainTab } from "@/lib/shop/catalog";
import { waHelloLink } from "@/lib/shop/whatsapp";

type StoreHeaderProps = {
  main: MainTab;
  onMain: (main: MainTab) => void;
  count: number;
  showCount: boolean;
  onOpenCart: () => void;
};

/** Sticky storefront header. Mobile: wordmark + bag. Desktop: wordmark, centred
 *  category nav, "Chat with us" pill and a "Bag (N)" pill. */
export function StoreHeader({ main, onMain, count, showCount, onOpenCart }: StoreHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <Container>
        <div className="flex items-center gap-4 py-3">
          <div className="flex-1">
            <Brand />
          </div>

          <nav aria-label="Main categories" className="hidden items-center gap-1 min-[900px]:flex">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onMain(tab)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-bold transition",
                  main === tab ? "bg-primary text-primary-fg" : "text-muted hover:text-primary"
                )}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2.5">
            <a
              href={waHelloLink()}
              target="_blank"
              rel="noreferrer"
              className="hidden h-10 items-center gap-2 rounded-full bg-whatsapp px-4 text-sm font-bold text-whatsapp-fg min-[900px]:inline-flex"
            >
              <WhatsAppIcon className="h-[18px] w-[18px]" /> Chat with us
            </a>

            <AccountButton />

            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Open bag${showCount ? ` with ${count} item${count > 1 ? "s" : ""}` : ""}`}
              className="relative inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-surface text-primary min-[900px]:w-auto min-[900px]:gap-2 min-[900px]:px-4"
            >
              <span className="hidden text-[13px] font-bold min-[900px]:inline">Bag</span>
              <BagIcon className="h-5 w-5" />
              {showCount && (
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-surface min-[900px]:static min-[900px]:h-5 min-[900px]:min-w-5">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </Container>
    </header>
  );
}

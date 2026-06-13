import { Container } from "@/components/layout/Container";
import { buttonClasses } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import type { Product } from "@/lib/shop/types";

const HERO_BG =
  "linear-gradient(to top, rgba(185,138,60,0.95) 0%, rgba(185,138,60,0.95) 5%, rgba(0,0,0,0) 5.5%), repeating-linear-gradient(115deg, rgba(255,255,255,0.055) 0, rgba(255,255,255,0.055) 3px, transparent 3px, transparent 16px), radial-gradient(circle at 82% 18%, rgba(216,179,106,0.2), transparent 32%), linear-gradient(145deg, #6E2138, #3E0F1E)";

const FEATURED_SECONDARY = { c1: "#A62243", c2: "#5B1428" };

/** Hero: gradient banner with copy + CTA (mobile); split with two rotated
 *  featured cards on desktop. */
export function StoreHero({ featured, onShop }: { featured: Product; onShop: () => void }) {
  return (
    <Container className="min-[900px]:py-2">
      <section
        aria-labelledby="hero-title"
        className="relative my-3.5 grid min-h-[360px] overflow-hidden rounded-2xl min-[900px]:my-6 min-[900px]:min-h-[486px] min-[900px]:grid-cols-[1.1fr_1fr] min-[900px]:items-center min-[900px]:rounded-[20px]"
        style={{ background: HERO_BG }}
      >
        <div className="self-end p-6 pb-9 min-[900px]:self-center min-[900px]:px-16 min-[900px]:py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-light">The Festive Edit &apos;26</p>
          <h1
            id="hero-title"
            className="mt-2.5 max-w-[8.5em] font-serif text-[34px] font-semibold leading-[1.12] text-primary-fg min-[900px]:max-w-[10.5em] min-[900px]:text-[52px]"
          >
            Woven for the moments that matter
          </h1>
          <p className="mt-3.5 max-w-[30ch] text-sm leading-relaxed text-primary-fg/[0.78] min-[900px]:text-base">
            Handpicked suits and gents fabric from trusted mills, ready to order over WhatsApp with
            personal boutique guidance.
          </p>
          <button
            type="button"
            onClick={onShop}
            className={buttonClasses("primary", "md", "mt-5 bg-accent-light text-primary-dark hover:bg-accent")}
          >
            Shop the edit
          </button>
        </div>

        <div className="hidden items-center justify-center pr-16 min-[900px]:flex">
          <FeaturedCard seed={featured.variants[0]} title={featured.name} rotate="left" />
          <FeaturedCard seed={FEATURED_SECONDARY} title="Zari Bridal Lehenga" rotate="right" />
        </div>
      </section>
    </Container>
  );
}

function FeaturedCard({
  seed,
  title,
  rotate
}: {
  seed: { c1: string; c2: string; light?: boolean };
  title: string;
  rotate: "left" | "right";
}) {
  return (
    <div
      className={
        "relative w-[200px] shrink-0 overflow-hidden rounded-2xl shadow-[0_24px_50px_rgba(20,5,10,0.3)] transition-transform duration-200 hover:rotate-0 hover:-translate-y-1.5 " +
        (rotate === "left" ? "-rotate-3" : "-ml-11 rotate-3")
      }
    >
      <ProductImage seed={seed} alt={title} className="aspect-[3/4] w-full" motifClassName="text-[44px]">
        <p className="absolute inset-x-4 bottom-4 z-[1] text-[13px] font-bold text-primary-fg">{title}</p>
      </ProductImage>
    </div>
  );
}

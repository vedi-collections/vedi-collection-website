import { Container } from "@/components/layout/Container";
import { buttonClasses } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/cn";
import type { MainTab } from "@/lib/shop/catalog";
import type { Product } from "@/lib/shop/types";

const HERO_BG =
  "linear-gradient(to top, rgba(185,138,60,0.95) 0%, rgba(185,138,60,0.95) 5%, rgba(0,0,0,0) 5.5%), repeating-linear-gradient(115deg, rgba(255,255,255,0.055) 0, rgba(255,255,255,0.055) 3px, transparent 3px, transparent 16px), radial-gradient(circle at 82% 18%, rgba(216,179,106,0.2), transparent 32%), linear-gradient(145deg, #6E2138, #3E0F1E)";

// Single "All" banner: one surface that blends women's maroon (left) into
// men's steel-blue (right), keeping the brand gold baseline + diagonal weave.
const SPLIT_BG =
  "linear-gradient(to top, rgba(185,138,60,0.95) 0%, rgba(185,138,60,0.95) 5%, rgba(0,0,0,0) 5.5%), repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 3px, transparent 3px, transparent 16px), linear-gradient(105deg, #6E2138 0%, #5A1C33 30%, #3E2A45 50%, #2C3C5C 74%, #1E3050 100%)";

const FEATURED_SECONDARY = { c1: "#A62243", c2: "#5B1428" };

type StoreHeroProps = {
  /** Active main tab — drives whether the hero is split or audience-specific. */
  main: MainTab;
  products: Product[];
  /** Scroll to the grid keeping the current tab. */
  onShop: () => void;
  /** Switch to an audience tab (used by the split banner's two sides). */
  onSelectAudience: (main: MainTab) => void;
};

/** Hero banner. On "All" it splits into a women's side and a men's side; on
 *  "Ladies"/"Gents" it shows a single audience-specific banner. */
export function StoreHero({ main, products, onShop, onSelectAudience }: StoreHeroProps) {
  const ladies = products.filter((p) => p.audience === "ladies");
  const gents = products.filter((p) => p.audience === "gents");

  if (main === "All") {
    return (
      <Container className="min-[900px]:py-2">
        <section
          aria-label="Shop by category"
          className="relative my-3.5 grid min-h-[340px] grid-cols-2 overflow-hidden rounded-2xl min-[900px]:my-6 min-[900px]:min-h-[486px] min-[900px]:rounded-[20px]"
          style={{ background: SPLIT_BG }}
        >
          <h1 className="sr-only">Vedi Collections — festive edit for women and men</h1>
          <AudienceSide
            eyebrow="For Her"
            title="Suits & dress fabric"
            cta="Shop Women"
            onClick={() => onSelectAudience("Ladies")}
          />
          <AudienceSide
            eyebrow="For Him"
            title="Pant-shirt & safari cloth"
            cta="Shop Men"
            align="right"
            onClick={() => onSelectAudience("Gents")}
          />
        </section>
      </Container>
    );
  }

  const isLadies = main === "Ladies";
  const cards = (isLadies ? ladies : gents).slice(0, 2);
  const copy = isLadies
    ? {
        title: "Woven for the moments that matter",
        body: "Handpicked suits and dress fabric for women, from trusted mills — ready to order over WhatsApp with personal boutique guidance."
      }
    : {
        title: "Sharp fabric for every occasion",
        body: "Premium pant-shirt and safari fabric for men, from trusted mills — ready to order over WhatsApp with personal tailoring guidance."
      };

  return (
    <Container className="min-[900px]:py-2">
      <section
        aria-labelledby="hero-title"
        className="relative my-3.5 grid min-h-[360px] overflow-hidden rounded-2xl min-[900px]:my-6 min-[900px]:min-h-[486px] min-[900px]:grid-cols-[1.1fr_1fr] min-[900px]:items-center min-[900px]:rounded-[20px]"
        style={{ background: HERO_BG }}
      >
        <div className="self-end p-6 pb-9 min-[900px]:self-center min-[900px]:px-16 min-[900px]:py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent-light">
            The Festive Edit &apos;26 · {isLadies ? "Ladies" : "Gents"}
          </p>
          <h1
            id="hero-title"
            className="mt-2.5 max-w-[8.5em] font-serif text-[34px] font-semibold leading-[1.12] text-primary-fg min-[900px]:max-w-[10.5em] min-[900px]:text-[52px]"
          >
            {copy.title}
          </h1>
          <p className="mt-3.5 max-w-[30ch] text-sm leading-relaxed text-primary-fg/[0.78] min-[900px]:text-base">
            {copy.body}
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
          <FeaturedCard
            seed={cards[0]?.variants[0] ?? FEATURED_SECONDARY}
            imageUrl={cards[0]?.imageUrl ?? null}
            title={cards[0]?.name ?? (isLadies ? "Ladies edit" : "Gents edit")}
            rotate="left"
          />
          <FeaturedCard
            seed={cards[1]?.variants[0] ?? FEATURED_SECONDARY}
            imageUrl={cards[1]?.imageUrl ?? null}
            title={cards[1]?.name ?? (isLadies ? "Festive suit" : "Safari cloth")}
            rotate="right"
          />
        </div>
      </section>
    </Container>
  );
}

/** One tappable half of the single "All" banner. Both halves sit on the shared
 *  women→men gradient; this just lays the copy + CTA over its side and routes to
 *  that audience. */
function AudienceSide({
  eyebrow,
  title,
  cta,
  align = "left",
  onClick
}: {
  eyebrow: string;
  title: string;
  cta: string;
  align?: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${cta} — ${title}`}
      className={cn(
        "group relative flex flex-col justify-end p-5 min-[900px]:p-10",
        align === "right" ? "items-end text-right" : "items-start text-left"
      )}
    >
      <span className="pointer-events-none absolute inset-0 bg-primary-fg/0 transition-colors duration-200 group-hover:bg-primary-fg/[0.06]" />
      <span className="relative text-[11px] font-bold uppercase tracking-[0.22em] text-accent-light">{eyebrow}</span>
      <span className="relative mt-2 font-serif text-[22px] font-semibold leading-[1.15] text-primary-fg min-[900px]:text-[32px]">
        {title}
      </span>
      <span className={buttonClasses("primary", "sm", "relative mt-3 bg-accent-light text-primary-dark group-hover:bg-accent")}>
        {cta} →
      </span>
    </button>
  );
}

function FeaturedCard({
  seed,
  imageUrl,
  title,
  rotate
}: {
  seed: { c1: string; c2: string; light?: boolean };
  imageUrl?: string | null;
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
      <ProductImage seed={seed} imageUrl={imageUrl} alt={title} className="aspect-[3/4] w-full" motifClassName="text-[44px]">
        <p className="absolute inset-x-4 bottom-4 z-[1] text-[13px] font-bold text-primary-fg">{title}</p>
      </ProductImage>
    </div>
  );
}

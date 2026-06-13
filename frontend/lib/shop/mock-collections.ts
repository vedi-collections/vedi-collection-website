// Collections, navigation, and facet definitions. Collection membership is
// computed in lib/shop/client.ts (productInCollection) rather than stored, so
// the mock stays in one place. Later these can come from the catalog/categories.

import type { Collection, ProductSort } from "./types";

export const COLLECTIONS: Collection[] = [
  {
    slug: "best-sellers",
    title: "Best Sellers",
    subtitle: "Most-loved picks from the boutique",
    tile: { c1: "#7A2640", c2: "#3E0F1E" }
  },
  {
    slug: "new-arrivals",
    title: "New Arrivals",
    subtitle: "Freshly added this season",
    tile: { c1: "#1E6B52", c2: "#0C3A2C" }
  },
  {
    slug: "ladies",
    title: "Ladies Collection",
    subtitle: "Suits, sets & festive edits",
    tile: { c1: "#A62243", c2: "#5B1428" }
  },
  {
    slug: "gents",
    title: "Gents Fabric",
    subtitle: "Shirting, suiting & safari cloth",
    tile: { c1: "#3C434B", c2: "#1C2126" }
  },
  {
    slug: "suits",
    title: "Ladies Suits",
    subtitle: "Unstitched suit sets",
    tile: { c1: "#7A2640", c2: "#42101F" }
  },
  {
    slug: "pant-shirt-cloth",
    title: "Pant-Shirt Cloth",
    subtitle: "Combed cotton & blends",
    tile: { c1: "#5E7282", c2: "#2E3A44" }
  },
  {
    slug: "safari-cloth",
    title: "Safari Cloth",
    subtitle: "Classic safari suiting",
    tile: { c1: "#5A6B42", c2: "#2C361E" }
  },
  {
    slug: "all-products",
    title: "All Products",
    subtitle: "The full Vedi edit",
    tile: { c1: "#6E2138", c2: "#3E0F1E" }
  }
];

export function getCollectionBySlug(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

/** Header / mobile-nav links. */
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Ladies", href: "/collections/ladies" },
  { label: "Gents", href: "/collections/gents" },
  { label: "Best Sellers", href: "/collections/best-sellers" }
];

/** The three "Our Collections" tiles on the home page. */
export const HOME_TILE_SLUGS = ["suits", "gents", "best-sellers"] as const;

/** Colour-family facet labels + swatch colour for the filter UI. */
export const COLOR_FAMILIES: Record<string, { label: string; hex: string }> = {
  maroon: { label: "Maroon", hex: "#7A2640" },
  green: { label: "Green", hex: "#1E6B52" },
  blue: { label: "Blue", hex: "#2E4A78" },
  yellow: { label: "Yellow", hex: "#D49A2E" },
  orange: { label: "Orange", hex: "#D96A2B" },
  grey: { label: "Grey", hex: "#6B7280" },
  beige: { label: "Beige", hex: "#C7B299" },
  cream: { label: "Cream", hex: "#E6D5AE" },
  white: { label: "White", hex: "#E8E4D8" },
  gold: { label: "Gold", hex: "#B98A3C" }
};

/** Price buckets in PAISE. */
export const PRICE_BUCKETS: { slug: string; label: string; min: number; max: number | null }[] = [
  { slug: "under-1500", label: "Under ₹1,500", min: 0, max: 150000 },
  { slug: "1500-2500", label: "₹1,500 – ₹2,500", min: 150000, max: 250000 },
  { slug: "above-2500", label: "Above ₹2,500", min: 250000, max: null }
];

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" }
];

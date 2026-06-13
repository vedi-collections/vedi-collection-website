// Shop domain types — the frontend's view model for catalog data.
//
// IMPORTANT: money is integer PAISE (priceMinor / mrpMinor), matching the
// backend `products` table (`price_minor`) and CLAUDE.md. Never store rupees
// or floats. Format for display via lib/shop/money.ts.
//
// This shape is the contract the storefront renders against. The mock data in
// mock-products.ts produces these objects today; later, lib/shop/client.ts will
// map the real `/shop/products` API response into the same shape — so swapping
// data sources requires zero changes in components.

export type Currency = "INR";

export type Audience = "ladies" | "gents";

/** A selectable colour/finish of a product. Drives swatches + the gallery. */
export type ProductVariant = {
  name: string; // e.g. "Deep Maroon"
  /** Primary swatch colour; also seeds the gradient placeholder when no image. */
  c1: string;
  /** Secondary gradient colour for the placeholder. */
  c2: string;
  /** Lighter fabrics need a darker motif overlay; see lib/shop/placeholder.ts. */
  light?: boolean;
  /** OUR storage URL once images are mirrored from Meta. Null → use placeholder. */
  imageUrl?: string | null;
};

/** Flat product attributes shown on the detail page (reference-style list). */
export type ProductAttributes = {
  fabric: string;
  /** What the buyer receives, e.g. "Kurta 2.5m + salwar 2m + dupatta 2.25m". */
  includes: string;
  care: string;
  fit?: string;
  occasion?: string;
};

export type Product = {
  id: string;
  /** Unique id from Meta catalog (mirrored). Mocked for now. */
  retailerId: string;
  name: string;
  /** Headline colour/shade descriptor, e.g. "Emerald Green". */
  shade: string;
  audience: Audience;
  /** Display category, e.g. "Suits" | "Pant-Shirt Cloth" | "Safari Cloth". */
  category: string;
  /** Category slug used in URLs/filters, e.g. "suits". */
  categorySlug: string;
  /** Colour family slugs for faceted filtering, e.g. ["maroon"]. */
  colorFamilies: string[];
  priceMinor: number; // PAISE
  mrpMinor: number | null; // PAISE; null when not on sale
  currency: Currency;
  /** Marketing badge, e.g. "Bestseller". Null when none. */
  tag: string | null;
  /** Available sizes; empty for unstitched fabric (no size selector shown). */
  sizes: string[];
  /** Sale unit, e.g. "1 suit set", "1.6m cut". */
  unit: string;
  attributes: ProductAttributes;
  variants: ProductVariant[];
  /** Primary OUR image URL; null → render gradient placeholder. */
  imageUrl: string | null;
  isActive: boolean;
};

export type Collection = {
  slug: string;
  title: string;
  subtitle?: string;
  /** Placeholder gradient seed for the collection tile when no image exists. */
  tile: { c1: string; c2: string; light?: boolean };
  imageUrl?: string | null;
};

export type CartLine = {
  product: Product;
  qty: number;
  /** Selected size when the product offers sizes. */
  size?: string;
};

/** Filters applied on collection/search pages; all optional and URL-driven. */
export type ProductFilters = {
  collection?: string;
  categorySlug?: string;
  audience?: Audience;
  colorFamily?: string;
  /** Price bucket slug: "under-1500" | "1500-2500" | "above-2500". */
  priceBucket?: string;
  sort?: ProductSort;
  q?: string;
};

export type ProductSort = "popularity" | "price-asc" | "price-desc" | "newest";

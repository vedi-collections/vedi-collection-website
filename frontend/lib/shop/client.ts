// Shop data access — the SINGLE seam between the storefront and its data source.
//
// Backed by the live backend API (GET /products), mapping the API product shape
// into the storefront `Product` view-model. The public API only returns
// live + active products, so the storefront shows exactly what's launched.
// Fields the API doesn't carry yet (audience/category/MRP/badges) get defaults.

import { API_URL } from "@/lib/api";

import { isVideoUrl } from "./media";
import { COLLECTIONS, PRICE_BUCKETS } from "./mock-collections";
import type { Collection, Product, ProductFilters, ProductSort } from "./types";

type ApiAudience = "women" | "men";

type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number; // whole rupees (INR) — sale price
  mrp: number | null; // whole rupees (INR) — original price; null when not discounted
  stock_quantity: number;
  images: string[];
  audience: ApiAudience;
  subcategory: string | null;
};

/** Backend audience (women/men) -> storefront audience (ladies/gents). */
const AUDIENCE_MAP: Record<ApiAudience, Product["audience"]> = {
  women: "ladies",
  men: "gents",
};

/** Slugify a sub-category for URL/filter matching, e.g. "Safari Cloth" -> "safari-cloth". */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Map an API product into the storefront view-model. Defaults fill the richer
 *  fields the API doesn't carry yet (MRP/badges/attributes). */
function mapApiProduct(p: ApiProduct): Product {
  const media = p.images ?? [];
  // The card thumbnail and OG/social preview need a still image. A product's
  // cover (media[0]) can be a video — videos upload before images, so they land
  // first — and an <img> can't render an .mp4. Use the first actual image; the
  // detail gallery still receives the full `media` list (video included).
  const image = media.find((url) => !isVideoUrl(url)) ?? null;
  const subcategory = p.subcategory?.trim() || null;
  return {
    id: p.id,
    retailerId: p.id,
    name: p.name,
    shade: p.description ?? "",
    audience: AUDIENCE_MAP[p.audience] ?? "ladies",
    category: subcategory ?? "Collection",
    categorySlug: subcategory ? slugify(subcategory) : "all",
    colorFamilies: [],
    priceMinor: p.price * 100, // API stores whole rupees; storefront formats paise (/100)
    // Only treat mrp as a real discount when it's above the sale price.
    mrpMinor: p.mrp != null && p.mrp > p.price ? p.mrp * 100 : null,
    currency: "INR",
    tag: null,
    sizes: [],
    unit: "",
    attributes: { fabric: "", includes: "", care: "" },
    variants: [{ name: p.name, c1: "#571b2c", c2: "#3e1220", imageUrl: image }],
    imageUrl: image,
    media,
    stock: p.stock_quantity,
    isActive: true,
  };
}

/** All live products from the backend. Returns [] if the API is unreachable so
 *  SSR never crashes — the storefront just shows no products. */
async function fetchLiveProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { products: ApiProduct[] };
    return data.products.map(mapApiProduct);
  } catch {
    return [];
  }
}

function matchesFilters(p: Product, filters: ProductFilters): boolean {
  if (filters.collection === "ladies" && p.audience !== "ladies") return false;
  if (filters.collection === "gents" && p.audience !== "gents") return false;
  if (filters.categorySlug && p.categorySlug !== filters.categorySlug) return false;
  if (filters.audience && p.audience !== filters.audience) return false;
  if (filters.colorFamily && !p.colorFamilies.includes(filters.colorFamily)) return false;
  if (filters.priceBucket) {
    const bucket = PRICE_BUCKETS.find((b) => b.slug === filters.priceBucket);
    if (bucket) {
      if (p.priceMinor < bucket.min) return false;
      if (bucket.max !== null && p.priceMinor >= bucket.max) return false;
    }
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    if (!`${p.name} ${p.shade} ${p.category}`.toLowerCase().includes(q)) return false;
  }
  return true;
}

function sortProducts(list: Product[], sort: ProductSort | undefined): Product[] {
  const out = [...list];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.priceMinor - b.priceMinor);
    case "price-desc":
      return out.sort((a, b) => b.priceMinor - a.priceMinor);
    case "popularity":
    case "newest":
    default:
      return out; // API order (newest first) is the default
  }
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const live = await fetchLiveProducts();
  return sortProducts(
    live.filter((p) => matchesFilters(p, filters)),
    filters.sort,
  );
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return mapApiProduct((await res.json()) as ApiProduct);
  } catch {
    return null;
  }
}

export async function getAllProductIds(): Promise<string[]> {
  return (await fetchLiveProducts()).map((p) => p.id);
}

export async function getCollections(): Promise<Collection[]> {
  return COLLECTIONS;
}

export async function searchProducts(q: string, filters: ProductFilters = {}): Promise<Product[]> {
  return getProducts({ ...filters, q });
}

export async function getBestSellers(): Promise<Product[]> {
  return getProducts({});
}

export async function getNewArrivals(): Promise<Product[]> {
  return getProducts({ sort: "newest" });
}

/** Products related to `product` (other live products, excluding itself). */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const live = await fetchLiveProducts();
  return live.filter((p) => p.id !== product.id).slice(0, limit);
}

/** Available facet values for a set of products (drives the filter sidebar). */
export function getFacets(products: Product[]): {
  colorFamilies: string[];
  categories: { slug: string; label: string }[];
} {
  const colors = new Set<string>();
  const categories = new Map<string, string>();
  for (const p of products) {
    p.colorFamilies.forEach((c) => colors.add(c));
    categories.set(p.categorySlug, p.category);
  }
  return {
    colorFamilies: [...colors],
    categories: [...categories].map(([slug, label]) => ({ slug, label })),
  };
}

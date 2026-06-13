// Shop data access — the SINGLE seam between the storefront and its data source.
//
// Today every function reads from the in-memory mock modules. When the backend
// `/shop/*` endpoints are ready, swap each function body to `fetch(`${API_URL}…`)`
// and map the response into the Product shape — callers (server components) and
// components stay unchanged. Functions are async to mirror that future I/O.

import { MOCK_PRODUCTS, type MockProduct } from "./mock-products";
import { COLLECTIONS, PRICE_BUCKETS } from "./mock-collections";
import type { Collection, Product, ProductFilters, ProductSort } from "./types";

const CATEGORY_SLUGS = new Set(["suits", "pant-shirt-cloth", "safari-cloth"]);

function isActive(p: MockProduct): boolean {
  return p.isActive;
}

/** Whether a product belongs to a given collection slug. */
function productInCollection(p: MockProduct, slug: string): boolean {
  switch (slug) {
    case "all-products":
      return isActive(p);
    case "best-sellers":
      return Boolean(p.bestSeller);
    case "new-arrivals":
      return Boolean(p.newArrival);
    case "ladies":
      return p.audience === "ladies";
    case "gents":
      return p.audience === "gents";
    default:
      return CATEGORY_SLUGS.has(slug) ? p.categorySlug === slug : false;
  }
}

function matchesFilters(p: MockProduct, filters: ProductFilters): boolean {
  if (filters.collection && !productInCollection(p, filters.collection)) return false;
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
    const haystack = `${p.name} ${p.shade} ${p.category}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function sortProducts(list: MockProduct[], sort: ProductSort | undefined): MockProduct[] {
  const out = [...list];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.priceMinor - b.priceMinor);
    case "price-desc":
      return out.sort((a, b) => b.priceMinor - a.priceMinor);
    case "newest":
      return out.sort((a, b) => Number(Boolean(b.newArrival)) - Number(Boolean(a.newArrival)));
    case "popularity":
    default:
      return out; // mock order = curated popularity
  }
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const filtered = MOCK_PRODUCTS.filter(isActive).filter((p) => matchesFilters(p, filters));
  return sortProducts(filtered, filters.sort);
}

export async function getProduct(id: string): Promise<Product | null> {
  return MOCK_PRODUCTS.find((p) => p.id === id && p.isActive) ?? null;
}

export async function getAllProductIds(): Promise<string[]> {
  return MOCK_PRODUCTS.filter(isActive).map((p) => p.id);
}

export async function getCollections(): Promise<Collection[]> {
  return COLLECTIONS;
}

export async function searchProducts(q: string, filters: ProductFilters = {}): Promise<Product[]> {
  return getProducts({ ...filters, q });
}

export async function getBestSellers(): Promise<Product[]> {
  return getProducts({ collection: "best-sellers" });
}

export async function getNewArrivals(): Promise<Product[]> {
  return getProducts({ collection: "new-arrivals" });
}

/** Products related to `product` (same category, excluding itself). */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const same = MOCK_PRODUCTS.filter(
    (p) => p.isActive && p.id !== product.id && p.categorySlug === product.categorySlug
  );
  return same.slice(0, limit);
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
    categories: [...categories].map(([slug, label]) => ({ slug, label }))
  };
}

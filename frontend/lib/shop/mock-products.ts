// Mock catalog — shaped EXACTLY like lib/shop/types.ts Product so that swapping
// to the real `/shop/products` API (mapped inside lib/shop/client.ts) needs no
// component changes. Prices are PAISE. Order is treated as "popularity".
//
// `bestSeller` / `newArrival` flags drive the curated home + nav collections.

import type { Product } from "./types";

export type MockProduct = Product & { bestSeller?: boolean; newArrival?: boolean };

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "1",
    retailerId: "VEDI-LS-001",
    name: "Embroidered Cotton Suit",
    shade: "Deep Maroon",
    audience: "ladies",
    category: "Suits",
    categorySlug: "suits",
    colorFamilies: ["maroon"],
    priceMinor: 185000,
    mrpMinor: 240000,
    currency: "INR",
    tag: "Bestseller",
    sizes: [],
    unit: "1 suit set",
    attributes: {
      fabric: "Pure cotton, unstitched",
      includes: "Kurta 2.5m + salwar 2m + dupatta 2.25m",
      care: "Gentle hand wash",
      fit: "Unstitched",
      occasion: "Festive & daily"
    },
    variants: [
      { name: "Deep Maroon", c1: "#7A2640", c2: "#42101F" },
      { name: "Wine", c1: "#5B1428", c2: "#2E0A14" }
    ],
    imageUrl: null,
    isActive: true,
    bestSeller: true
  },
  {
    id: "2",
    retailerId: "VEDI-LS-002",
    name: "Banarasi Silk Suit",
    shade: "Emerald Green",
    audience: "ladies",
    category: "Suits",
    categorySlug: "suits",
    colorFamilies: ["green"],
    priceMinor: 345000,
    mrpMinor: 420000,
    currency: "INR",
    tag: "Festive",
    sizes: [],
    unit: "1 suit set",
    attributes: {
      fabric: "Banarasi silk blend, unstitched",
      includes: "Kurta 2.5m + bottom 2m + dupatta 2.25m",
      care: "Dry clean only",
      fit: "Unstitched",
      occasion: "Festive & wedding"
    },
    variants: [
      { name: "Emerald Green", c1: "#1E6B52", c2: "#0C3A2C" },
      { name: "Royal Blue", c1: "#1E3F6B", c2: "#0C1E3A" }
    ],
    imageUrl: null,
    isActive: true
  },
  {
    id: "3",
    retailerId: "VEDI-LS-003",
    name: "Chikankari Georgette Suit",
    shade: "Powder Blue",
    audience: "ladies",
    category: "Suits",
    categorySlug: "suits",
    colorFamilies: ["blue"],
    priceMinor: 225000,
    mrpMinor: null,
    currency: "INR",
    tag: "Handwork",
    sizes: [],
    unit: "1 suit set",
    attributes: {
      fabric: "Georgette, Lucknowi chikankari",
      includes: "Kurta 2.5m + bottom 2m + dupatta 2.25m",
      care: "Gentle hand wash",
      fit: "Unstitched",
      occasion: "Daily & occasion"
    },
    variants: [
      { name: "Powder Blue", c1: "#9DB8CC", c2: "#5E7E96", light: true },
      { name: "Blush Pink", c1: "#D7A9B0", c2: "#A56F78", light: true }
    ],
    imageUrl: null,
    isActive: true,
    newArrival: true
  },
  {
    id: "4",
    retailerId: "VEDI-LS-004",
    name: "Bandhani Suit Set",
    shade: "Mustard",
    audience: "ladies",
    category: "Suits",
    categorySlug: "suits",
    colorFamilies: ["yellow"],
    priceMinor: 165000,
    mrpMinor: 210000,
    currency: "INR",
    tag: null,
    sizes: [],
    unit: "1 suit set",
    attributes: {
      fabric: "Cotton-silk, hand-tied bandhani",
      includes: "Kurta 2.5m + salwar 2m + dupatta 2.25m",
      care: "Dry clean only",
      fit: "Unstitched",
      occasion: "Festive & daily"
    },
    variants: [{ name: "Mustard", c1: "#D49A2E", c2: "#8A5A14" }],
    imageUrl: null,
    isActive: true
  },
  {
    id: "5",
    retailerId: "VEDI-LS-005",
    name: "Chanderi Suit Set",
    shade: "Ivory & Gold",
    audience: "ladies",
    category: "Suits",
    categorySlug: "suits",
    colorFamilies: ["cream", "gold"],
    priceMinor: 245000,
    mrpMinor: null,
    currency: "INR",
    tag: "New",
    sizes: [],
    unit: "1 suit set",
    attributes: {
      fabric: "Chanderi cotton-silk, woven butta",
      includes: "Kurta 2.5m + bottom 2m + dupatta 2.25m",
      care: "Gentle hand wash",
      fit: "Unstitched",
      occasion: "Festive & wedding"
    },
    variants: [{ name: "Ivory & Gold", c1: "#E6D5AE", c2: "#C2A05E", light: true }],
    imageUrl: null,
    isActive: true,
    newArrival: true
  },
  {
    id: "6",
    retailerId: "VEDI-LS-006",
    name: "Phulkari Suit Set",
    shade: "Sunset Orange",
    audience: "ladies",
    category: "Suits",
    categorySlug: "suits",
    colorFamilies: ["orange"],
    priceMinor: 195000,
    mrpMinor: 250000,
    currency: "INR",
    tag: "Handwork",
    sizes: [],
    unit: "1 suit set",
    attributes: {
      fabric: "Cotton, Punjabi phulkari dupatta",
      includes: "Kurta 2.5m + salwar 2m + dupatta 2.25m",
      care: "Gentle hand wash",
      fit: "Unstitched",
      occasion: "Festive & daily"
    },
    variants: [{ name: "Sunset Orange", c1: "#D96A2B", c2: "#9A3A18" }],
    imageUrl: null,
    isActive: true,
    bestSeller: true
  },
  {
    id: "7",
    retailerId: "VEDI-GF-001",
    name: "Cotton Pant-Shirt Combo",
    shade: "Steel Grey & Sky Blue",
    audience: "gents",
    category: "Pant-Shirt Cloth",
    categorySlug: "pant-shirt-cloth",
    colorFamilies: ["grey", "blue"],
    priceMinor: 145000,
    mrpMinor: 180000,
    currency: "INR",
    tag: "Bestseller",
    sizes: [],
    unit: "1 combo",
    attributes: {
      fabric: "Premium combed cotton",
      includes: "Pant 1.2m + shirt 1.6m",
      care: "Machine wash cold",
      fit: "Tailoring fabric",
      occasion: "Office & daily"
    },
    variants: [
      { name: "Steel Grey & Sky Blue", c1: "#5E7282", c2: "#2E3A44" },
      { name: "Charcoal & White", c1: "#3C434B", c2: "#1C2126" }
    ],
    imageUrl: null,
    isActive: true,
    bestSeller: true
  },
  {
    id: "8",
    retailerId: "VEDI-GF-002",
    name: "Linen Blend Combo",
    shade: "Natural Beige & White",
    audience: "gents",
    category: "Pant-Shirt Cloth",
    categorySlug: "pant-shirt-cloth",
    colorFamilies: ["beige"],
    priceMinor: 210000,
    mrpMinor: 260000,
    currency: "INR",
    tag: "Premium",
    sizes: [],
    unit: "1 combo",
    attributes: {
      fabric: "Linen-cotton blend",
      includes: "Pant 1.2m + shirt 1.6m",
      care: "Gentle wash, warm iron",
      fit: "Tailoring fabric",
      occasion: "Resort & occasion"
    },
    variants: [{ name: "Natural Beige & White", c1: "#C7B299", c2: "#8A744F", light: true }],
    imageUrl: null,
    isActive: true
  },
  {
    id: "9",
    retailerId: "VEDI-GF-003",
    name: "Terry Rayon Combo",
    shade: "Navy & Cream",
    audience: "gents",
    category: "Pant-Shirt Cloth",
    categorySlug: "pant-shirt-cloth",
    colorFamilies: ["blue", "cream"],
    priceMinor: 115000,
    mrpMinor: 150000,
    currency: "INR",
    tag: null,
    sizes: [],
    unit: "1 combo",
    attributes: {
      fabric: "Terry rayon suiting + shirting",
      includes: "Pant 1.2m + shirt 1.6m",
      care: "Machine wash cold",
      fit: "Tailoring fabric",
      occasion: "Office & daily"
    },
    variants: [{ name: "Navy & Cream", c1: "#2E4A78", c2: "#16263F" }],
    imageUrl: null,
    isActive: true
  },
  {
    id: "10",
    retailerId: "VEDI-GF-004",
    name: "Giza Cotton Shirt Cloth",
    shade: "Crisp White",
    audience: "gents",
    category: "Pant-Shirt Cloth",
    categorySlug: "pant-shirt-cloth",
    colorFamilies: ["white"],
    priceMinor: 99900,
    mrpMinor: null,
    currency: "INR",
    tag: "New",
    sizes: [],
    unit: "1.6m cut",
    attributes: {
      fabric: "Giza cotton shirting",
      includes: "Shirt length 1.6m",
      care: "Machine wash cold",
      fit: "Tailoring fabric",
      occasion: "Office & formal"
    },
    variants: [{ name: "Crisp White", c1: "#E8E4D8", c2: "#B8B09A", light: true }],
    imageUrl: null,
    isActive: true,
    newArrival: true
  },
  {
    id: "11",
    retailerId: "VEDI-GF-005",
    name: "Classic Safari Cloth",
    shade: "Olive Green",
    audience: "gents",
    category: "Safari Cloth",
    categorySlug: "safari-cloth",
    colorFamilies: ["green"],
    priceMinor: 195000,
    mrpMinor: 240000,
    currency: "INR",
    tag: "Classic",
    sizes: [],
    unit: "2.5m cut",
    attributes: {
      fabric: "Poly-viscose safari suiting",
      includes: "Safari suit length 2.5m",
      care: "Machine wash cold",
      fit: "Tailoring fabric",
      occasion: "Daily & travel"
    },
    variants: [{ name: "Olive Green", c1: "#5A6B42", c2: "#2C361E" }],
    imageUrl: null,
    isActive: true
  },
  {
    id: "12",
    retailerId: "VEDI-GF-006",
    name: "Premium Safari Cloth",
    shade: "Slate Grey",
    audience: "gents",
    category: "Safari Cloth",
    categorySlug: "safari-cloth",
    colorFamilies: ["grey"],
    priceMinor: 225000,
    mrpMinor: 280000,
    currency: "INR",
    tag: null,
    sizes: [],
    unit: "2.5m cut",
    attributes: {
      fabric: "Wool-blend safari suiting",
      includes: "Safari suit length 2.5m",
      care: "Dry clean only",
      fit: "Tailoring fabric",
      occasion: "Office & occasion"
    },
    variants: [{ name: "Slate Grey", c1: "#6B7280", c2: "#333A45" }],
    imageUrl: null,
    isActive: true
  }
];

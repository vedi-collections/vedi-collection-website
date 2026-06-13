# Handoff: Vedi Collections — Online Store

## Overview
Vedi Collections is a WhatsApp-first online store for an Indian fabric boutique based in Jaipur. It sells unstitched dress materials: **Ladies Suits** (active), **Sarees** (coming soon), **Haryanvi Dress** (coming soon); and **Gents** fabric: **Pant-Shirt Cloth** and **Safari Cloth**.

The checkout flow is WhatsApp-based — the site builds a cart, then generates a pre-filled WhatsApp message for the customer to send to the shop. There is no payment gateway integration in the design; the owner handles order confirmation and payment (UPI / Cash on Delivery) manually via WhatsApp.

---

## About the Design Files
The files `Vedi Collections Mobile.html` and `Vedi Collections Desktop.html` in this folder are **HTML design prototypes** — high-fidelity references showing intended layout, visual style, interactions, and copy. They are **not** production code to copy directly.

The developer's task is to **recreate these designs in the target codebase** (React + Next.js recommended for a real store, or React Native / Expo for a mobile app). Use the prototypes as pixel-level references and implement them with the codebase's existing patterns, component library, and routing conventions. If no codebase exists yet, React + Next.js is the best choice.

---

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, interactions, and animations are final and should be implemented pixel-accurately. The only placeholder is the WhatsApp phone number (`+91 98765 43210`) which must be replaced with the real number before launch, and product images (currently fabric-gradient placeholders — replace with real photos).

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| `--maroon-dark` | `#3E0F1E` | Page footer background, deepest text |
| `--maroon` | `#571B2C` | Primary CTA background, header logo |
| `--maroon-mid` | `#6E2138` | Hero gradient start, badge text |
| `--maroon-light` | `#4A1322` | Announcement bar |
| `--gold` | `#B98A3C` | Sub-brand wordmark, badge fill, progress bar |
| `--gold-light` | `#D8B36A` | Hero CTA button, "soon" chips |
| `--gold-pale` | `#EBD9A8` | Announcement bar text |
| `--cream-bg` | `#FAF5EC` | Page background, card background |
| `--cream-warm` | `#FFFDF7` | Button backgrounds, input backgrounds |
| `--cream-border` | `#EADFC9` | Dividers, card borders |
| `--cream-tag` | `#F3EAD7` | Info box background |
| `--text-dark` | `#2B161E` | Body text |
| `--text-heading` | `#3E1220` | Product names, section headings |
| `--text-mid` | `#6B4A53` | Secondary body text |
| `--text-muted` | `#9A7E85` | Captions, shade labels |
| `--text-muted-2` | `#B59CA3` | Strikethrough price |
| `--whatsapp` | `#1FA855` | WhatsApp CTA buttons, links |
| `--whatsapp-dark` | `#16703A` | WhatsApp link text on light |
| `--body-bg` | `#EFE6D5` | Page outer background (behind the centred column) |

### Typography
| Role | Family | Weight | Size (mobile) | Size (desktop) |
|---|---|---|---|---|
| Brand wordmark "Vedi" | Cormorant Garamond | 700 | 24px | 28px |
| Hero headline | Cormorant Garamond | 600 | 34px | 52px |
| Section headings | Cormorant Garamond | 600 | 22px | 32px |
| Product name heading (detail) | Cormorant Garamond | 600 | 27px | 32px |
| Body / labels | Karla | 400–700 | 12–15px | 13–16px |
| Sub-brand "COLLECTIONS" | Karla | 700 | 9px, `letter-spacing: 0.34em`, uppercase | 10px |
| Eyebrow labels | Karla | 700 | 11px, `letter-spacing: 0.18–0.22em`, uppercase | 11–12px |

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Karla:wght@400;500;600;700&display=swap
```

### Spacing
- Page horizontal padding: `16px` mobile / `32px` desktop
- Max content width: `430px` mobile / `1280px` desktop
- Card border radius: `12px` mobile / `14px` desktop
- Section border radius: `16px` mobile / `20px` desktop
- Button border radius: `999px` (pill) for all CTAs; `10–12px` for secondary/size buttons
- Gap between product cards: `14px 12px` mobile / `28px 20px` desktop

### Shadows
- Product card hover: `0 14px 30px rgba(60, 20, 30, 0.22)`
- Floating WhatsApp button: `0 6px 18px rgba(20, 90, 50, 0.4)` mobile / `0 8px 22px` desktop
- Quick-add button: `0 2px 8px rgba(40, 10, 18, 0.25)`
- Cart/modal backdrop: `rgba(30, 10, 16, 0.45–0.5)` full-screen overlay

### Animations
```css
@keyframes vcUp {
  from { transform: translateY(28px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes vcFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```
- Product detail overlay: `vcFade 0.2s ease` on backdrop, `vcUp 0.3s ease` on sheet
- Cart drawer: `vcFade 0.2s ease` on backdrop, `vcUp 0.3s ease` on sheet (mobile) / `vcRight 0.25s ease` (desktop)
- Toast: `vcUp 0.25s ease`
- Product card hover: `transform: translateY(-4px)` + shadow, `transition: 0.18s ease`

---

## Screens / Views

### 1. Store (home) — Mobile

**Layout:** single column, max-width 430px, centred with outer `background: #EFE6D5`.

**Announcement bar**
- Background: `#4A1322`
- Text: "Free shipping pan-India above ₹1,999"
- Style: 11px Karla 600, `letter-spacing: 0.14em`, uppercase, white `#EBD9A8`, `padding: 8px 12px`, `text-align: center`

**Header** (sticky, `top: 0`, `z-index: 20`)
- Background: `rgba(250,245,236,0.94)` with `backdrop-filter: blur(8px)`
- Bottom border: `1px solid #EADFC9`
- Padding: `12px 16px`
- Left: wordmark stack — "Vedi" (Cormorant Garamond 700, 24px, `#571B2C`) + "COLLECTIONS" (Karla 700, 9px, `letter-spacing: 0.34em`, `#B98A3C`)
- Right: Bag icon button — `42×42px` circle, `border: 1px solid #E2D3B4`, `background: #FFFDF7`; cart count badge: `18px` circle `#B98A3C` gold, positioned `top: -4px, right: -4px`

**Hero section**
- Margin: `14px 14px 6px`; border-radius: `16px`
- Background: three-layer CSS gradient (maroon dark `#6E2138` → `#3E0F1E`, subtle diagonal texture lines, gold bar at base)
- Eyebrow: "The Festive Edit '26" — 11px, `#D8B36A`, letter-spacing 0.22em
- H1: "Woven for the moments that matter" — Cormorant Garamond 600, 34px, `#FAF1DC`, line-height 1.12
- Body: 14px, `rgba(250,241,220,0.78)`, max-width 30ch
- CTA: "Shop the edit" — pill button, `background: #D8B36A`, `color: #3E0F1E`, 13px Karla 700, `padding: 12px 22px`
- Click scrolls to product grid section

**Category nav** (two rows)
- Row 1 — Main tabs: All / Ladies / Gents
  - Each: `flex: 1`, pill, `padding: 10px 12px`, 13px Karla 700
  - Active: `background: #571B2C`, `color: #FAF1DC`, `border: 1px solid #571B2C`
  - Inactive: `background: #FFFDF7`, `color: #6B4A53`, `border: 1px solid #E2D3B4`
  - Selecting a main tab resets sub to `null`
- Row 2 — Sub-chips (visible only when Ladies or Gents is active):
  - Ladies subs: Suits · Sarees (· soon) · Haryanvi Dress (· soon)
  - Gents subs: Pant-Shirt Cloth · Safari Cloth
  - Active: `background: #B98A3C`, `color: #FFFDF7`, `border: #B98A3C`
  - "soon" label: inline, muted colour `#B59CA3`
  - Horizontally scrollable, `scrollbar-width: none`
  - Tapping an already-active sub deselects it (shows all in that main category)

**Product grid**
- Padding: `14px 16px 6px`
- Section title row: Cormorant Garamond 600, 22px, `#3E1220` left / item count 12px `#9A7E85` right
- Grid: 2 columns, `gap: 14px 12px`
- Each card:
  - Image placeholder: `aspect-ratio: 3/4`, `border-radius: 12px`, fabric gradient background (each product has unique colour pair `c1`/`c2`)
  - Decorative "✦" centred, Cormorant Garamond italic, 30px
  - Tag badge (top-left): 9px, uppercase, `#6E2138` on cream `rgba(250,245,236,0.93)`, pill
  - Quick-add button (bottom-right): `32×32px` circle, cream, `+` symbol; click adds to cart without opening detail
  - Product name: 13px Karla 600
  - Shade: 12px `#9A7E85`
  - Price: 14px Karla 700 `#3E1220` + strikethrough MRP 12px `#B59CA3`

**Coming-soon panel** (replaces grid when a "soon" sub is selected)
- Dashed border `#D8C9A8`, `border-radius: 16px`, `background: #F7F0DF`
- Italic Cormorant Garamond 25px heading + body + WhatsApp "Notify me" button (green pill)
- WhatsApp link pre-fills: "Please let me know when [SubcategoryName] arrives at Vedi Collections."

**Trust strip**
- 3 columns: "Mill-direct", "COD + UPI", "WhatsApp"
- Top + bottom border `1px solid #EADFC9`
- Label: 12px Karla 700 `#571B2C` / caption: 11px `#9A7E85`

**Footer**
- Background: `#3E0F1E`
- Padding: `28px 20px 90px` (extra bottom for floating button clearance)
- Wordmark, 13px body text, gold WhatsApp link, copyright line

**Floating WhatsApp button** (fixed, bottom-right)
- `52×52px` circle, `background: #1FA855`
- `position: fixed; bottom: 18px; right: max(18px, calc(50% - 197px))` (stays within the 430px column on wide screens)
- Opens `https://wa.me/[NUMBER]?text=Namaste! I'd like to know more about Vedi Collections.`

---

### 2. Product Detail — Mobile (full-screen overlay)

**Trigger:** tap product card anywhere except the + button.

**Layout:** fixed full-screen sheet, slides up (`vcUp`), `z-index: 40`.

**Image area** (top, height 430px)
- Same gradient background as card
- Large "✦" 54px centred
- Back button (←): `38×38px` circle, top-left, cream on `rgba(250,245,236,0.94)`

**Info area** (scrollable)
- Eyebrow: `[Main] · [Category] · [Tag]` — 11px, gold `#B98A3C`, letter-spacing 0.18em
- Product name: Cormorant Garamond 600, 27px, `#3E1220`
- Shade: 14px `#9A7E85`
- Price row: 22px bold `#3E1220` + strikethrough MRP 14px `#B59CA3` + savings "Save ₹X" 12px bold `#1FA855`
- Spec table (Fabric / Includes / Care): `label 64px` `#9A7E85` + `value` bold `#3E1220`; separated by `border-top: 1px solid #EADFC9`
- WhatsApp info box: `background: #F3EAD7`, `border-radius: 12px`, 13px text with green link

**Bottom CTA bar** (sticky)
- Border-top `#EADFC9`, padding includes `env(safe-area-inset-bottom)` for iPhone safe area
- "Add to bag" button: flex 1, `height: 50px`, `background: #571B2C`, `color: #FAF1DC`
- "Order now" button: flex 1, `height: 50px`, `background: #1FA855`, white text, WhatsApp icon
  - Pre-fills: "Namaste! I'm interested in the *[Name — Shade]* (₹[price]). Is it available?"

---

### 3. Bag — Mobile (bottom sheet)

**Trigger:** tap bag icon in header. Backdrop tap closes.

**Layout:** bottom sheet, max-height 84vh, `border-radius: 20px 20px 0 0`, slides up.

**Header row:** "Your bag (N)" Cormorant Garamond 23px + ✕ close button

**Cart rows** (scrollable list):
- 58×74px thumbnail (gradient placeholder) + name + shade · unit + qty stepper + line total
- Qty stepper: pill border `#D8C9A8`, `−` / qty / `+`, `30×30px` buttons

**Footer (sticky):**
- Free-shipping progress: message text + 5px pill bar (`#EADFC9` track, `#B98A3C` fill, width = `(subtotal/1999)*100%`)
- Subtotal: 19px bold
- "Checkout on WhatsApp": full-width `52px` green button
  - Pre-fills full order: `• [Name] ([Shade], [unit]) × [qty] — ₹[line]\n...\nSubtotal: ₹X`
- Small note: "pay via UPI or Cash on Delivery"

**Empty state:** italic "Your bag is empty" + browse CTA

---

### 4. Store (home) — Desktop (≥1280px)

Same data and logic as mobile; layout differences:

**Header** (sticky)
- Max-width 1280px, padding `14px 32px`
- Left: wordmark | Centre: main category nav (All / Ladies / Gents) as text buttons | Right: "Chat with us" WhatsApp pill + "Bag (N)" pill button

**Hero** (split 1.1fr / 1fr)
- Left: headline text + CTA
- Right: two featured product cards (Embroidered Cotton Suit + Zari Bridal Lehenga) displayed at `200×267px`, overlapping (`margin-left: -44px`), rotated (`-4deg` / `+4deg`), hover straightens to `rotate(0) translateY(-6px)`

**Category sub-chips** appear above the product grid (not in a separate row in the header)

**Product grid:** 4 columns, `gap: 28px 20px`

**Product detail:** centred modal `min(920px, calc(100vw-64px))`, two-pane (image left | info right), `border-radius: 20px`, `box-shadow: 0 30px 80px rgba(20,5,10,0.5)`

**Cart:** right-side drawer `width: min(440px, 100vw)`, slides in from the right (`vcRight`)

**Footer:** 3-column grid (brand + description | Shop links | Contact)

**Floating WhatsApp button:** `56×56px`, `bottom: 24px; right: 24px` (fixed to viewport, not column-constrained)

---

## State Management

```
state = {
  main: 'All' | 'Ladies' | 'Gents',   // active main category tab
  sub:  null | string,                  // active subcategory name; null = show all in main
  selId: null | number,                 // product ID for detail view; null = closed
  selSize: null | string,               // selected size in detail (currently unused — cloth is sold by the cut)
  cart: Array<{ id, size, qty }>,       // bag items
  toast: string,                        // "" = hidden; non-empty = show toast pill
  cartOpen: boolean                     // bag sheet/drawer open
}
```

**Key logic:**
- `filtered = PRODUCTS.filter(p => (main === 'All' || p.main === main) && (!sub || p.cat === sub))`
- If the selected sub has `soon: true`, show coming-soon panel instead of grid
- `addToCart(product, unit)` — upserts by `(id, size)` key
- `waLink(text)` — `https://wa.me/919876543210?text=encodeURIComponent(text)`
- `shipPct = Math.min(100, Math.round((subtotal / 1999) * 100))`
- Toast auto-dismisses after 2200ms
- Body scroll locked when detail or cart is open

---

## Product Data Schema

```js
{
  id: number,
  name: string,          // product display name
  shade: string,         // colour description
  main: 'Ladies' | 'Gents',
  cat: 'Suits' | 'Pant-Shirt Cloth' | 'Safari Cloth',
  price: number,         // selling price in INR
  mrp: number | null,    // original/MRP price; null = no strikethrough
  tag: string | null,    // badge: 'Bestseller' | 'New' | 'Festive' | 'Handwork' | 'Premium' | 'Classic' | null
  c1: string,            // CSS hex — gradient top colour (for placeholder)
  c2: string,            // CSS hex — gradient bottom colour (for placeholder)
  fabric: string,        // e.g. "Pure cotton, unstitched"
  work: string,          // what's included, e.g. "Kurta 2.5m + salwar 2m + dupatta 2.25m"
  care: string,          // care instructions
  unit: string,          // unit label shown in cart: "1 suit set" | "1 combo" | "2.5m cut" etc.
  light: boolean,        // true = decorative motif uses dark colour (for light-bg products)
}
```

**Current 12 products:**

| # | Name | Main | Cat | Price | MRP |
|---|---|---|---|---|---|
| 1 | Embroidered Cotton Suit — Deep Maroon | Ladies | Suits | ₹1,850 | ₹2,400 |
| 2 | Banarasi Silk Suit — Emerald Green | Ladies | Suits | ₹3,450 | ₹4,200 |
| 3 | Chikankari Georgette Suit — Powder Blue | Ladies | Suits | ₹2,250 | — |
| 4 | Bandhani Suit Set — Mustard | Ladies | Suits | ₹1,650 | ₹2,100 |
| 5 | Chanderi Suit Set — Ivory & Gold | Ladies | Suits | ₹2,450 | — |
| 6 | Phulkari Suit Set — Sunset Orange | Ladies | Suits | ₹1,950 | ₹2,500 |
| 7 | Cotton Pant-Shirt Combo — Steel Grey × Sky Blue | Gents | Pant-Shirt Cloth | ₹1,450 | ₹1,800 |
| 8 | Linen Blend Combo — Natural Beige × White | Gents | Pant-Shirt Cloth | ₹2,100 | ₹2,600 |
| 9 | Terry Rayon Combo — Navy × Cream | Gents | Pant-Shirt Cloth | ₹1,150 | ₹1,500 |
| 10 | Giza Cotton Shirt Cloth — Crisp White | Gents | Pant-Shirt Cloth | ₹999 | — |
| 11 | Classic Safari Cloth — Olive Green | Gents | Safari Cloth | ₹1,950 | ₹2,400 |
| 12 | Premium Safari Cloth — Slate Grey | Gents | Safari Cloth | ₹2,250 | ₹2,800 |

---

## Category Structure

```
All
├── Ladies
│   ├── Suits          ← live (6 products)
│   ├── Sarees         ← coming soon
│   └── Haryanvi Dress ← coming soon
└── Gents
    ├── Pant-Shirt Cloth  ← live (4 products)
    └── Safari Cloth      ← live (2 products)
```

---

## WhatsApp Integration

All ordering flows through WhatsApp. Replace `919876543210` with the real number (country code + number, no `+`, no spaces).

| Flow | Pre-filled message |
|---|---|
| Product enquiry | "Namaste! I'm interested in the *[Name — Shade]* (₹[price]). Is it available?" |
| Cart checkout | "Namaste! I'd like to place an order…\n• [item] × [qty] — ₹[line]\n…\nSubtotal: ₹X" |
| Coming-soon notify | "Please let me know when [SubcategoryName] arrives at Vedi Collections." |
| General enquiry (floating button) | "Namaste! I'd like to know more about Vedi Collections." |

---

## Assets

- **Product images:** currently CSS gradient placeholders. Replace with real product photos at `aspect-ratio: 3/4` (portrait). Recommended: 600×800px minimum, WebP format.
- **Logo:** text wordmark only ("Vedi / COLLECTIONS"). No image file.
- **Icons:** inline SVG only — shopping bag, WhatsApp logo. No icon library dependency.
- **Fonts:** loaded from Google Fonts CDN. For production consider self-hosting for performance.

---

## Files in this Bundle

| File | Description |
|---|---|
| `Vedi Collections Mobile.html` | Full mobile prototype (380–430px) with all interactions |
| `Vedi Collections Desktop.html` | Full desktop prototype (1280px) with all interactions |
| `README.md` | This document |

Open either HTML file directly in a browser to see the live prototype — no build step required.

---

## Implementation Notes for Claude Code

1. **Replace placeholder number** `919876543210` everywhere with real WhatsApp number before going live.
2. **Product images:** swap gradient placeholders with real `<img>` tags at `aspect-ratio: 3/4`. Keep the card structure identical.
3. **Data source:** product data is currently hardcoded. For a real store, pull it from a simple JSON file, a CMS (Contentful, Sanity), or a Google Sheet via API — the schema above maps directly.
4. **Coming-soon toggle:** `soon: true` on a subcategory definition controls the coming-soon panel. Set to `false` when the category is ready to launch.
5. **Free shipping threshold** `₹1,999` is hardcoded as `FREE_SHIP = 1999` — make it a config constant.
6. **Safe area:** the mobile cart footer uses `env(safe-area-inset-bottom)` — keep this for iOS notch/home-bar support.
7. **No auth / accounts** — this is a catalogue + WhatsApp redirect, not a transactional e-commerce site.

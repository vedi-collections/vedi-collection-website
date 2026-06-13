# CLAUDE.md — Vedi Collections

## What this project is

A single-seller e-commerce website for "Vedi Collections" (boutique seller, India).
The seller manages products in her **WhatsApp Business catalog** (stored in Meta
Commerce Manager). This website syncs that catalog via the **Meta Graph API** so
she never uploads products twice. Customers browse and order; the seller gets a
private dashboard.

Core constraints:
- Exactly ONE seller (the client). No seller registration flow. Her account is
  seeded into the database.
- Source of truth for core product data = Meta catalog. Our Postgres mirrors it.
- Checkout v1 = "Order on WhatsApp" deep link (wa.me with prefilled cart text).
  NO payment gateway in v1. Do not add Razorpay/Stripe unless explicitly asked.
- Audience is mobile-first India. Prices in INR (₹). Storefront must be excellent
  at 380px width.

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS.
  Storefront pages are server-rendered (SEO + WhatsApp link previews via OG tags).
  Client components only where interactivity demands (cart, dashboard).
- **Backend:** FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Alembic migrations.
- **Database:** PostgreSQL. UUID primary keys everywhere from day one.
- **Auth:** JWT (access + refresh) with a `role` claim: `customer` | `seller`.
  Customer signup = email + OTP, plus Google Sign-In (Authlib). Seller account is
  seeded; no public path to become a seller.
- **Catalog sync:** APScheduler job inside the FastAPI process (every 30 min) +
  manual `POST /admin/sync` endpoint. Do NOT introduce Celery/Redis — overkill
  for one seller and ≤500 products.
- **Images:** during sync, download product images from Meta's CDN once and
  re-upload to our own object storage (S3-compatible). Store OUR url in Postgres.
  Never hot-link Meta CDN urls in the storefront.
- **Containerization:** everything runs via Docker + docker-compose locally.
  Target production environment is AWS (ECS/EC2 + RDS + S3 + CloudFront), so keep
  the app 12-factor: all config via environment variables, no local-disk state,
  logs to stdout.

## Folder structure

```
vedi-collections/
├── CLAUDE.md
├── README.md
├── docker-compose.yml          # postgres + backend + frontend for local dev
├── .env.example                # every env var documented, no real secrets
├── .gitignore
├── frontend/                   # ALL frontend code lives here
│   ├── app/
│   │   ├── (shop)/             # public storefront: home, product, cart, search
│   │   ├── (account)/          # customer auth, orders history
│   │   ├── (dashboard)/        # seller-only routes, guarded by role
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/                    # api client, auth helpers, cart state
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── backend/                    # ALL backend code lives here
│   ├── app/
│   │   ├── main.py
│   │   ├── core/               # config, security (JWT), deps (require_role)
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── shop.py         # public: products, search
│   │   │   ├── auth.py         # signup/login/OTP/google
│   │   │   ├── account.py      # customer: cart -> order, order history
│   │   │   └── admin.py        # seller-only: orders, extras, sync
│   │   ├── services/
│   │   │   ├── meta_catalog.py # Graph API client (token, pagination, retries)
│   │   │   ├── sync.py         # upsert logic, image mirroring, sync_logs
│   │   │   └── storage.py      # S3-compatible uploads
│   │   └── scheduler.py        # APScheduler wiring
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── docs/                       # setup guides, Meta onboarding checklist, ADRs
└── scripts/                    # seed_seller.py, one-off utilities
```

Rule: nothing frontend-related outside `frontend/`, nothing backend-related
outside `backend/`. Shared docs, compose files, and scripts live at the root.

## Database schema (core tables)

- `users` — id (UUID), email, password_hash (nullable for Google-only),
  google_sub (nullable), role enum(customer|seller), created_at
- `products` — id (UUID), retailer_id (unique, from Meta), name, description,
  price_minor (int, paise), currency, availability, image_url (OUR storage),
  meta_raw (JSONB snapshot), synced_at, is_active
- `product_extras` — product_id FK, long_description, extra_images (JSONB),
  tags (JSONB). Seller-editable; NEVER overwritten by sync.
- `orders` — id (UUID), user_id FK, status enum(new|confirmed|shipped|cancelled),
  total_minor, whatsapp_message_snapshot (text), created_at
- `order_items` — order_id FK, product_id FK, qty, unit_price_minor (price
  frozen at order time)
- `sync_logs` — id, started_at, finished_at, status, products_upserted,
  error_text

Money is always integer paise (`price_minor`), never floats.

## Meta Graph API integration rules

- All catalog reads go through `services/meta_catalog.py`. Endpoint:
  `GET https://graph.facebook.com/v21.0/{CATALOG_ID}/products` with a system-user
  access token. Handle pagination (`paging.next`) and rate-limit/backoff.
- Sync is **upsert by retailer_id**. Products missing from Meta are soft-marked
  `is_active = false`, never hard-deleted (order history references them).
- Sync must be idempotent and crash-safe; every run writes a `sync_logs` row.
- The storefront NEVER calls the Graph API directly. Postgres only.
- Token and catalog ID come from env: `META_ACCESS_TOKEN`, `META_CATALOG_ID`.
  Never commit them. If the token is invalid, sync logs the failure loudly but
  the site keeps serving from Postgres.

## Auth rules

- One users table, role claim in JWT. FastAPI dependency `require_role("seller")`
  guards everything in `routers/admin.py`.
- Frontend route groups mirror this: `(dashboard)` checks role client+server side,
  but authorization is ALWAYS enforced by the backend — frontend checks are UX only.
- Seed the seller with `scripts/seed_seller.py` (email from env `SELLER_EMAIL`).

## Conventions

- Python: type hints everywhere, ruff for lint/format, pytest for tests.
- TypeScript strict mode. No `any` unless justified with a comment.
- API responses use consistent envelope and proper HTTP status codes.
- Alembic migration for every schema change; never edit applied migrations.
- Commits: small, scoped, imperative mood ("add sync upsert logic").
- Every router gets at least happy-path + auth-failure tests.

## What NOT to do

- No Celery, Redis, Kafka, or microservices. One backend service.
- No payment gateway, inventory management, or multi-seller logic in v1.
- No CSS frameworks beyond Tailwind. No component libraries unless asked.
- Do not invent Meta API fields — if unsure of the catalog response shape,
  check `meta_raw` snapshots or the official docs, don't guess.
- Do not render storefront data from the Graph API at request time.

## Environment variables (.env.example must list all)

DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, META_ACCESS_TOKEN, META_CATALOG_ID,
SELLER_EMAIL, SELLER_WHATSAPP_NUMBER (for wa.me links), GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET, SMTP_* (OTP emails), STORAGE_* (S3-compatible creds),
NEXT_PUBLIC_API_URL.

## Local dev

```
docker compose up          # postgres + backend (:8000) + frontend (:3000)
cd backend && alembic upgrade head && python ../scripts/seed_seller.py
```

## Deployment

Local/dev now via docker-compose. Production target is AWS (planned: ECS or EC2
for containers, RDS Postgres, S3 + CloudFront for images, Route 53 + ACM for
domain/TLS). Until that phase, keep everything container-portable and
env-driven so the AWS move is a deploy change, not a code change.

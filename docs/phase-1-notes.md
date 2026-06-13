# Phase 1 Notes

Phase 1 sets up the project scaffold, database schema, and auth skeleton. It
does not build the Meta catalog sync, storefront shopping flows, checkout, OTP,
Google Sign-In, or seller dashboard UI yet.

## What Exists

- Docker Compose stack with Postgres, FastAPI on port 8000, and Next.js on port 3000.
- Backend FastAPI app with health check and router groups for auth, shop, account, and admin.
- SQLAlchemy 2.0 models for users, products, product_extras, orders, order_items, and sync_logs.
- Initial Alembic migration for the full Phase 1 schema.
- JWT access and refresh tokens carrying the `role` claim.
- Customer email/password signup and login.
- Stubbed OTP and Google endpoints with clear Phase 4 placeholders.
- Backend role dependency used by customer and seller routes.
- Idempotent `scripts/seed_seller.py` script that reads seller settings from env.
- Pytest coverage for signup/login, admin rejection for customer tokens, and seeded seller admin access.
- Minimal strict Next.js App Router + Tailwind scaffold with shop, account, and dashboard route groups.

## Run Locally

```bash
cp .env.example .env
docker-compose up --build
```

In another terminal:

```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python /scripts/seed_seller.py
```

Useful URLs:

- Backend health: http://localhost:8000/health
- Backend docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Host Verification

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
pytest
ruff check .
```

## Phase 2 Status

Phase 2 is now implemented. It added:

- `services/meta_catalog.py` Graph API client for `/{CATALOG_ID}/products`.
- Pagination, retry, and rate-limit handling.
- `services/storage.py` for S3-compatible image mirroring.
- `services/sync.py` idempotent upsert by `retailer_id`, soft-deactivation for missing products, and sync_logs writes.
- APScheduler wiring for a 30-minute job inside the FastAPI process.
- Real `POST /admin/sync` behavior behind the existing seller guard.
- Tests using mocked Meta responses and storage uploads.

See [phase-2-notes.md](phase-2-notes.md) for current sync details and Phase 3 needs.

# Vedi Collections

Single-seller e-commerce storefront for **Vedi Collections** (boutique seller, India).
Products are managed in the seller's WhatsApp Business catalog (Meta Commerce
Manager) and mirrored here via the Meta Graph API. Customers browse and order on
WhatsApp; the seller gets a private dashboard.

See [CLAUDE.md](CLAUDE.md) for the full product spec, hard constraints, and the
phased build plan.

## Status

**Phase 2 complete:** project scaffold, database/auth skeleton, and Meta catalog
sync service. The storefront UI, checkout, customer account UI, and seller
dashboard are **not** built yet.

See [docs/phase-1-notes.md](docs/phase-1-notes.md) and
[docs/phase-2-notes.md](docs/phase-2-notes.md) for what exists and what comes next.

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- **Backend:** FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Alembic
- **Database:** PostgreSQL (UUID PKs, money as integer paise)
- **Auth:** JWT access + refresh, `role` claim (`customer` | `seller`)

## Prerequisites

Docker + Docker Compose. (This machine has `docker-compose` v1, so commands below
use `docker-compose`; if you have the v2 plugin, `docker compose` works too.)

For running backend tests / migrations on the host: Python 3.12.

## Quick start (Docker)

```bash
cp .env.example .env          # adjust secrets as needed
docker-compose up --build     # Postgres + backend :8000 + frontend :3000 (hot reload)
```

Then, in another terminal, apply migrations and seed the seller:

```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python /scripts/seed_seller.py
```

(`scripts/` is mounted into the backend container at `/scripts`; the seed script
locates the `app` package automatically whether run in-container or on the host.)

- Backend API + docs: http://localhost:8000/docs
- Backend health: http://localhost:8000/health
- Frontend: http://localhost:3000

Manual catalog sync, after seeding a seller and logging in as that seller:

```bash
curl -X POST http://localhost:8000/admin/sync \
  -H "Authorization: Bearer <SELLER_ACCESS_TOKEN>"
```

## Backend on the host (tests, lint, migrations, seed)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# Migrations + seed (needs Postgres reachable at DATABASE_URL; use the compose DB):
export DATABASE_URL=postgresql+psycopg2://vedi:vedi@localhost:5433/vedi
export SELLER_EMAIL=seller@vedicollections.example SELLER_PASSWORD=change-me-please
alembic upgrade head
python ../scripts/seed_seller.py

# Tests (use an in-memory SQLite DB — no Postgres required):
pytest

# Lint / format:
ruff check .
ruff format --check .
```

## Project layout

```
frontend/   Next.js app (storefront, account, dashboard route groups)
backend/    FastAPI app (models, schemas, routers, services), Alembic, tests
scripts/    seed_seller.py and one-off utilities
docs/        setup guides, onboarding checklists, ADRs, phase notes
```

Rule: nothing frontend-related outside `frontend/`, nothing backend-related
outside `backend/`. Shared docs, compose, and scripts live at the root.

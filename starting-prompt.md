# Starting Prompt — paste this into Claude Code as your first message

(Place CLAUDE.md at the repo root first, then run this from inside the
`vedi-collections/` folder.)

---

Read CLAUDE.md fully before doing anything — it defines the project, stack,
folder structure, schema, and hard rules. Follow it exactly.

Today we are doing **Phase 1: project scaffold + database + auth skeleton**.
Do NOT build the Meta sync, the storefront UI, or the dashboard yet. Scope is
strictly the following, in order:

1. **Scaffold the repo** exactly per the folder structure in CLAUDE.md:
   `frontend/` (Next.js App Router + TypeScript + Tailwind, strict mode),
   `backend/` (FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Alembic), plus root
   `docker-compose.yml`, `.env.example`, `.gitignore`, `README.md`, `docs/`,
   `scripts/`. Both apps get Dockerfiles. `docker compose up` must bring up
   Postgres, backend on :8000, frontend on :3000, with hot reload in dev.

2. **Database layer**: SQLAlchemy models + initial Alembic migration for ALL
   tables defined in CLAUDE.md (users, products, product_extras, orders,
   order_items, sync_logs). UUID PKs, money as integer paise, enums as
   specified.

3. **Auth skeleton**: JWT access+refresh with `role` claim; email+password
   signup/login for customers (OTP and Google Sign-In are stubbed as TODOs with
   clear interfaces, not implemented today); `require_role` dependency;
   `scripts/seed_seller.py` reading SELLER_EMAIL from env.

4. **Router skeletons**: `shop.py`, `auth.py`, `account.py`, `admin.py` with
   the endpoints from CLAUDE.md stubbed — auth endpoints fully working, the
   rest returning placeholder responses but already wearing the correct auth
   guards (admin routes must reject non-seller JWTs TODAY, even as stubs).

5. **Tests**: pytest setup + tests proving (a) signup/login works, (b) a
   customer JWT is rejected by an admin route, (c) the seller seed script
   creates a seller that CAN access an admin route.

6. Finish by writing `docs/phase-1-notes.md` summarizing what exists, how to
   run it, and what Phase 2 (Meta catalog sync service) will need.

Working rules for this session:
- Ask me before adding ANY dependency not implied by CLAUDE.md.
- Keep diffs minimal and scoped; don't refactor beyond the task.
- If something in CLAUDE.md is ambiguous, ask — don't invent.
- At the end, give me the exact commands to verify everything works locally.

---

## Phase plan (for your own roadmap — feed these one at a time later)

- **Phase 2:** Meta catalog sync — `meta_catalog.py` Graph API client with
  pagination/backoff, `sync.py` idempotent upsert by retailer_id, image
  mirroring to S3-compatible storage, APScheduler wiring, `POST /admin/sync`,
  sync_logs. Test with a mocked Graph API response fixture.
- **Phase 3:** Storefront — server-rendered home/product/search pages, cart
  (client state), "Order on WhatsApp" deep link generating the prefilled
  message + creating an order row, OG tags so product links unfurl nicely in
  WhatsApp. 380px-first.
- **Phase 4:** Customer account — OTP email flow, Google Sign-In, order history.
- **Phase 5:** Seller dashboard — orders list with status updates, product
  extras editor, sync status panel with manual sync button and log viewer.
- **Phase 6:** Hardening — rate limiting, error pages, SEO/sitemap, seed/demo
  data script, full test pass.
- **Phase 7 (with Claude, later):** AWS launch — ECR images, ECS/EC2, RDS
  Postgres, S3 + CloudFront for images, Route 53 + ACM, CI/CD via GitHub
  Actions, secrets in SSM Parameter Store.

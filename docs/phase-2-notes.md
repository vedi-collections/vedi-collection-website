# Phase 2 Notes

Phase 2 adds the Meta catalog sync service. It does not build storefront product
pages, cart checkout, account UI, or the seller dashboard interface.

## What Exists

- `services/meta_catalog.py` reads `/{CATALOG_ID}/products` from the Meta Graph API.
- Catalog reads request the core fields mirrored in Postgres and preserve the full raw product in `meta_raw`.
- Pagination follows `paging.next`.
- Retry/backoff handles rate limits and transient 5xx responses.
- `services/storage.py` downloads Meta CDN images and uploads them to S3-compatible storage.
- `services/sync.py` upserts products by `retailer_id`, preserves `product_extras`, soft-deactivates products missing from Meta, and writes a `sync_logs` row for every run.
- Unchanged Meta image URLs reuse the existing mirrored image URL instead of uploading again.
- `POST /admin/sync` runs the sync behind the seller role guard.
- `scheduler.py` wires APScheduler for 30-minute sync jobs when `CATALOG_SYNC_SCHEDULER_ENABLED=true`.

## Required Environment

Meta:

```bash
META_ACCESS_TOKEN=
META_CATALOG_ID=
META_GRAPH_API_VERSION=v21.0
META_GRAPH_API_BASE_URL=https://graph.facebook.com
```

Storage:

```bash
STORAGE_ENDPOINT=
STORAGE_REGION=ap-south-1
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_PUBLIC_BASE_URL=
```

Scheduler:

```bash
CATALOG_SYNC_INTERVAL_MINUTES=30
CATALOG_SYNC_SCHEDULER_ENABLED=false
```

Keep the scheduler disabled until Meta and storage credentials are configured.
Manual `POST /admin/sync` is available regardless.

## Phase 3 Needs

- Server-rendered storefront home, product, and search pages reading from Postgres only.
- Product Open Graph metadata for WhatsApp link previews.
- Client cart state.
- "Order on WhatsApp" deep link generation using `SELLER_WHATSAPP_NUMBER`.
- Order row creation with frozen item prices and WhatsApp message snapshot.

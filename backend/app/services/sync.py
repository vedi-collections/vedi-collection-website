from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from typing import Any, Protocol

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.sync_log import SyncLog
from app.services.meta_catalog import MetaCatalogClient
from app.services.storage import StorageClient


class CatalogClient(Protocol):
    def fetch_products(self) -> list[dict[str, Any]]:
        ...


class ImageStorage(Protocol):
    def mirror_image(self, image_url: str, *, retailer_id: str) -> str:
        ...


@dataclass(frozen=True)
class SyncResult:
    sync_log_id: str
    status: str
    products_seen: int
    products_upserted: int
    products_deactivated: int


@dataclass(frozen=True)
class ProductPayload:
    retailer_id: str
    name: str
    description: str | None
    price_minor: int
    currency: str
    availability: str | None
    source_image_url: str | None
    meta_raw: dict[str, Any]


def sync_catalog(
    db: Session,
    *,
    catalog_client: CatalogClient | None = None,
    storage_client: ImageStorage | None = None,
) -> SyncResult:
    log = SyncLog(status="running", products_upserted=0)
    db.add(log)
    db.commit()
    db.refresh(log)

    products_upserted = 0
    products_deactivated = 0

    try:
        client = catalog_client or MetaCatalogClient()
        storage = storage_client or StorageClient()
        fetched = client.fetch_products()
        synced_at = datetime.now(UTC)
        seen_retailer_ids: set[str] = set()

        for raw_product in fetched:
            payload = parse_product_payload(raw_product)
            seen_retailer_ids.add(payload.retailer_id)

            product = db.scalar(
                select(Product).where(Product.retailer_id == payload.retailer_id)
            )
            if product is None:
                product = Product(retailer_id=payload.retailer_id)
                db.add(product)

            image_url = _resolve_image_url(
                storage,
                product=product,
                source_image_url=payload.source_image_url,
                retailer_id=payload.retailer_id,
            )
            product.name = payload.name
            product.description = payload.description
            product.price_minor = payload.price_minor
            product.currency = payload.currency
            product.availability = payload.availability
            product.image_url = image_url
            product.meta_raw = payload.meta_raw
            product.synced_at = synced_at
            product.is_active = True
            products_upserted += 1

        if seen_retailer_ids:
            result = db.execute(
                update(Product)
                .where(Product.is_active.is_(True))
                .where(Product.retailer_id.not_in(seen_retailer_ids))
                .values(is_active=False, synced_at=synced_at)
            )
            products_deactivated = result.rowcount or 0
        else:
            result = db.execute(
                update(Product)
                .where(Product.is_active.is_(True))
                .values(is_active=False, synced_at=synced_at)
            )
            products_deactivated = result.rowcount or 0

        log.status = "success"
        log.finished_at = datetime.now(UTC)
        log.products_upserted = products_upserted
        db.commit()
        return SyncResult(
            sync_log_id=str(log.id),
            status=log.status,
            products_seen=len(fetched),
            products_upserted=products_upserted,
            products_deactivated=products_deactivated,
        )
    except Exception as exc:
        db.rollback()
        log = db.get(SyncLog, log.id)
        if log is not None:
            log.status = "failed"
            log.finished_at = datetime.now(UTC)
            log.products_upserted = products_upserted
            log.error_text = str(exc)
            db.commit()
        raise


def parse_product_payload(raw_product: dict[str, Any]) -> ProductPayload:
    retailer_id = str(raw_product.get("retailer_id") or "").strip()
    if not retailer_id:
        raise ValueError("Meta product is missing retailer_id")

    name = str(raw_product.get("name") or "").strip()
    if not name:
        raise ValueError(f"Meta product {retailer_id} is missing name")

    currency = _extract_currency(raw_product)
    price_minor = _extract_price_minor(raw_product)
    source_image_url = raw_product.get("image_url")

    return ProductPayload(
        retailer_id=retailer_id,
        name=name,
        description=_optional_str(raw_product.get("description")),
        price_minor=price_minor,
        currency=currency,
        availability=_optional_str(raw_product.get("availability")),
        source_image_url=str(source_image_url) if source_image_url else None,
        meta_raw=raw_product,
    )


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _extract_currency(raw_product: dict[str, Any]) -> str:
    explicit_currency = raw_product.get("currency")
    if explicit_currency:
        return str(explicit_currency).strip().upper()

    price = raw_product.get("price")
    if isinstance(price, str):
        match = re.search(r"\b([A-Z]{3})\b", price.upper())
        if match:
            return match.group(1)

    return "INR"


def _extract_price_minor(raw_product: dict[str, Any]) -> int:
    price = raw_product.get("price")
    if price is None:
        raise ValueError("Meta product is missing price")

    if isinstance(price, int):
        return price

    if isinstance(price, float):
        return _decimal_to_minor(Decimal(str(price)))

    if isinstance(price, str):
        amount = re.sub(r"[^0-9.]", "", price)
        if not amount:
            raise ValueError(f"Could not parse product price: {price}")
        try:
            return _decimal_to_minor(Decimal(amount))
        except InvalidOperation as exc:
            raise ValueError(f"Could not parse product price: {price}") from exc

    raise ValueError(f"Unsupported product price type: {type(price).__name__}")


def _decimal_to_minor(value: Decimal) -> int:
    return int((value * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _resolve_image_url(
    storage: ImageStorage,
    *,
    product: Product,
    source_image_url: str | None,
    retailer_id: str,
) -> str | None:
    if not source_image_url:
        return None

    previous_meta_image_url = None
    if isinstance(product.meta_raw, dict):
        previous_meta_image_url = product.meta_raw.get("image_url")

    if product.image_url and previous_meta_image_url == source_image_url:
        return product.image_url

    return storage.mirror_image(source_image_url, retailer_id=retailer_id)

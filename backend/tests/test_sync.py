from __future__ import annotations

import uuid
from typing import Any

import pytest
from fastapi.testclient import TestClient
from scripts.seed_seller import seed_seller
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product, ProductExtra
from app.models.sync_log import SyncLog
from app.services import sync as sync_service
from app.services.sync import parse_product_payload, sync_catalog


class FakeCatalogClient:
    def __init__(self, products: list[dict[str, Any]]) -> None:
        self.products = products

    def fetch_products(self) -> list[dict[str, Any]]:
        return self.products


class FakeStorageClient:
    def __init__(self) -> None:
        self.mirrored: list[tuple[str, str]] = []

    def mirror_image(self, image_url: str, *, retailer_id: str) -> str:
        self.mirrored.append((retailer_id, image_url))
        return f"https://cdn.vedi.test/products/{retailer_id}.jpg"


def test_sync_upserts_products_preserves_extras_and_deactivates_missing(
    db_session: Session,
) -> None:
    existing = Product(
        retailer_id="OLD-1",
        name="Old",
        description=None,
        price_minor=10000,
        currency="INR",
        availability="in stock",
        image_url="https://cdn.vedi.test/products/old.jpg",
        meta_raw={"image_url": "https://meta.test/old.jpg"},
        is_active=True,
    )
    keep_extras = Product(
        retailer_id="KEEP-1",
        name="Old Keep",
        description=None,
        price_minor=5000,
        currency="INR",
        availability="in stock",
        image_url="https://cdn.vedi.test/products/keep-old.jpg",
        meta_raw={"image_url": "https://meta.test/keep-old.jpg"},
        is_active=True,
    )
    db_session.add_all([existing, keep_extras])
    db_session.flush()
    db_session.add(
        ProductExtra(
            product_id=keep_extras.id,
            long_description="Seller-written copy",
            extra_images=["https://cdn.vedi.test/extra.jpg"],
            tags=["kurti"],
        )
    )
    db_session.commit()

    storage = FakeStorageClient()
    result = sync_catalog(
        db_session,
        catalog_client=FakeCatalogClient(
            [
                {
                    "retailer_id": "KEEP-1",
                    "name": "Updated Keep",
                    "description": "Fresh Meta description",
                    "price": "1299.50 INR",
                    "availability": "in stock",
                    "image_url": "https://meta.test/keep-new.jpg",
                },
                {
                    "retailer_id": "NEW-1",
                    "name": "New Product",
                    "description": "New from Meta",
                    "price": 999,
                    "currency": "INR",
                    "availability": "out of stock",
                    "image_url": "https://meta.test/new.jpg",
                },
            ]
        ),
        storage_client=storage,
    )

    assert result.status == "success"
    assert result.products_seen == 2
    assert result.products_upserted == 2
    assert result.products_deactivated == 1
    assert storage.mirrored == [
        ("KEEP-1", "https://meta.test/keep-new.jpg"),
        ("NEW-1", "https://meta.test/new.jpg"),
    ]

    old_product = db_session.scalar(select(Product).where(Product.retailer_id == "OLD-1"))
    assert old_product is not None
    assert old_product.is_active is False

    updated = db_session.scalar(select(Product).where(Product.retailer_id == "KEEP-1"))
    assert updated is not None
    assert updated.name == "Updated Keep"
    assert updated.price_minor == 129950
    assert updated.image_url == "https://cdn.vedi.test/products/KEEP-1.jpg"
    assert updated.extras is not None
    assert updated.extras.long_description == "Seller-written copy"

    log = db_session.scalar(select(SyncLog).where(SyncLog.id == uuid.UUID(result.sync_log_id)))
    assert log is not None
    assert log.status == "success"
    assert log.products_upserted == 2
    assert log.finished_at is not None


def test_sync_reuses_mirrored_image_when_meta_image_is_unchanged(db_session: Session) -> None:
    product = Product(
        retailer_id="SAME-1",
        name="Same",
        description=None,
        price_minor=10000,
        currency="INR",
        availability="in stock",
        image_url="https://cdn.vedi.test/products/same.jpg",
        meta_raw={"image_url": "https://meta.test/same.jpg"},
        is_active=True,
    )
    db_session.add(product)
    db_session.commit()

    storage = FakeStorageClient()
    sync_catalog(
        db_session,
        catalog_client=FakeCatalogClient(
            [
                {
                    "retailer_id": "SAME-1",
                    "name": "Same Updated",
                    "price": "100.00 INR",
                    "image_url": "https://meta.test/same.jpg",
                }
            ]
        ),
        storage_client=storage,
    )

    updated = db_session.scalar(select(Product).where(Product.retailer_id == "SAME-1"))
    assert updated is not None
    assert updated.image_url == "https://cdn.vedi.test/products/same.jpg"
    assert storage.mirrored == []


def test_sync_failure_writes_failed_log(db_session: Session) -> None:
    with pytest.raises(ValueError, match="missing retailer_id"):
        sync_catalog(
            db_session,
            catalog_client=FakeCatalogClient([{"name": "Broken", "price": "1.00 INR"}]),
            storage_client=FakeStorageClient(),
        )

    log = db_session.scalars(select(SyncLog)).one()
    assert log.status == "failed"
    assert log.finished_at is not None
    assert "missing retailer_id" in str(log.error_text)


def test_parse_product_payload_handles_meta_price_strings() -> None:
    payload = parse_product_payload(
        {
            "retailer_id": "PRICE-1",
            "name": "Price Product",
            "price": "2,499.99 INR",
            "availability": "in stock",
        }
    )

    assert payload.price_minor == 249999
    assert payload.currency == "INR"


def test_admin_sync_endpoint_runs_for_seller(
    client: TestClient, db_session: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    seed_seller(db_session, email="seller@example.com", password="seller-secret")
    login = client.post(
        "/auth/login",
        json={"email": "seller@example.com", "password": "seller-secret"},
    )
    token = login.json()["access_token"]

    def fake_sync(db: Session) -> sync_service.SyncResult:
        assert db is db_session
        return sync_service.SyncResult(
            sync_log_id="sync-1",
            status="success",
            products_seen=1,
            products_upserted=1,
            products_deactivated=0,
        )

    monkeypatch.setattr("app.routers.admin.run_catalog_sync", fake_sync)

    response = client.post("/admin/sync", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["products_upserted"] == 1

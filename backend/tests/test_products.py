from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.enums import ProductStatus, UserRole
from app.models.product import Product
from app.models.user import User
from app.services.storage import get_storage_client


def _token(db: Session, *, role: UserRole) -> str:
    user = User(
        name="T",
        email=f"{role.value}@example.com",
        password_hash=hash_password("secret-pass"),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return create_access_token(user.id, user.role.value)


def _admin_headers(db: Session) -> dict[str, str]:
    return {"Authorization": f"Bearer {_token(db, role=UserRole.admin)}"}


def _seed(db: Session, **kwargs) -> Product:
    defaults = dict(name="Suit", price=1850, status=ProductStatus.live, is_active=True)
    defaults.update(kwargs)
    product = Product(**defaults)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


# --- Public reads: only live AND active -------------------------------------


def test_public_list_shows_only_live_and_active(client: TestClient, db_session: Session) -> None:
    live = _seed(db_session, name="Live", status=ProductStatus.live, is_active=True)
    _seed(db_session, name="Draft", status=ProductStatus.draft, is_active=True)
    _seed(db_session, name="Scheduled", status=ProductStatus.scheduled, is_active=True)
    _seed(db_session, name="SoftDeleted", status=ProductStatus.live, is_active=False)

    resp = client.get("/products")
    assert resp.status_code == 200
    names = [p["name"] for p in resp.json()["products"]]
    assert names == ["Live"]
    # Public shape must not leak lifecycle/soft-delete fields.
    assert set(resp.json()["products"][0]) == {
        "id", "name", "description", "price", "mrp", "stock_quantity", "images",
        "audience", "subcategory",
    }
    assert str(live.id) == resp.json()["products"][0]["id"]


def test_public_detail_404_for_non_live(client: TestClient, db_session: Session) -> None:
    draft = _seed(db_session, status=ProductStatus.draft)
    assert client.get(f"/products/{draft.id}").status_code == 404

    live = _seed(db_session, status=ProductStatus.live)
    assert client.get(f"/products/{live.id}").status_code == 200


# --- Admin CRUD --------------------------------------------------------------


def test_admin_create_then_appears_in_admin_list(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session)
    resp = client.post(
        "/admin/products",
        headers=headers,
        json={"name": "Banarasi Silk", "price": 3450, "status": "live", "stock_quantity": 5},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "live" and body["price"] == 3450 and body["is_active"] is True

    listing = client.get("/admin/products", headers=headers)
    assert listing.status_code == 200
    assert any(p["name"] == "Banarasi Silk" for p in listing.json()["products"])


def test_admin_create_with_category(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session)
    resp = client.post(
        "/admin/products",
        headers=headers,
        json={
            "name": "Cotton Suit",
            "price": 1850,
            "status": "live",
            "audience": "women",
            "subcategory": "  Suits  ",  # trimmed by the schema
        },
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["audience"] == "women"
    assert body["subcategory"] == "Suits"

    # Defaults: no audience -> 'women', blank subcategory -> null.
    plain = client.post(
        "/admin/products",
        headers=headers,
        json={"name": "Basic", "price": 100, "status": "live", "subcategory": "   "},
    )
    assert plain.status_code == 201, plain.text
    assert plain.json()["audience"] == "women"
    assert plain.json()["subcategory"] is None


def test_admin_create_with_mrp(client: TestClient, db_session: Session) -> None:
    """Original price (MRP) is stored alongside the sale price; the discount %
    is derived on the frontend, never stored."""
    headers = _admin_headers(db_session)
    resp = client.post(
        "/admin/products",
        headers=headers,
        json={"name": "On Sale", "price": 1500, "mrp": 2000, "status": "live"},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["price"] == 1500
    assert resp.json()["mrp"] == 2000

    # Public read carries the MRP too, so the storefront can strike it through.
    public = client.get("/products").json()["products"][0]
    assert public["price"] == 1500 and public["mrp"] == 2000


def test_mrp_below_price_is_rejected(client: TestClient, db_session: Session) -> None:
    resp = client.post(
        "/admin/products",
        headers=_admin_headers(db_session),
        json={"name": "Bad", "price": 2000, "mrp": 1500, "status": "live"},
    )
    assert resp.status_code == 422


def test_mrp_defaults_to_null(client: TestClient, db_session: Session) -> None:
    resp = client.post(
        "/admin/products",
        headers=_admin_headers(db_session),
        json={"name": "No Discount", "price": 999, "status": "live"},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["mrp"] is None


def test_scheduled_requires_go_live_at(client: TestClient, db_session: Session) -> None:
    resp = client.post(
        "/admin/products",
        headers=_admin_headers(db_session),
        json={"name": "Festive Drop", "price": 999, "status": "scheduled"},
    )
    assert resp.status_code == 422


def test_admin_patch_updates_fields(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session)
    product = _seed(db_session, name="Old", price=1000, stock_quantity=2)

    resp = client.patch(
        f"/admin/products/{product.id}",
        headers=headers,
        json={"price": 1250, "stock_quantity": 0},
    )
    assert resp.status_code == 200
    assert resp.json()["price"] == 1250 and resp.json()["stock_quantity"] == 0
    assert resp.json()["name"] == "Old"  # untouched fields preserved


def test_admin_delete_is_soft(client: TestClient, db_session: Session) -> None:
    headers = _admin_headers(db_session)
    product = _seed(db_session, status=ProductStatus.live, is_active=True)

    resp = client.delete(f"/admin/products/{product.id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False

    # Row still exists for admin, but is gone from the public storefront.
    db_session.expire_all()
    assert db_session.get(Product, product.id) is not None
    assert client.get(f"/products/{product.id}").status_code == 404


def test_admin_patch_missing_product_404(client: TestClient, db_session: Session) -> None:
    import uuid

    resp = client.patch(
        f"/admin/products/{uuid.uuid4()}",
        headers=_admin_headers(db_session),
        json={"price": 5},
    )
    assert resp.status_code == 404


# --- Media uploads -----------------------------------------------------------


class _FakeStorage:
    """Stand-in for StorageClient: records uploads, returns a deterministic URL."""

    def __init__(self) -> None:
        self.uploaded: list[tuple[str, str | None]] = []

    def upload_file(self, content, *, content_type, filename=None, prefix="products"):
        self.uploaded.append((content_type, filename))
        return f"https://cdn.test/{prefix}/{filename or 'file'}"


def _use_fake_storage() -> _FakeStorage:
    fake = _FakeStorage()
    app.dependency_overrides[get_storage_client] = lambda: fake
    return fake


def test_admin_upload_returns_public_urls(client: TestClient, db_session: Session) -> None:
    fake = _use_fake_storage()
    try:
        resp = client.post(
            "/admin/uploads",
            headers=_admin_headers(db_session),
            files=[
                ("files", ("saree.jpg", b"img-bytes", "image/jpeg")),
                ("files", ("reel.mp4", b"vid-bytes", "video/mp4")),
            ],
        )
    finally:
        app.dependency_overrides.pop(get_storage_client, None)

    assert resp.status_code == 201, resp.text
    urls = resp.json()["urls"]
    assert urls == [
        "https://cdn.test/products/saree.jpg",
        "https://cdn.test/products/reel.mp4",
    ]
    assert [ct for ct, _ in fake.uploaded] == ["image/jpeg", "video/mp4"]


def test_admin_upload_rejects_non_media(client: TestClient, db_session: Session) -> None:
    _use_fake_storage()
    try:
        resp = client.post(
            "/admin/uploads",
            headers=_admin_headers(db_session),
            files=[("files", ("invoice.pdf", b"%PDF-1.4", "application/pdf"))],
        )
    finally:
        app.dependency_overrides.pop(get_storage_client, None)
    assert resp.status_code == 415


def test_admin_upload_requires_admin(client: TestClient, db_session: Session) -> None:
    customer = {"Authorization": f"Bearer {_token(db_session, role=UserRole.customer)}"}
    resp = client.post(
        "/admin/uploads",
        headers=customer,
        files=[("files", ("x.jpg", b"x", "image/jpeg"))],
    )
    assert resp.status_code == 403


# --- Auth enforcement on admin writes ---------------------------------------


def test_admin_routes_reject_non_admin(client: TestClient, db_session: Session) -> None:
    customer = {"Authorization": f"Bearer {_token(db_session, role=UserRole.customer)}"}
    assert client.get("/admin/products", headers=customer).status_code == 403
    assert client.post(
        "/admin/products", headers=customer, json={"name": "X", "price": 1}
    ).status_code == 403


def test_admin_routes_require_a_token(client: TestClient) -> None:
    assert client.get("/admin/products").status_code in (401, 403)
    assert client.post("/admin/products", json={"name": "X", "price": 1}).status_code in (401, 403)

from fastapi.testclient import TestClient
from scripts.seed_admin import seed_admin
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.enums import UserRole
from app.models.user import User

ADMIN_ROUTE = "/admin/orders"


def _make_user(db: Session, *, email: str, password: str, role: UserRole) -> User:
    user = User(name="Test User", email=email, password_hash=hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_login_returns_jwt_and_grants_admin_access(client: TestClient, db_session: Session) -> None:
    seed_admin(db_session, name="Owner", email="admin@example.com", password="admin-secret")

    login = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "admin-secret"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    assert token

    resp = client.get(ADMIN_ROUTE, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == {"orders": []}


def test_login_rejects_wrong_password(client: TestClient, db_session: Session) -> None:
    seed_admin(db_session, name="Owner", email="admin@example.com", password="admin-secret")

    resp = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "wrong-password"},
    )
    assert resp.status_code == 401


def test_non_admin_is_rejected_from_admin_route(client: TestClient, db_session: Session) -> None:
    # A valid, authenticated customer must still be refused by require_admin.
    customer = _make_user(
        db_session, email="customer@example.com", password="cust-secret", role=UserRole.customer
    )
    token = create_access_token(customer.id, customer.role.value)

    resp = client.get(ADMIN_ROUTE, headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 403


def test_admin_route_requires_a_token(client: TestClient) -> None:
    resp = client.get(ADMIN_ROUTE)
    assert resp.status_code in (401, 403)

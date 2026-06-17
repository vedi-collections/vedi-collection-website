from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.enums import UserRole
from app.models.user import User

# The configured store owner. Only this admin may mutate the team.
OWNER_EMAIL = settings.OWNER_EMAIL


def _user(db: Session, *, role: UserRole, email: str, active: bool = True) -> User:
    user = User(
        name="T",
        email=email,
        password_hash=hash_password("secret-pass"),
        role=role,
        is_active=active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _owner(db: Session) -> User:
    """An admin whose email matches settings.OWNER_EMAIL (the store owner)."""
    return _user(db, role=UserRole.admin, email=OWNER_EMAIL)


def _headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role.value)}"}


def test_owner_can_create_and_list_admins(client: TestClient, db_session: Session) -> None:
    owner = _owner(db_session)
    resp = client.post(
        "/admin/users",
        headers=_headers(owner),
        json={"name": "Riya", "email": "Riya@Example.com", "password": "staffpass1"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["email"] == "riya@example.com"  # normalized
    assert body["role"] == "admin" and body["is_active"] is True
    assert "password" not in body and "password_hash" not in body

    listing = client.get("/admin/users", headers=_headers(owner))
    emails = {a["email"] for a in listing.json()["admins"]}
    assert {OWNER_EMAIL, "riya@example.com"} <= emails


def test_duplicate_email_conflicts(client: TestClient, db_session: Session) -> None:
    owner = _owner(db_session)
    resp = client.post(
        "/admin/users",
        headers=_headers(owner),
        json={"name": "Dup", "email": OWNER_EMAIL, "password": "staffpass1"},
    )
    assert resp.status_code == 409


def test_new_admin_can_log_in(client: TestClient, db_session: Session) -> None:
    owner = _owner(db_session)
    client.post(
        "/admin/users",
        headers=_headers(owner),
        json={"name": "Riya", "email": "riya@example.com", "password": "staffpass1"},
    )
    login = client.post("/auth/login", json={"email": "riya@example.com", "password": "staffpass1"})
    assert login.status_code == 200
    # And the new (non-owner) admin can reach admin routes.
    token = login.json()["access_token"]
    me = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200


def test_owner_can_deactivate_then_reactivate(client: TestClient, db_session: Session) -> None:
    owner = _owner(db_session)
    other = _user(db_session, role=UserRole.admin, email="staff@example.com")

    resp = client.patch(
        f"/admin/users/{other.id}", headers=_headers(owner), json={"is_active": False}
    )
    assert resp.status_code == 200 and resp.json()["is_active"] is False

    # Deactivated admin can no longer log in...
    login = client.post(
        "/auth/login", json={"email": "staff@example.com", "password": "secret-pass"}
    )
    assert login.status_code == 403
    # ...nor use an already-issued token.
    assert client.get("/admin/users", headers=_headers(other)).status_code == 401

    # Reactivate restores access.
    client.patch(f"/admin/users/{other.id}", headers=_headers(owner), json={"is_active": True})
    assert client.get("/admin/users", headers=_headers(other)).status_code == 200


def test_owner_cannot_deactivate_self(client: TestClient, db_session: Session) -> None:
    owner = _owner(db_session)
    resp = client.patch(
        f"/admin/users/{owner.id}", headers=_headers(owner), json={"is_active": False}
    )
    assert resp.status_code == 400


def test_staff_admin_can_view_but_not_change_team(
    client: TestClient, db_session: Session
) -> None:
    """A non-owner admin (staff) may read the team but not add or deactivate admins."""
    owner = _owner(db_session)
    staff = _user(db_session, role=UserRole.admin, email="staff@example.com")

    # Staff CAN list the team.
    assert client.get("/admin/users", headers=_headers(staff)).status_code == 200

    # Staff CANNOT add an admin.
    create = client.post(
        "/admin/users",
        headers=_headers(staff),
        json={"name": "X", "email": "x@example.com", "password": "staffpass1"},
    )
    assert create.status_code == 403
    assert "owner" in create.json()["detail"].lower()

    # Staff CANNOT deactivate another admin (here, the owner).
    patch = client.patch(
        f"/admin/users/{owner.id}", headers=_headers(staff), json={"is_active": False}
    )
    assert patch.status_code == 403


def test_user_routes_are_admin_only(client: TestClient, db_session: Session) -> None:
    customer = _user(db_session, role=UserRole.customer, email="c@example.com")
    assert client.get("/admin/users", headers=_headers(customer)).status_code == 403
    assert client.post(
        "/admin/users",
        headers=_headers(customer),
        json={"name": "X", "email": "x@example.com", "password": "staffpass1"},
    ).status_code == 403
    assert client.get("/admin/users").status_code in (401, 403)

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.change_log import ChangeLog
from app.models.enums import ChangeAction, UserRole
from app.models.user import User


def _admin(db: Session) -> User:
    user = User(
        name="Owner",
        email="admin@example.com",
        password_hash=hash_password("secret-pass"),
        role=UserRole.admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role.value)}"}


def _create(client: TestClient, headers: dict[str, str], **fields) -> str:
    body = {"name": "Suit", "price": 1850, "status": "live"}
    body.update(fields)
    resp = client.post("/admin/products", headers=headers, json=body)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def test_create_writes_one_create_row(client: TestClient, db_session: Session) -> None:
    admin = _admin(db_session)
    pid = _create(client, _headers(admin))

    rows = db_session.scalars(select(ChangeLog)).all()
    assert len(rows) == 1
    row = rows[0]
    assert row.action is ChangeAction.create
    assert str(row.product_id) == pid
    assert str(row.admin_id) == str(admin.id)
    assert row.field_changed is None


def test_update_writes_one_row_per_changed_field(client: TestClient, db_session: Session) -> None:
    admin = _admin(db_session)
    headers = _headers(admin)
    pid = _create(client, headers, price=1000, stock_quantity=2)

    resp = client.patch(
        f"/admin/products/{pid}",
        headers=headers,
        json={"price": 1250, "stock_quantity": 2, "name": "Renamed"},
    )
    assert resp.status_code == 200

    updates = db_session.scalars(
        select(ChangeLog).where(ChangeLog.action == ChangeAction.update)
    ).all()
    # stock_quantity was unchanged (2 -> 2) so it must NOT be logged.
    changed = {r.field_changed: (r.old_value, r.new_value) for r in updates}
    assert changed == {"price": ("1000", "1250"), "name": ("Suit", "Renamed")}


def test_noop_update_writes_nothing(client: TestClient, db_session: Session) -> None:
    admin = _admin(db_session)
    headers = _headers(admin)
    pid = _create(client, headers, price=1000)

    before = len(db_session.scalars(select(ChangeLog)).all())
    client.patch(f"/admin/products/{pid}", headers=headers, json={"price": 1000})
    db_session.expire_all()
    after = len(db_session.scalars(select(ChangeLog)).all())
    assert after == before  # value identical -> no new audit rows


def test_delete_writes_a_delete_row(client: TestClient, db_session: Session) -> None:
    admin = _admin(db_session)
    headers = _headers(admin)
    pid = _create(client, headers)

    client.delete(f"/admin/products/{pid}", headers=headers)
    db_session.expire_all()

    rows = db_session.scalars(
        select(ChangeLog).where(ChangeLog.action == ChangeAction.delete)
    ).all()
    assert len(rows) == 1
    assert rows[0].field_changed == "is_active"
    assert (rows[0].old_value, rows[0].new_value) == ("True", "False")


def test_change_log_endpoint_returns_newest_first(client: TestClient, db_session: Session) -> None:
    admin = _admin(db_session)
    headers = _headers(admin)
    pid = _create(client, headers, price=1000)
    client.patch(f"/admin/products/{pid}", headers=headers, json={"price": 2000})

    resp = client.get("/admin/change-log", headers=headers)
    assert resp.status_code == 200
    entries = resp.json()["entries"]
    assert [e["action"] for e in entries] == ["update", "create"]  # newest first


def test_change_log_is_admin_only(client: TestClient, db_session: Session) -> None:
    customer = User(
        name="C",
        email="c@example.com",
        password_hash=hash_password("secret-pass"),
        role=UserRole.customer,
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)

    assert client.get("/admin/change-log", headers=_headers(customer)).status_code == 403
    assert client.get("/admin/change-log").status_code in (401, 403)

from fastapi.testclient import TestClient
from scripts.seed_seller import seed_seller
from sqlalchemy.orm import Session


def test_signup_and_login_work(client: TestClient) -> None:
    signup = client.post(
        "/auth/signup",
        json={"email": "Customer@Example.com", "password": "super-secret"},
    )
    assert signup.status_code == 201
    signup_body = signup.json()
    assert signup_body["user"]["email"] == "customer@example.com"
    assert signup_body["user"]["role"] == "customer"
    assert signup_body["access_token"]
    assert signup_body["refresh_token"]

    login = client.post(
        "/auth/login",
        json={"email": "customer@example.com", "password": "super-secret"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["email"] == "customer@example.com"


def test_me_returns_current_user(client: TestClient) -> None:
    signup = client.post(
        "/auth/signup",
        json={"email": "customer@example.com", "password": "super-secret"},
    )
    token = signup.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "customer@example.com"
    assert body["role"] == "customer"
    assert body["id"] == signup.json()["user"]["id"]


def test_me_rejects_invalid_token(client: TestClient) -> None:
    response = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})

    assert response.status_code == 401


def test_customer_jwt_is_rejected_by_admin_route(client: TestClient) -> None:
    signup = client.post(
        "/auth/signup",
        json={"email": "customer@example.com", "password": "super-secret"},
    )
    token = signup.json()["access_token"]

    response = client.get("/admin/orders", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403


def test_seeded_seller_can_access_admin_route(client: TestClient, db_session: Session) -> None:
    seed_seller(db_session, email="seller@example.com", password="seller-secret")

    login = client.post(
        "/auth/login",
        json={"email": "seller@example.com", "password": "seller-secret"},
    )
    token = login.json()["access_token"]

    response = client.get("/admin/orders", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json() == {"orders": []}

#!/usr/bin/env python
"""Seed the single seller account."""

from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.core.config import settings  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models.enums import UserRole  # noqa: E402
from app.models.user import User  # noqa: E402


def seed_seller(db: Session, *, email: str, password: str) -> User:
    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))
    password_hash = hash_password(password)

    if user is None:
        user = User(email=normalized_email, password_hash=password_hash, role=UserRole.seller)
        db.add(user)
    else:
        user.password_hash = password_hash
        user.role = UserRole.seller

    db.commit()
    db.refresh(user)
    return user


def main() -> None:
    with SessionLocal() as db:
        user = seed_seller(db, email=settings.SELLER_EMAIL, password=settings.SELLER_PASSWORD)
        print(f"Seeded seller: {user.email}")


if __name__ == "__main__":
    main()

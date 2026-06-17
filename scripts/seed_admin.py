#!/usr/bin/env python
"""Seed the first admin account.

There is no public registration, so the initial admin must be created out-of-band.
Idempotent: creates the admin if missing, otherwise resets name/password/role to
the configured values. Run once after migrations:

    python scripts/seed_admin.py

Credentials come from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in the environment.
"""

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


def seed_admin(db: Session, *, name: str, email: str, password: str) -> User:
    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))
    password_hash = hash_password(password)

    if user is None:
        user = User(
            name=name,
            email=normalized_email,
            password_hash=password_hash,
            role=UserRole.admin,
        )
        db.add(user)
    else:
        user.name = name
        user.password_hash = password_hash
        user.role = UserRole.admin

    db.commit()
    db.refresh(user)
    return user


def main() -> None:
    with SessionLocal() as db:
        user = seed_admin(
            db,
            name=settings.ADMIN_NAME,
            email=settings.ADMIN_EMAIL,
            password=settings.ADMIN_PASSWORD,
        )
        print(f"Seeded admin: {user.email}")


if __name__ == "__main__":
    main()

"""Auth dependencies: resolve the current user from a bearer token and enforce roles.

Authorization is ALWAYS enforced here on the backend; frontend role checks are
UX only (per CLAUDE.md).
"""

import uuid
from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import ACCESS, decode_token
from app.models.enums import UserRole
from app.models.user import User

_bearer = HTTPBearer(auto_error=True)

_CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired token",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise _CREDENTIALS_EXC from exc

    if payload.get("type") != ACCESS:
        raise _CREDENTIALS_EXC

    sub = payload.get("sub")
    try:
        user_id = uuid.UUID(str(sub))
    except (ValueError, TypeError) as exc:
        raise _CREDENTIALS_EXC from exc

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise _CREDENTIALS_EXC
    return user


def require_role(role: str) -> Callable[..., User]:
    """Dependency factory: 403 unless the current user has the given role."""

    def _dependency(user: User = Depends(get_current_user)) -> User:
        if user.role.value != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _dependency


def require_admin(user: User = Depends(get_current_user)) -> User:
    """403 unless the authenticated user is an admin. Guards every /admin route.

    The role is read from the DB-backed User (loaded by get_current_user), never
    from a hardcoded email list.
    """
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins only",
        )
    return user


def email_is_owner(email: str) -> bool:
    """True if `email` is the store owner (settings.OWNER_EMAIL), case-insensitive."""
    return email.strip().lower() == settings.OWNER_EMAIL.strip().lower()


def require_owner(user: User = Depends(require_admin)) -> User:
    """403 unless the authenticated admin is the store owner.

    Only the owner may manage the admin team (add / deactivate admins). Every
    other admin keeps full product access.
    """
    if not email_is_owner(user.email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the store owner can manage the team.",
        )
    return user

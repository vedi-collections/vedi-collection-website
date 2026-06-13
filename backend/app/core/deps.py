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

from app.core.database import get_db
from app.core.security import ACCESS, decode_token
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
    if user is None:
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

import uuid
from datetime import UTC, datetime, timedelta

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS = "access"
REFRESH = "refresh"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _create_token(
    *, subject: uuid.UUID, role: str, secret: str, expires_delta: timedelta, token_type: str
) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(subject),
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, secret, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: uuid.UUID, role: str) -> str:
    return _create_token(
        subject=subject,
        role=role,
        secret=settings.JWT_SECRET,
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TTL_MIN),
        token_type=ACCESS,
    )


def create_refresh_token(subject: uuid.UUID, role: str) -> str:
    return _create_token(
        subject=subject,
        role=role,
        secret=settings.JWT_REFRESH_SECRET,
        expires_delta=timedelta(days=settings.JWT_REFRESH_TTL_DAYS),
        token_type=REFRESH,
    )


def decode_token(token: str, *, refresh: bool = False) -> dict:
    """Decode and verify a JWT. Raises jwt.PyJWTError on any failure."""
    secret = settings.JWT_REFRESH_SECRET if refresh else settings.JWT_SECRET
    return jwt.decode(token, secret, algorithms=[settings.JWT_ALGORITHM])

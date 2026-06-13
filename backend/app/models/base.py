"""Declarative base and shared column types.

The same models must run on PostgreSQL (production, via Alembic) and on SQLite
(tests, via `create_all`). We therefore use SQLAlchemy's portable `Uuid` type and
a JSONB-on-Postgres / JSON-on-SQLite variant. The Alembic migration renders the
native PostgreSQL `UUID`/`JSONB` types explicitly (that is the production source
of truth).
"""

from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# JSONB on Postgres; plain JSON on SQLite so the suite runs without a database server.
JSONBType = JSONB().with_variant(JSON(), "sqlite")

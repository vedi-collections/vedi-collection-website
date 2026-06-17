#!/usr/bin/env python
"""Apply a raw SQL migration file against DATABASE_URL.

Used because schema is managed outside Alembic (Supabase). Runs the whole file
in a single transaction; idempotent migrations can be re-run safely.

    python scripts/apply_migration.py scripts/migrations/0002_email_otp.sql
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.core.database import engine  # noqa: E402


def main() -> None:
    if len(sys.argv) != 2:
        print("usage: python scripts/apply_migration.py <path-to.sql>", file=sys.stderr)
        raise SystemExit(2)

    sql_path = Path(sys.argv[1])
    if not sql_path.is_absolute():
        sql_path = ROOT / sql_path
    sql = sql_path.read_text(encoding="utf-8")

    with engine.begin() as conn:
        conn.exec_driver_sql(sql)
    print(f"Applied migration: {sql_path.name}")


if __name__ == "__main__":
    main()

"""Audit trail helpers: write change_log rows for admin mutations.

Per the panel rules, the change_log row is written in the SAME transaction as
the product change (so it's durable before we respond), and emails — added in
Phase 4 — fire afterwards via BackgroundTasks, never blocking the save.
"""

from __future__ import annotations

import enum
import json
import uuid
from collections.abc import Iterable

from sqlalchemy.orm import Session

from app.models.change_log import ChangeLog
from app.models.enums import ChangeAction


def stringify(value: object) -> str | None:
    """Render a field value as audit-friendly text."""
    if value is None:
        return None
    if isinstance(value, enum.Enum):
        return str(value.value)
    if isinstance(value, (list, dict)):
        return json.dumps(value, default=str, ensure_ascii=False)
    return str(value)


def _add(
    db: Session,
    *,
    admin_id: uuid.UUID,
    product_id: uuid.UUID,
    action: ChangeAction,
    field_changed: str | None = None,
    old_value: object = None,
    new_value: object = None,
) -> ChangeLog:
    entry = ChangeLog(
        admin_id=admin_id,
        product_id=product_id,
        action=action,
        field_changed=field_changed,
        old_value=stringify(old_value),
        new_value=stringify(new_value),
    )
    db.add(entry)
    return entry


def log_create(db: Session, *, admin_id: uuid.UUID, product_id: uuid.UUID) -> None:
    _add(db, admin_id=admin_id, product_id=product_id, action=ChangeAction.create)


def log_updates(
    db: Session,
    *,
    admin_id: uuid.UUID,
    product_id: uuid.UUID,
    diffs: Iterable[tuple[str, object, object]],
) -> None:
    """One row per changed field: (field_name, old_value, new_value)."""
    for field, old, new in diffs:
        _add(
            db,
            admin_id=admin_id,
            product_id=product_id,
            action=ChangeAction.update,
            field_changed=field,
            old_value=old,
            new_value=new,
        )


def log_delete(db: Session, *, admin_id: uuid.UUID, product_id: uuid.UUID) -> None:
    _add(
        db,
        admin_id=admin_id,
        product_id=product_id,
        action=ChangeAction.delete,
        field_changed="is_active",
        old_value=True,
        new_value=False,
    )

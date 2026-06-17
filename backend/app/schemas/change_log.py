import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import ChangeAction


class ChangeLogOut(BaseModel):
    id: uuid.UUID
    admin_id: uuid.UUID
    product_id: uuid.UUID
    action: ChangeAction
    field_changed: str | None
    old_value: str | None
    new_value: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

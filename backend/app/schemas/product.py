import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import ProductAudience, ProductStatus


def _clean_subcategory(value: str | None) -> str | None:
    """Trim a sub-category; treat blank as None so empties don't pollute the list."""
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None


class ProductCreate(BaseModel):
    """New launch payload: live now, draft, or scheduled (Phase 5 flips it live)."""

    name: str = Field(min_length=1, max_length=512)
    description: str | None = None
    price: int = Field(ge=0, description="Whole rupees (INR); no paise.")
    stock_quantity: int = Field(default=0, ge=0)
    images: list[str] = Field(default_factory=list)
    audience: ProductAudience = ProductAudience.women
    subcategory: str | None = Field(default=None, max_length=128)
    status: ProductStatus = ProductStatus.draft
    go_live_at: datetime | None = None

    _normalize_subcategory = field_validator("subcategory")(_clean_subcategory)

    @model_validator(mode="after")
    def _scheduled_needs_go_live_at(self) -> "ProductCreate":
        if self.status is ProductStatus.scheduled and self.go_live_at is None:
            raise ValueError("go_live_at is required when status is 'scheduled'")
        return self


class ProductUpdate(BaseModel):
    """Partial update. Only fields explicitly sent are applied (exclude_unset)."""

    name: str | None = Field(default=None, min_length=1, max_length=512)
    description: str | None = None
    price: int | None = Field(default=None, ge=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    images: list[str] | None = None
    audience: ProductAudience | None = None
    subcategory: str | None = Field(default=None, max_length=128)
    status: ProductStatus | None = None
    go_live_at: datetime | None = None

    _normalize_subcategory = field_validator("subcategory")(_clean_subcategory)


class ProductAdmin(BaseModel):
    """Full row, for admin views (includes draft/scheduled/inactive/soft-deleted)."""

    id: uuid.UUID
    name: str
    description: str | None
    price: int
    stock_quantity: int
    images: list[str]
    audience: ProductAudience
    subcategory: str | None
    status: ProductStatus
    is_active: bool
    go_live_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductPublic(BaseModel):
    """Storefront-facing shape. Lifecycle/soft-delete fields are not exposed."""

    id: uuid.UUID
    name: str
    description: str | None
    price: int
    stock_quantity: int
    images: list[str]
    audience: ProductAudience
    subcategory: str | None

    model_config = {"from_attributes": True}

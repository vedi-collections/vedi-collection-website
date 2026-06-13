import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, JSONBType


class Product(Base):
    """Mirror of a Meta catalog product.

    Core fields are overwritten by sync; seller-only enrichments live in
    product_extras and are never overwritten.
    """

    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    retailer_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_minor: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    availability: Mapped[str | None] = mapped_column(String(32), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    meta_raw: Mapped[dict[str, Any] | None] = mapped_column(JSONBType, nullable=True)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    extras: Mapped["ProductExtra | None"] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class ProductExtra(Base):
    """Seller-editable product enrichments. Sync must never overwrite these."""

    __tablename__ = "product_extras"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id"), primary_key=True
    )
    long_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_images: Mapped[list[str] | None] = mapped_column(JSONBType, nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(JSONBType, nullable=True)

    product: Mapped[Product] = relationship(back_populates="extras")

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, JSONBType
from app.models.enums import ProductAudience, ProductStatus


class Product(Base):
    """A catalog product, managed manually by the admin (no external sync).

    Soft delete uses `is_active`; the launch lifecycle uses `status` +
    `go_live_at` (see Phase 5). Public reads require `status == live AND is_active`.
    """

    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Whole rupees (INR). Integer per the project money rule; the UI formats
    # with Indian-style commas (e.g. 1850 -> "1,850"). No paise.
    # Selling price the customer pays, in whole rupees (INR). No paise.
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    # Original price (MRP) before discount, whole rupees. NULL when the product
    # isn't discounted. The discount % is always derived from mrp vs price, never
    # stored — so the two stay consistent. Storefront strikes mrp out when set.
    mrp: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # List of image URLs (admin-supplied). JSONB on Postgres, JSON on SQLite.
    images: Mapped[list[str]] = mapped_column(JSONBType, nullable=False, default=list)
    # Fixed top-level category (all/women/men) + a free-text sub-category the
    # seller can reuse or create (e.g. "Suits", "Safari Cloth"). NULL = none yet.
    audience: Mapped[ProductAudience] = mapped_column(
        Enum(ProductAudience, name="product_audience"),
        nullable=False,
        default=ProductAudience.women,
    )
    subcategory: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[ProductStatus] = mapped_column(
        Enum(ProductStatus, name="product_status"), nullable=False, default=ProductStatus.draft
    )
    # Soft-delete flag. DELETE flips this false; the row is never dropped.
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    go_live_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

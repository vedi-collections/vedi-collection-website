"""add product audience + subcategory

Revision ID: 202606170001
Revises: 202606110001
Create Date: 2026-06-17

Adds a fixed top-level category (audience: women/men) and a free-text,
seller-managed sub-category to products.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202606170001"
down_revision: str | None = "202606110001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

product_audience = sa.Enum("women", "men", name="product_audience")


def upgrade() -> None:
    bind = op.get_bind()
    product_audience.create(bind, checkfirst=True)
    op.add_column(
        "products",
        sa.Column(
            "audience",
            product_audience,
            nullable=False,
            server_default="women",
        ),
    )
    op.add_column("products", sa.Column("subcategory", sa.String(length=128), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "subcategory")
    op.drop_column("products", "audience")
    product_audience.drop(op.get_bind(), checkfirst=True)

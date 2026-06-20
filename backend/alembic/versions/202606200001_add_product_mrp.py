"""add product mrp (original price)

Revision ID: 202606200001
Revises: 202606170001
Create Date: 2026-06-20

Adds a nullable `mrp` (original price, whole rupees) to products. The selling
price stays in `price`; the discount % is derived from mrp vs price, never
stored. NULL mrp means the product isn't discounted.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202606200001"
down_revision: str | None = "202606170001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("products", sa.Column("mrp", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "mrp")

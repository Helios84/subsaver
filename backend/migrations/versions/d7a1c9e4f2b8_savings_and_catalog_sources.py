"""original price for student discounts, source and check date for catalog entries

Revision ID: d7a1c9e4f2b8
Revises: c4e8f1a2b7d3
Create Date: 2026-11-25 18:00:00.000000

- subscriptions.original_price_cents: the price before a student price was
  applied, so removing the student price can restore it.
- student_discounts.source_url / price_checked_on: where each catalog entry
  comes from and when its prices were last checked.

All three columns are nullable, so existing rows need no backfill.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7a1c9e4f2b8'
down_revision: Union[str, None] = 'c4e8f1a2b7d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subscriptions', sa.Column('original_price_cents', sa.Integer(), nullable=True))
    op.add_column('student_discounts', sa.Column('source_url', sa.String(), nullable=True))
    op.add_column('student_discounts', sa.Column('price_checked_on', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('student_discounts', 'price_checked_on')
    op.drop_column('student_discounts', 'source_url')
    op.drop_column('subscriptions', 'original_price_cents')

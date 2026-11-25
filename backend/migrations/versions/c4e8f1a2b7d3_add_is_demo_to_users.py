"""add is_demo flag to users

Revision ID: c4e8f1a2b7d3
Revises: a1b2c3d4e5f6
Create Date: 2026-11-12 21:00:00.000000

Marks temporary demo accounts so they can be restricted and deleted
automatically. Existing rows get FALSE through the server default.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e8f1a2b7d3'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('is_demo', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index('ix_users_is_demo', 'users', ['is_demo'])


def downgrade() -> None:
    op.drop_index('ix_users_is_demo', table_name='users')
    op.drop_column('users', 'is_demo')

"""jwt_blacklist, edu_verification_code, dashboard_preferences

Revision ID: a1b2c3d4e5f6
Revises: 25a70f804762
Create Date: 2026-05-04 03:00:00.000000

Changes:
  - Create revoked_tokens table for JWT blacklist (C-1)
  - Add edu_verification_code + edu_verification_code_expires to users (H-2)
  - Add dashboard_preferences (Text) to users (M-8)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '25a70f804762'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── JWT blacklist table ────────────────────────────────────────────────────
    op.create_table(
        'revoked_tokens',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('jti', sa.String(), unique=True, index=True, nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
    )

    # ── Separate EDU verification code fields ─────────────────────────────────
    op.add_column('users', sa.Column('edu_verification_code', sa.String(), nullable=True))
    op.add_column('users', sa.Column('edu_verification_code_expires', sa.DateTime(), nullable=True))

    # ── Dashboard preferences JSON blob ───────────────────────────────────────
    op.add_column('users', sa.Column('dashboard_preferences', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'dashboard_preferences')
    op.drop_column('users', 'edu_verification_code_expires')
    op.drop_column('users', 'edu_verification_code')
    op.drop_table('revoked_tokens')

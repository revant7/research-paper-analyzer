"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-04 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. papers
    op.create_table(
        'papers',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=True),
        sa.Column('authors', sa.String(length=1000), nullable=True),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('upload_date', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('page_count', sa.Integer(), nullable=True),
        sa.Column('total_chunks', sa.Integer(), server_default='0'),
        sa.Column('processing_status', sa.String(length=20), server_default='pending'),
        sa.Column('processing_error', sa.Text(), nullable=True),
        sa.Column('summary_status', sa.String(length=20), server_default='pending'),
        sa.Column('abstract', sa.Text(), nullable=True),
        sa.Column('sha256', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_papers_user_id', 'papers', ['user_id'])
    op.create_index('ix_papers_sha256', 'papers', ['sha256'])

    # 3. summaries
    op.create_table(
        'summaries',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('paper_id', sa.String(length=36), sa.ForeignKey('papers.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('tldr', sa.Text(), nullable=True),
        sa.Column('research_objective', sa.Text(), nullable=True),
        sa.Column('problem_statement', sa.Text(), nullable=True),
        sa.Column('methodology', sa.Text(), nullable=True),
        sa.Column('dataset', sa.Text(), nullable=True),
        sa.Column('key_findings', sa.Text(), nullable=True),
        sa.Column('results', sa.Text(), nullable=True),
        sa.Column('limitations', sa.Text(), nullable=True),
        sa.Column('conclusion', sa.Text(), nullable=True),
        sa.Column('future_scope', sa.Text(), nullable=True),
        sa.Column('key_contributions', sa.JSON(), nullable=True),
        sa.Column('keywords', sa.JSON(), nullable=True),
        sa.Column('generated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)')),
    )

    # 4. conversations
    op.create_table(
        'conversations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('paper_id', sa.String(length=36), sa.ForeignKey('papers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('paper_ids', sa.JSON(), nullable=True),
        sa.Column('paper_title', sa.String(length=500), nullable=True),
        sa.Column('paper_deleted', sa.Boolean(), server_default=sa.text('0'), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
    )
    op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])
    op.create_index('ix_conversations_paper_id', 'conversations', ['paper_id'])
    op.create_index('ix_conversations_updated_at', 'conversations', ['updated_at'])

    # 5. messages
    op.create_table(
        'messages',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('conversation_id', sa.String(length=36), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('citations', sa.JSON(), nullable=True),
        sa.Column('seq', sa.Integer(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
    )
    op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])
    op.create_index('ix_messages_seq', 'messages', ['conversation_id', 'seq'])

    # 6. search_history
    op.create_table(
        'search_history',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('query', sa.String(length=500), nullable=False),
        sa.Column('results_count', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
    )
    op.create_index('ix_search_history_user_id', 'search_history', ['user_id'])


def downgrade() -> None:
    op.drop_table('search_history')
    op.drop_table('messages')
    op.drop_table('conversations')
    op.drop_table('summaries')
    op.drop_table('papers')
    op.drop_table('users')

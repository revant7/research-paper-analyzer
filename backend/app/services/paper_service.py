"""Paper service - utility functions for paper management."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.paper import Paper
from app.models.summary import Summary
import uuid
import os


class PaperService:
    @staticmethod
    async def get_paper_for_user(db: AsyncSession, paper_id: uuid.UUID, user_id: uuid.UUID) -> Paper:
        """Get a paper verifying user ownership."""
        stmt = select(Paper).where(Paper.id == paper_id, Paper.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession, user_id: uuid.UUID) -> dict:
        """Get aggregated dashboard statistics for a user."""
        papers_count = (await db.execute(
            select(func.count()).select_from(Paper).where(Paper.user_id == user_id)
        )).scalar() or 0
        
        summaries_count = (await db.execute(
            select(func.count()).select_from(Summary)
            .join(Paper, Summary.paper_id == Paper.id)
            .where(Paper.user_id == user_id)
        )).scalar() or 0
        
        recent_papers = await db.execute(
            select(Paper).where(Paper.user_id == user_id)
            .order_by(desc(Paper.upload_date)).limit(5)
        )
        
        return {
            "total_papers": papers_count,
            "total_summaries": summaries_count,
            "recent_papers": [p for p in recent_papers.scalars().all()]
        }

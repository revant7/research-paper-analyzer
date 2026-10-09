"""Search service - orchestrates semantic search operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.search_history import SearchHistory
import uuid


class SearchService:
    @staticmethod
    async def save_search(db: AsyncSession, user_id: uuid.UUID, query: str, results_count: int):
        """Save a search query to history."""
        history = SearchHistory(
            user_id=user_id,
            query=query,
            results_count=results_count
        )
        db.add(history)
        await db.commit()
    
    @staticmethod
    async def get_history(db: AsyncSession, user_id: uuid.UUID, limit: int = 20):
        """Get user's search history."""
        stmt = select(SearchHistory).where(
            SearchHistory.user_id == user_id
        ).order_by(desc(SearchHistory.created_at)).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

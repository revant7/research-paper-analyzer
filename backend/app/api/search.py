import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from app.database.database import get_db
from app.models.user import User
from app.models.paper import Paper
from app.models.search_history import SearchHistory
from app.schemas.search import SearchQuery, SearchResponse, SearchResultItem
from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.rag.embeddings import get_embedding_service
from app.rag.vector_store import get_vector_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/search", tags=["Search"])
settings = get_settings()


@router.post("", response_model=SearchResponse)
async def semantic_search(
    query_data: SearchQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        embedding_service = get_embedding_service()
        vector_store = get_vector_store()
        
        # Normalize paper_ids to strings
        paper_ids = [str(pid) for pid in query_data.paper_ids] if query_data.paper_ids else None
        
        # Generate query embedding offloaded to threadpool
        query_embedding = await asyncio.to_thread(embedding_service.generate_embedding, query_data.query)
        
        # Search vector store scoped to current user offloaded to threadpool
        results = await asyncio.to_thread(
            vector_store.search,
            query_embedding=query_embedding,
            user_id=str(current_user.id),
            top_k=min(max(query_data.limit, 1), 50),
            paper_ids=paper_ids,
            similarity_threshold=settings.SIMILARITY_THRESHOLD
        )
        
        # Collect unique paper_ids from vector hits
        hit_paper_ids = list({r.get('metadata', {}).get('paper_id') for r in results if r.get('metadata', {}).get('paper_id')})
        
        # Single bulk query to fetch matching papers owned by current user
        papers_by_id = {}
        if hit_paper_ids:
            stmt = select(Paper).where(
                Paper.id.in_(hit_paper_ids),
                Paper.user_id == str(current_user.id)
            )
            res = await db.execute(stmt)
            for p in res.scalars().all():
                papers_by_id[str(p.id)] = p
        
        # Build enriched search results (only including user-owned papers)
        search_results = []
        for r in results:
            p_id = str(r.get('metadata', {}).get('paper_id', ''))
            paper = papers_by_id.get(p_id)
            if not paper:
                continue
            
            search_results.append(SearchResultItem(
                paper_id=p_id,
                paper_title=paper.title or "Untitled Paper",
                authors=paper.authors or "",
                content=r.get('content', ''),
                page_number=r.get('metadata', {}).get('page_number', 1),
                relevance_score=round(float(r.get('score', 0.0)), 4),
                chunk_id=r.get('metadata', {}).get('chunk_id', '')
            ))
        
        # Save search history
        try:
            history = SearchHistory(
                user_id=str(current_user.id),
                query=query_data.query,
                results_count=len(search_results)
            )
            db.add(history)
            await db.commit()
        except Exception as he:
            logger.warning(f"Could not record search history: {he}")
        
        return SearchResponse(
            query=query_data.query,
            results=search_results,
            total_results=len(search_results)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Semantic search encountered an unhandled error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while executing the search request. Please try again."
        )


@router.get("/history")
async def get_search_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SearchHistory).where(
        SearchHistory.user_id == str(current_user.id)
    ).order_by(desc(SearchHistory.created_at)).limit(limit)
    result = await db.execute(stmt)
    history = result.scalars().all()
    return [
        {
            "id": str(h.id),
            "query": h.query,
            "results_count": h.results_count,
            "created_at": h.created_at.isoformat() if h.created_at else None
        }
        for h in history
    ]

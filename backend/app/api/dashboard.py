from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.database.database import get_db
from app.models.user import User
from app.models.paper import Paper
from app.models.summary import Summary
from app.models.conversation import Conversation
from app.models.search_history import SearchHistory
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Total papers
    papers_count = (await db.execute(
        select(func.count()).select_from(Paper).where(Paper.user_id == current_user.id)
    )).scalar() or 0
    
    # Total summaries
    summaries_count = (await db.execute(
        select(func.count()).select_from(Summary)
        .join(Paper, Summary.paper_id == Paper.id)
        .where(Paper.user_id == current_user.id)
    )).scalar() or 0
    
    # Total conversations
    conversations_count = (await db.execute(
        select(func.count()).select_from(Conversation).where(Conversation.user_id == current_user.id)
    )).scalar() or 0
    
    # Total searches
    searches_count = (await db.execute(
        select(func.count()).select_from(SearchHistory).where(SearchHistory.user_id == current_user.id)
    )).scalar() or 0
    
    # Recent papers
    recent_papers_result = await db.execute(
        select(Paper).where(Paper.user_id == current_user.id)
        .order_by(desc(Paper.upload_date)).limit(5)
    )
    recent_papers = [{
        "id": str(p.id),
        "title": p.title,
        "authors": p.authors,
        "upload_date": p.upload_date.isoformat() if p.upload_date else None,
        "uploadDate": p.upload_date.isoformat() if p.upload_date else None,
        "processing_status": p.processing_status,
        "processingStatus": p.processing_status,
        "status": p.processing_status,
        "summary_status": p.summary_status,
        "summaryStatus": p.summary_status
    } for p in recent_papers_result.scalars().all()]
    
    # Recent conversations
    recent_convos_result = await db.execute(
        select(Conversation).where(Conversation.user_id == current_user.id)
        .order_by(desc(Conversation.created_at)).limit(5)
    )
    recent_conversations = [{
        "id": str(c.id),
        "title": c.title,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "createdAt": c.created_at.isoformat() if c.created_at else None,
        "paper_name": c.paper_title or ("Paper deleted" if c.paper_deleted else None),
        "paperName": c.paper_title or ("Paper deleted" if c.paper_deleted else None),
        "paper_deleted": bool(c.paper_deleted),
        "paperDeleted": bool(c.paper_deleted)
    } for c in recent_convos_result.scalars().all()]
    
    return {
        "total_papers": papers_count,
        "totalPapers": papers_count,
        "total_summaries": summaries_count,
        "summariesGenerated": summaries_count,
        "total_conversations": conversations_count,
        "conversations": conversations_count,
        "total_searches": searches_count,
        "searches": searches_count,
        "recent_papers": recent_papers,
        "recentPapers": recent_papers,
        "recent_conversations": recent_conversations,
        "recentConversations": recent_conversations
    }

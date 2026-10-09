import logging
import asyncio
from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.database.database import get_db
from app.models.user import User
from app.models.paper import Paper
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import (
    ChatRequest, ChatResponse, ChatMessageResponse,
    CitationSchema, ConversationResponse, ConversationDetailResponse
)
from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.rag.embeddings import get_embedding_service
from app.rag.vector_store import get_vector_store
from app.rag.llm_provider import get_llm_provider
from app.rag.retriever import Retriever
from app.rag.generator import RAGGenerator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])
settings = get_settings()


@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Resolve or create conversation
    conversation = None
    if request.conversation_id:
        stmt = select(Conversation).where(
            Conversation.id == str(request.conversation_id),
            Conversation.user_id == str(current_user.id)
        )
        res = await db.execute(stmt)
        conversation = res.scalar_one_or_none()
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation '{request.conversation_id}' not found"
            )

    # 2. Determine target paper IDs
    if conversation and conversation.paper_deleted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The paper for this conversation was deleted"
        )

    target_paper_ids: List[str] = []
    if request.paper_id:
        target_paper_ids = [str(request.paper_id)]
    elif request.paper_ids:
        target_paper_ids = [str(pid) for pid in request.paper_ids]
    elif conversation:
        if conversation.paper_id:
            target_paper_ids = [str(conversation.paper_id)]
        elif conversation.paper_ids:
            target_paper_ids = [str(pid) for pid in conversation.paper_ids]

    # 3. Validate paper ownership and processing status
    if target_paper_ids:
        stmt = select(Paper).where(
            Paper.id.in_(target_paper_ids),
            Paper.user_id == str(current_user.id)
        )
        res = await db.execute(stmt)
        found_papers = {str(p.id): p for p in res.scalars().all()}
        
        # Check existence
        missing_ids = set(target_paper_ids) - set(found_papers.keys())
        if missing_ids:
            if conversation and not found_papers:
                # If all referenced papers for an existing conversation are gone
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="The paper for this conversation was deleted"
                )
            missing_one = next(iter(missing_ids))
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Paper '{missing_one}' not found"
            )
        
        # Check processing completion
        for pid, paper in found_papers.items():
            if paper.processing_status != "completed":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Paper '{paper.title or pid}' is still processing. Please wait until processing completes."
                )

    # 4. Create new conversation if none exists
    now_utc = datetime.utcnow()
    if not conversation:
        title = request.message[:80] + ("..." if len(request.message) > 80 else "")
        primary_paper_id = target_paper_ids[0] if len(target_paper_ids) == 1 else None
        paper_title = None
        if primary_paper_id and primary_paper_id in found_papers:
            paper_title = found_papers[primary_paper_id].title
        elif target_paper_ids and len(target_paper_ids) > 1:
            paper_title = f"{len(target_paper_ids)} Papers"

        conversation = Conversation(
            user_id=str(current_user.id),
            paper_id=primary_paper_id,
            paper_ids=target_paper_ids if len(target_paper_ids) > 1 else None,
            paper_title=paper_title,
            title=title,
            updated_at=now_utc
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    # 5. Get current message count for sequencing
    count_stmt = select(func.count(Message.id)).where(Message.conversation_id == conversation.id)
    current_count = (await db.execute(count_stmt)).scalar() or 0
    user_seq = current_count + 1
    assistant_seq = current_count + 2

    # 6. Fetch conversation history for context (last 6 messages)
    history_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.seq.asc())
    )
    history_result = await db.execute(history_stmt)
    history_messages = [
        {"role": m.role, "content": m.content}
        for m in history_result.scalars().all()
    ][-6:]

    # 7. Persist user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
        seq=user_seq
    )
    db.add(user_msg)
    await db.commit()

    # 8. Execute RAG retrieval and generation
    try:
        embedding_service = get_embedding_service()
        vector_store = get_vector_store()
        llm = get_llm_provider(
            provider=settings.LLM_PROVIDER.value,
            api_key=settings.OPENAI_API_KEY,
            token=settings.HUGGINGFACE_API_KEY
        )

        retriever = Retriever(vector_store, embedding_service)
        generator = RAGGenerator(llm)

        chunks = await asyncio.to_thread(
            retriever.retrieve,
            query=request.message,
            user_id=str(current_user.id),
            top_k=settings.TOP_K_RESULTS,
            paper_ids=target_paper_ids if target_paper_ids else None
        )

        # Map paper titles for citations
        paper_titles = {}
        if chunks:
            chunk_pids = list({c.get('metadata', {}).get('paper_id') for c in chunks if c.get('metadata', {}).get('paper_id')})
            if chunk_pids:
                p_res = await db.execute(select(Paper).where(Paper.id.in_(chunk_pids)))
                for p in p_res.scalars().all():
                    paper_titles[str(p.id)] = p.title

        answer_data = await generator.generate_answer(
            query=request.message,
            context_chunks=chunks,
            paper_titles=paper_titles,
            history=history_messages
        )

        answer_text = answer_data.get('answer', 'No relevant content found in referenced papers.')
        citations = answer_data.get('citations', [])

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Chat generation failure in conversation {conversation.id}: {e}")
        # Note: Do NOT store failed messages in the database
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service is unavailable, please retry"
        )

    # 9. Persist assistant message and update conversation timestamp
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer_text,
        citations=citations,
        seq=assistant_seq
    )
    conversation.updated_at = datetime.utcnow()
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    return ChatResponse(
        conversation_id=str(conversation.id),
        message=ChatMessageResponse(
            id=str(assistant_msg.id),
            role="assistant",
            content=answer_text,
            citations=[CitationSchema(**c) if isinstance(c, dict) else c for c in citations],
            seq=assistant_seq,
            created_at=assistant_msg.created_at
        ),
        conversation_title=conversation.title
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch user conversations ordered by updated_at descending
    conv_stmt = (
        select(Conversation)
        .where(Conversation.user_id == str(current_user.id))
        .order_by(desc(Conversation.updated_at))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(conv_stmt)
    conversations = result.scalars().all()

    if not conversations:
        return []

    # Single grouped query to count messages per conversation (no N+1)
    conv_ids = [c.id for c in conversations]
    counts_stmt = (
        select(Message.conversation_id, func.count(Message.id))
        .where(Message.conversation_id.in_(conv_ids))
        .group_by(Message.conversation_id)
    )
    counts_res = await db.execute(counts_stmt)
    msg_counts = dict(counts_res.all())

    return [
        ConversationResponse(
            id=str(c.id),
            title=c.title,
            paper_id=str(c.paper_id) if c.paper_id else None,
            paper_ids=[str(pid) for pid in c.paper_ids] if c.paper_ids else None,
            paper_name="Paper deleted" if c.paper_deleted else c.paper_title,
            paper_deleted=bool(c.paper_deleted),
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=msg_counts.get(c.id, 0)
        )
        for c in conversations
    ]


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Conversation).where(
        Conversation.id == str(conversation_id),
        Conversation.user_id == str(current_user.id)
    )
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Fetch messages ordered by sequence
    msg_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.seq.asc())
    )
    msg_result = await db.execute(msg_stmt)
    messages = msg_result.scalars().all()

    return ConversationDetailResponse(
        id=str(conversation.id),
        title=conversation.title,
        paper_id=str(conversation.paper_id) if conversation.paper_id else None,
        paper_ids=[str(pid) for pid in conversation.paper_ids] if conversation.paper_ids else None,
        paper_name="Paper deleted" if conversation.paper_deleted else conversation.paper_title,
        paper_deleted=bool(conversation.paper_deleted),
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=len(messages),
        messages=[
            ChatMessageResponse(
                id=str(m.id),
                role=m.role,
                content=m.content,
                citations=[CitationSchema(**c) if isinstance(c, dict) else c for c in (m.citations or [])],
                seq=m.seq,
                created_at=m.created_at
            )
            for m in messages
        ]
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Conversation).where(
        Conversation.id == str(conversation_id),
        Conversation.user_id == str(current_user.id)
    )
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conversation)
    await db.commit()

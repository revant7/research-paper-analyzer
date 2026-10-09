"""Chat service - manages conversations and RAG-powered Q&A."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from app.models.conversation import Conversation
from app.models.message import Message
import uuid


class ChatService:
    @staticmethod
    async def get_or_create_conversation(
        db: AsyncSession, user_id: uuid.UUID, title: str,
        paper_id: uuid.UUID = None, paper_ids: list = None
    ) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(
            user_id=user_id,
            paper_id=paper_id,
            paper_ids=paper_ids,
            title=title
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        return conversation
    
    @staticmethod
    async def add_message(
        db: AsyncSession, conversation_id: uuid.UUID,
        role: str, content: str, citations: list = None
    ) -> Message:
        """Add a message to a conversation."""
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            citations=citations
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)
        return message
    
    @staticmethod
    async def get_conversation_messages(db: AsyncSession, conversation_id: uuid.UUID):
        """Get all messages for a conversation."""
        stmt = select(Message).where(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at)
        result = await db.execute(stmt)
        return result.scalars().all()

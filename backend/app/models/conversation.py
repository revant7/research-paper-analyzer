import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="SET NULL"), nullable=True, index=True)
    paper_ids = Column(JSON, nullable=True)
    paper_title = Column(String(500), nullable=True)
    paper_deleted = Column(Boolean, default=False, nullable=False)
    title = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), index=True)

    user = relationship("User", back_populates="conversations")
    paper = relationship("Paper", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.seq")

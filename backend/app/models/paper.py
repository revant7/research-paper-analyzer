import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.database import Base


class Paper(Base):
    __tablename__ = "papers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(500))
    authors = Column(String(1000))
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    upload_date = Column(DateTime, server_default=func.now())
    page_count = Column(Integer)
    total_chunks = Column(Integer, default=0)
    processing_status = Column(String(20), default="pending")
    processing_error = Column(Text, nullable=True)
    summary_status = Column(String(20), default="pending")
    abstract = Column(Text, nullable=True)
    sha256 = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="papers")
    summary = relationship("Summary", back_populates="paper", uselist=False, cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="paper")

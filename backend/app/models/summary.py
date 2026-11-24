import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String(36), ForeignKey("papers.id"), unique=True, nullable=False)
    tldr = Column(Text)
    research_objective = Column(Text)
    problem_statement = Column(Text)
    methodology = Column(Text)
    dataset = Column(Text)
    key_findings = Column(Text)
    results = Column(Text)
    limitations = Column(Text)
    conclusion = Column(Text)
    future_scope = Column(Text)
    key_contributions = Column(JSON)
    keywords = Column(JSON)
    generated_at = Column(DateTime, server_default=func.now())

    paper = relationship("Paper", back_populates="summary")

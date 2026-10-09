from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Any, Union


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[Union[str, UUID]] = Field(default=None, alias="conversationId")
    paper_id: Optional[Union[str, UUID]] = Field(default=None, alias="paperId")
    paper_ids: Optional[List[Union[str, UUID]]] = Field(default=None, alias="paperIds")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class CitationSchema(BaseModel):
    paper_title: Optional[str] = None
    page_number: Optional[int] = None
    content: Optional[str] = None
    paper_id: Optional[Union[str, UUID]] = None

    model_config = ConfigDict(from_attributes=True)


class ChatMessageResponse(BaseModel):
    id: Union[str, UUID]
    role: str
    content: str
    citations: Optional[List[CitationSchema]] = None
    seq: Optional[int] = 1
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ChatResponse(BaseModel):
    conversation_id: str
    message: ChatMessageResponse
    conversation_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    id: str
    title: Optional[str] = None
    paper_id: Optional[str] = None
    paper_ids: Optional[List[str]] = None
    paper_name: Optional[str] = Field(default=None, alias="paperName")
    paper_deleted: bool = Field(default=False, alias="paperDeleted")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    message_count: int = 0

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ConversationDetailResponse(ConversationResponse):
    messages: List[ChatMessageResponse] = []

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

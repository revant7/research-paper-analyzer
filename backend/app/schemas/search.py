from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from typing import Optional, List, Union


class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    paper_ids: Optional[List[Union[str, UUID]]] = None
    limit: int = Field(default=10, ge=1, le=50)

    model_config = ConfigDict(populate_by_name=True)


class SearchResultItem(BaseModel):
    paper_id: str
    paper_title: Optional[str] = None
    authors: Optional[str] = None
    content: str
    page_number: Optional[int] = None
    relevance_score: Optional[float] = None
    chunk_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total_results: int

    model_config = ConfigDict(from_attributes=True)

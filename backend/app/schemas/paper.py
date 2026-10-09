from pydantic import BaseModel, ConfigDict, Field, model_validator
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Union


class PaperResponse(BaseModel):
    id: Union[str, UUID]
    title: Optional[str] = None
    authors: Optional[str] = None
    file_name: str = Field(alias="fileName")
    upload_date: Optional[datetime] = Field(default=None, alias="uploadDate")
    page_count: Optional[int] = Field(default=None, alias="pageCount")
    total_chunks: int = Field(default=0, alias="totalChunks")
    processing_status: str = Field(alias="processingStatus")
    status: Optional[str] = None
    summary_status: str = Field(alias="summaryStatus")
    abstract: Optional[str] = None
    sha256: Optional[str] = None
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")

    @model_validator(mode="after")
    def populate_status_alias(self):
        if not self.status:
            self.status = self.processing_status
        return self

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class PaperListResponse(BaseModel):
    papers: List[PaperResponse]
    total: int

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class PaperDetailResponse(PaperResponse):
    has_summary: bool = Field(default=False, alias="hasSummary")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

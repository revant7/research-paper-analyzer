from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Union


class SummaryResponse(BaseModel):
    id: Optional[Union[str, UUID]] = None
    paper_id: Optional[Union[str, UUID]] = None
    tldr: Optional[str] = None
    research_objective: Optional[str] = Field(default=None, alias="objective")
    problem_statement: Optional[str] = Field(default=None, alias="problemStatement")
    methodology: Optional[str] = None
    dataset: Optional[str] = None
    key_findings: Optional[str] = None
    results: Optional[str] = None
    limitations: Optional[str] = None
    conclusion: Optional[str] = None
    future_scope: Optional[str] = Field(default=None, alias="futureScope")
    key_contributions: Optional[List[str]] = Field(default=None, alias="keyContributions")
    keywords: Optional[List[str]] = None
    generated_at: Optional[datetime] = Field(default=None, alias="generatedAt")
    status: Optional[str] = "completed"

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class SummaryStatusResponse(BaseModel):
    status: str
    message: str
    paper_id: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class SummaryGenerateRequest(BaseModel):
    force_regenerate: bool = False

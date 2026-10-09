import logging
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.paper import Paper
from app.models.summary import Summary
from app.schemas.summary import SummaryResponse, SummaryGenerateRequest, SummaryStatusResponse
from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.rag.pdf_processor import PDFProcessor
from app.rag.summarizer import PaperSummarizer
from app.rag.llm_provider import get_llm_provider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/papers", tags=["Summaries"])
settings = get_settings()


async def generate_summary_background(paper_id: str, user_id: str):
    async with AsyncSessionLocal() as db:
        try:
            stmt = select(Paper).where(Paper.id == paper_id, Paper.user_id == user_id)
            result = await db.execute(stmt)
            paper = result.scalar_one_or_none()
            if not paper:
                return

            processor = PDFProcessor()
            extracted = await asyncio.to_thread(processor.extract_text, paper.file_path)
            text = await asyncio.to_thread(processor.clean_text, extracted['text'])

            llm = get_llm_provider(
                provider=settings.LLM_PROVIDER.value,
                api_key=settings.OPENAI_API_KEY,
                token=settings.HUGGINGFACE_API_KEY
            )
            summarizer = PaperSummarizer(llm)
            summary_data = await summarizer.summarize(text, metadata={
                'title': paper.title,
                'authors': paper.authors
            })

            # Check existing summary
            existing_stmt = select(Summary).where(Summary.paper_id == paper.id)
            existing_result = await db.execute(existing_stmt)
            existing_summary = existing_result.scalar_one_or_none()

            # summaries.generated_at is stored as TIMESTAMP WITHOUT TIME ZONE.
            now_utc = datetime.utcnow()
            if existing_summary:
                for key, value in summary_data.items():
                    if hasattr(existing_summary, key):
                        setattr(existing_summary, key, value)
                existing_summary.generated_at = now_utc
            else:
                summary_obj = Summary(paper_id=paper.id, **summary_data, generated_at=now_utc)
                db.add(summary_obj)

            paper.summary_status = "completed"
            await db.commit()
            logger.info(f"Summary successfully generated for paper {paper_id}")

        except Exception as e:
            logger.exception(f"Background summary generation failed for paper {paper_id}: {e}")
            try:
                stmt = select(Paper).where(Paper.id == paper_id)
                res = await db.execute(stmt)
                p = res.scalar_one_or_none()
                if p:
                    p.summary_status = "failed"
                    await db.commit()
            except Exception:
                pass


@router.post("/{paper_id}/summarize")
async def summarize_paper(
    paper_id: str,
    background_tasks: BackgroundTasks,
    body: SummaryGenerateRequest = SummaryGenerateRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Paper).where(Paper.id == paper_id, Paper.user_id == str(current_user.id))
    result = await db.execute(stmt)
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if paper.processing_status != "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Paper must be fully processed before summarization"
        )

    # Check if summary already exists
    existing_stmt = select(Summary).where(Summary.paper_id == paper.id)
    existing_result = await db.execute(existing_stmt)
    existing_summary = existing_result.scalar_one_or_none()

    if existing_summary and not body.force_regenerate:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=SummaryResponse.model_validate(existing_summary).model_dump(by_alias=True, mode="json")
        )

    if paper.summary_status == "processing" and not body.force_regenerate:
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={"status": "processing", "message": "Summary generation already in progress", "paper_id": str(paper.id)}
        )

    paper.summary_status = "processing"
    await db.commit()

    background_tasks.add_task(generate_summary_background, str(paper.id), str(current_user.id))

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"status": "processing", "message": "Summary generation started", "paper_id": str(paper.id)}
    )


@router.get("/{paper_id}/summary")
async def get_summary(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Paper).where(Paper.id == paper_id, Paper.user_id == str(current_user.id))
    result = await db.execute(stmt)
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if paper.summary_status == "processing":
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={"status": "processing", "message": "Summary is being generated. Please retry shortly.", "paper_id": str(paper.id)}
        )

    if paper.summary_status == "failed":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"status": "failed", "detail": "Summary generation failed. Please regenerate."}
        )

    summary_stmt = select(Summary).where(Summary.paper_id == paper.id)
    summary_result = await db.execute(summary_stmt)
    summary = summary_result.scalar_one_or_none()
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary not yet generated. Use POST /api/papers/{id}/summarize to generate."
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=SummaryResponse.model_validate(summary).model_dump(by_alias=True, mode="json")
    )


@router.post("/{paper_id}/summary/client", response_model=SummaryResponse)
async def save_client_summary(
    paper_id: str,
    summary_data: SummaryResponse,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Persist a summary generated by a browser-side provider such as Puter.js."""
    paper_result = await db.execute(
        select(Paper).where(Paper.id == paper_id, Paper.user_id == str(current_user.id))
    )
    paper = paper_result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    existing_result = await db.execute(select(Summary).where(Summary.paper_id == paper.id))
    summary = existing_result.scalar_one_or_none()
    values = summary_data.model_dump(by_alias=False, exclude_unset=True)
    values.pop("id", None)
    values.pop("paper_id", None)
    values.pop("generated_at", None)
    values.pop("status", None)

    if summary:
        for key, value in values.items():
            if hasattr(summary, key):
                setattr(summary, key, value)
        summary.generated_at = datetime.utcnow()
    else:
        summary = Summary(paper_id=paper.id, **values, generated_at=datetime.utcnow())
        db.add(summary)

    paper.summary_status = "completed"
    await db.commit()
    await db.refresh(summary)
    return SummaryResponse.model_validate(summary)

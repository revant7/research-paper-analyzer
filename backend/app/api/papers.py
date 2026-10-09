import asyncio
import hashlib
import logging
import os
import shutil
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update

from app.database.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.paper import Paper
from app.models.summary import Summary
from app.models.conversation import Conversation
from app.schemas.paper import PaperResponse, PaperListResponse, PaperDetailResponse
from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.services.processing_service import ProcessingService
from app.rag.vector_store import get_vector_store
from app.rag.pdf_processor import PDFProcessor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/papers", tags=["Papers"])
settings = get_settings()


@router.post("/upload", response_model=PaperResponse, status_code=status.HTTP_201_CREATED)
async def upload_paper(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Validate file extension
    raw_filename = file.filename or "paper.pdf"
    if not raw_filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are supported")

    # 2. Prepare paths and streaming buffers
    safe_basename = os.path.basename(raw_filename)
    file_id = str(uuid.uuid4())
    stored_name = f"{file_id}_{safe_basename}"
    user_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, stored_name)

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    chunk_size = 64 * 1024  # 64 KB
    total_bytes = 0
    hasher = hashlib.sha256()
    magic_verified = False

    try:
        with open(file_path, "wb") as f:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)

                if total_bytes > max_bytes:
                    f.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
                    )

                if not magic_verified:
                    if not chunk.startswith(b"%PDF-"):
                        f.close()
                        if os.path.exists(file_path):
                            os.remove(file_path)
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid PDF format: file header does not match %PDF-"
                        )
                    magic_verified = True

                hasher.update(chunk)
                f.write(chunk)

    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.exception(f"Error writing uploaded file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store uploaded file on server"
        )

    sha256_hash = hasher.hexdigest()

    # 3. Check for duplicate upload by this user
    stmt = select(Paper).where(Paper.user_id == str(current_user.id), Paper.sha256 == sha256_hash)
    existing_dup = (await db.execute(stmt)).scalar_one_or_none()
    if existing_dup:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate paper: '{existing_dup.title or existing_dup.file_name}' has already been uploaded."
        )

    # 4. Create paper record
    paper = Paper(
        id=file_id,
        user_id=str(current_user.id),
        title=safe_basename.replace(".pdf", "").replace("_", " ").replace("-", " "),
        file_name=safe_basename,
        file_path=file_path,
        sha256=sha256_hash,
        processing_status="pending",
        summary_status="pending"
    )
    db.add(paper)
    await db.commit()
    await db.refresh(paper)

    # 5. Trigger background processing
    processing_service = ProcessingService()
    background_tasks.add_task(
        processing_service.process_paper,
        paper_id=str(paper.id),
        file_path=file_path,
        user_id=str(current_user.id)
    )

    return PaperResponse.model_validate(paper)


@router.post("/{paper_id}/reprocess", response_model=PaperResponse)
async def reprocess_paper(
    paper_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Paper).where(Paper.id == paper_id, Paper.user_id == str(current_user.id))
    result = await db.execute(stmt)
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if not os.path.exists(paper.file_path):
        raise HTTPException(status_code=404, detail="Original PDF file is missing on disk")

    paper.processing_status = "processing"
    paper.processing_error = None
    await db.commit()
    await db.refresh(paper)

    processing_service = ProcessingService()
    background_tasks.add_task(
        processing_service.process_paper,
        paper_id=str(paper.id),
        file_path=paper.file_path,
        user_id=str(current_user.id)
    )

    return PaperResponse.model_validate(paper)


@router.get("", response_model=PaperListResponse)
async def list_papers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Paper).where(Paper.user_id == str(current_user.id))
    if search:
        query = query.where(Paper.title.ilike(f"%{search}%"))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(desc(Paper.upload_date)).offset(skip).limit(limit)
    result = await db.execute(query)
    papers = result.scalars().all()

    return PaperListResponse(
        papers=[PaperResponse.model_validate(p) for p in papers],
        total=total
    )


@router.get("/{paper_id}", response_model=PaperDetailResponse)
async def get_paper(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Paper).where(Paper.id == paper_id, Paper.user_id == str(current_user.id))
    result = await db.execute(stmt)
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    summary_stmt = select(Summary).where(Summary.paper_id == paper.id)
    summary_result = await db.execute(summary_stmt)
    has_summary = summary_result.scalar_one_or_none() is not None

    response = PaperDetailResponse.model_validate(paper)
    response.has_summary = has_summary
    return response


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paper(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Paper).where(Paper.id == paper_id, Paper.user_id == str(current_user.id))
    result = await db.execute(stmt)
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # 1. Delete vector embeddings
    try:
        vs = get_vector_store()
        vs.delete_paper_documents(str(paper_id))
    except Exception as e:
        logger.warning(f"Failed to delete vector embeddings for paper {paper_id}: {e}")

    # 2. Delete file on disk
    if os.path.exists(paper.file_path):
        try:
            os.remove(paper.file_path)
        except Exception as e:
            logger.warning(f"Failed to remove file {paper.file_path} from disk: {e}")

    # 3. Mark conversations as paper_deleted and nullify FK to avoid dangling keys
    try:
        await db.execute(
            update(Conversation)
            .where(Conversation.paper_id == str(paper_id))
            .values(paper_id=None, paper_deleted=True)
        )
    except Exception as e:
        logger.warning(f"Failed to update conversation associations for paper {paper_id}: {e}")

    # 4. Delete paper from DB (summary cascades)
    await db.delete(paper)
    await db.commit()


@router.get("/{paper_id}/pdf")
async def get_pdf(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Paper).where(Paper.id == paper_id, Paper.user_id == str(current_user.id))
    result = await db.execute(stmt)
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if not os.path.exists(paper.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
    return FileResponse(paper.file_path, media_type="application/pdf", filename=paper.file_name)


@router.get("/{paper_id}/text")
async def get_paper_text(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Return extracted text for browser-side AI providers."""
    stmt = select(Paper).where(Paper.id == paper_id, Paper.user_id == str(current_user.id))
    result = await db.execute(stmt)
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if paper.processing_status != "completed":
        raise HTTPException(status_code=409, detail="Paper must be fully processed before reading its text")
    if not os.path.exists(paper.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    try:
        extracted = await asyncio.to_thread(PDFProcessor().extract_text, paper.file_path)
        text = await asyncio.to_thread(PDFProcessor().clean_text, extracted["text"])
        return {"paper_id": str(paper.id), "title": paper.title, "authors": paper.authors, "text": text}
    except Exception as exc:
        logger.exception("Failed to extract text for browser-side AI: %s", exc)
        raise HTTPException(status_code=500, detail="Unable to extract paper text")

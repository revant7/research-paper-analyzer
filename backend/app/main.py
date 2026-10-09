from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os

from app.config import get_settings
from app.database.database import init_db, AsyncSessionLocal
from app.rag.embeddings import get_embedding_service
from app.rag.vector_store import get_vector_store
from app.rag.llm_provider import get_llm_provider
from app.api import auth, papers, summaries, search, chat, dashboard

logger = logging.getLogger(__name__)
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up ResearchRAG API...")
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
    
    # Initialize singletons during lifespan
    embedding_service = get_embedding_service()
    vector_store = get_vector_store()
    get_llm_provider(
        provider=settings.LLM_PROVIDER.value,
        api_key=settings.OPENAI_API_KEY,
        token=settings.HUGGINGFACE_API_KEY
    )
    
    if settings.ENVIRONMENT == "production":
        model = embedding_service._get_model()
        if model is None or model is False:
            raise RuntimeError("Failed to load embedding model in production environment")

    # Recover any stuck papers from prior unexpected shutdown
    async with AsyncSessionLocal() as db:
        try:
            from app.models.paper import Paper
            from sqlalchemy import update
            await db.execute(
                update(Paper)
                .where(Paper.processing_status == "processing")
                .values(processing_status="failed", processing_error="Server restarted during processing")
            )
            await db.commit()
        except Exception as e:
            logger.warning(f"Failed to reset stuck processing papers: {e}")

    yield
    # Shutdown
    logger.info("Shutting down...")

app = FastAPI(
    title="ResearchRAG API",
    description="AI-Powered Research Paper Summarization and Semantic Search Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(papers.router)
app.include_router(summaries.router)
app.include_router(search.router)
app.include_router(chat.router)
app.include_router(dashboard.router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "An internal server error occurred."})

@app.get("/api/health")
async def health_check():
    db_status = "connected"
    try:
        from app.database.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Health check database connectivity error: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "database": "disconnected",
                "llm_provider": settings.LLM_PROVIDER.value,
                "version": "1.0.0"
            }
        )

    return {
        "status": "healthy",
        "database": db_status,
        "llm_provider": settings.LLM_PROVIDER.value,
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {"message": "ResearchRAG API", "docs": "/docs", "version": "1.0.0"}

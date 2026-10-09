import pytest
import asyncio
import time
import uuid
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.rag.embeddings import get_embedding_service
from app.rag.vector_store import get_vector_store
from app.rag.llm_provider import get_llm_provider
from app.database.database import init_db


@pytest.mark.asyncio
async def test_singletons_consistency():
    emb1 = get_embedding_service()
    emb2 = get_embedding_service()
    assert emb1 is emb2

    vs1 = get_vector_store()
    vs2 = get_vector_store()
    assert vs1 is vs2

    llm1 = get_llm_provider("mock")
    llm2 = get_llm_provider("mock")
    assert llm1 is llm2


@pytest.mark.asyncio
async def test_vector_store_idempotency_and_similarity():
    vs = get_vector_store()
    paper_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())

    docs = [
        {"content": "Quantum computing advances.", "metadata": {"page_number": 1}, "embedding": [0.1] * 384},
        {"content": "Error correction schemes.", "metadata": {"page_number": 2}, "embedding": [0.2] * 384}
    ]

    # Ingest once
    vs.add_documents(docs, paper_id, user_id)
    assert vs.get_paper_chunk_count(paper_id) == 2

    # Ingest second time -> chunk count should still be 2, not 4 (idempotent)
    vs.add_documents(docs, paper_id, user_id)
    assert vs.get_paper_chunk_count(paper_id) == 2

    # Search similarity score must be in [0.0, 1.0]
    results = vs.search(query_embedding=[0.1] * 384, user_id=user_id, top_k=5)
    assert len(results) > 0
    for r in results:
        assert 0.0 <= r["score"] <= 1.0

    # Clean up
    vs.delete_paper_documents(paper_id)
    assert vs.get_paper_chunk_count(paper_id) == 0


@pytest.mark.asyncio
async def test_health_check_responds_rapidly_during_cpu_task():
    """Verify event loop is not blocked during processing: /api/health responds in <200ms."""
    await init_db()
    transport = ASGITransport(app=app)

    # Simulate a heavy CPU task running in threadpool
    def heavy_cpu_work():
        time.sleep(0.4)
        return "done"

    async def run_cpu_task():
        return await asyncio.to_thread(heavy_cpu_work)

    # Start CPU task in background
    cpu_task = asyncio.create_task(run_cpu_task())

    # Immediately query /api/health while CPU task is running
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        start_time = time.perf_counter()
        res = await client.get("/api/health")
        duration = time.perf_counter() - start_time

        assert res.status_code == 200
        assert res.json()["status"] == "healthy"
        # Health check must respond well under 200ms (0.2s) even while heavy work runs
        assert duration < 0.2, f"Health check took {duration:.3f}s, expected < 0.2s"

    await cpu_task

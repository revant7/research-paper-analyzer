import pytest
import uuid
import os
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database.database import init_db, AsyncSessionLocal
from app.models.user import User
from app.models.paper import Paper
from app.models.summary import Summary
from app.auth.auth_service import hash_password, create_access_token
from app.rag.summarizer import PaperSummarizer
from app.rag.llm_provider import MockLLMProvider


@pytest.mark.asyncio
async def test_map_reduce_summarizer_long_text():
    llm = MockLLMProvider()
    summarizer = PaperSummarizer(llm)

    # Generate text longer than 12,000 characters
    long_section = "Transformers have revolutionized modern natural language processing by enabling massive parallelism. " * 200
    assert len(long_section) > 15000

    chunks = summarizer._split_into_chunks(long_section, max_chunk_chars=12000)
    assert len(chunks) >= 2

    # Verify summarization handles the long text without crashing or raw truncation
    summary = await summarizer.summarize(long_section, metadata={"title": "Attention Paper", "authors": "Vaswani et al."})
    assert "tldr" in summary
    assert "research_objective" in summary
    assert "methodology" in summary
    assert "key_contributions" in summary
    assert isinstance(summary["key_contributions"], list)


@pytest.mark.asyncio
async def test_summarize_api_lifecycle():
    await init_db()
    transport = ASGITransport(app=app)

    user_id = str(uuid.uuid4())
    paper_completed_id = str(uuid.uuid4())
    paper_pending_id = str(uuid.uuid4())

    dummy_pdf_dir = "tests/test_data"
    os.makedirs(dummy_pdf_dir, exist_ok=True)
    dummy_pdf_path = os.path.join(dummy_pdf_dir, f"{paper_completed_id}.pdf")
    with open(dummy_pdf_path, "wb") as f:
        # Minimal valid PDF header
        f.write(b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF")

    async with AsyncSessionLocal() as db:
        user = User(
            id=user_id,
            name="Summary User",
            email=f"sum_{user_id[:8]}@example.com",
            password_hash=hash_password("password123")
        )
        paper_completed = Paper(
            id=paper_completed_id,
            user_id=user_id,
            title="Long Context Analysis",
            authors="Alice",
            file_name="long.pdf",
            file_path=dummy_pdf_path,
            processing_status="completed",
            summary_status="pending"
        )
        paper_pending = Paper(
            id=paper_pending_id,
            user_id=user_id,
            title="Pending Paper",
            authors="Alice",
            file_name="pending.pdf",
            file_path="dummy/pending.pdf",
            processing_status="processing",
            summary_status="pending"
        )
        db.add_all([user, paper_completed, paper_pending])
        await db.commit()

    token = create_access_token({"sub": user_id})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Summarize pending paper -> 409 Conflict
        res_pending = await client.post(
            f"/api/papers/{paper_pending_id}/summarize",
            headers=headers
        )
        assert res_pending.status_code == 409
        assert "fully processed" in res_pending.json()["detail"]

        # 2. Get summary before generation -> 404
        res_get_404 = await client.get(
            f"/api/papers/{paper_completed_id}/summary",
            headers=headers
        )
        assert res_get_404.status_code == 404

        # 3. Trigger summarize on completed paper -> 202 Accepted
        # Note: In mock/test, BackgroundTasks runs background task
        # Let's mock PDF extraction in background to avoid fitz empty text error on minimal dummy PDF
        from unittest.mock import patch
        with patch("app.rag.pdf_processor.PDFProcessor.extract_text") as mock_extract:
            mock_extract.return_value = {
                "text": "This paper presents attention mechanisms for deep neural networks.",
                "pages": ["This paper presents attention mechanisms for deep neural networks."],
                "page_count": 1,
                "metadata": {}
            }
            res_trigger = await client.post(
                f"/api/papers/{paper_completed_id}/summarize",
                headers=headers
            )
            assert res_trigger.status_code == 202
            assert res_trigger.json()["status"] == "processing"

            # 4. Fetch summary -> should now be completed and return 200 with structured response
            res_get = await client.get(
                f"/api/papers/{paper_completed_id}/summary",
                headers=headers
            )
            assert res_get.status_code == 200
            data = res_get.json()
            assert "tldr" in data
            assert data["tldr"] is not None
            # Check camelCase aliases are accessible
            assert "objective" in data or "research_objective" in data

    # Clean up dummy PDF
    if os.path.exists(dummy_pdf_path):
        os.remove(dummy_pdf_path)

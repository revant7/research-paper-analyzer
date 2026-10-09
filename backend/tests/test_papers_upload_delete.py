import pytest
import uuid
import os
import io
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database.database import init_db, AsyncSessionLocal
from app.models.user import User
from app.models.paper import Paper
from app.models.conversation import Conversation
from app.auth.auth_service import hash_password, create_access_token
from app.config import get_settings
from app.rag.vector_store import get_vector_store

settings = get_settings()


@pytest.mark.asyncio
async def test_paper_upload_validation_and_duplicate():
    await init_db()
    transport = ASGITransport(app=app)
    user_id = str(uuid.uuid4())

    async with AsyncSessionLocal() as db:
        user = User(
            id=user_id,
            name="Upload User",
            email=f"upload_{user_id[:8]}@example.com",
            password_hash=hash_password("password123")
        )
        db.add(user)
        await db.commit()

    token = create_access_token({"sub": user_id})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Non-PDF extension -> 400
        res_ext = await client.post(
            "/api/papers/upload",
            files={"file": ("malicious.exe", b"binary content", "application/octet-stream")},
            headers=headers
        )
        assert res_ext.status_code == 400
        assert "Only PDF files" in res_ext.json()["detail"]

        # 2. Corrupt / fake PDF header (missing %PDF-) -> 400
        res_magic = await client.post(
            "/api/papers/upload",
            files={"file": ("fake.pdf", b"NOT_A_REAL_PDF_HEADER_12345", "application/pdf")},
            headers=headers
        )
        assert res_magic.status_code == 400
        assert "%PDF-" in res_magic.json()["detail"]

        # 3. File exceeding MAX_FILE_SIZE_MB -> 413
        # Monkeypatch MAX_FILE_SIZE_MB to small limit (e.g. 0.001 MB ~ 1KB)
        original_limit = settings.MAX_FILE_SIZE_MB
        try:
            settings.MAX_FILE_SIZE_MB = 0.0005  # ~500 bytes
            big_content = b"%PDF-" + b"0" * 2000
            res_large = await client.post(
                "/api/papers/upload",
                files={"file": ("large.pdf", big_content, "application/pdf")},
                headers=headers
            )
            assert res_large.status_code == 413
            assert "maximum allowed size" in res_large.json()["detail"]
        finally:
            settings.MAX_FILE_SIZE_MB = original_limit

        # 4. Valid upload -> 201 Created
        valid_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        res_valid = await client.post(
            "/api/papers/upload",
            files={"file": ("valid_first.pdf", valid_pdf, "application/pdf")},
            headers=headers
        )
        assert res_valid.status_code == 201
        data1 = res_valid.json()
        paper1_id = data1["id"]
        assert paper1_id is not None
        assert data1["processingStatus"] == "pending"
        assert data1["status"] == "pending"

        # 5. Duplicate upload with same SHA256 -> 409 Conflict
        res_dup = await client.post(
            "/api/papers/upload",
            files={"file": ("valid_second_name.pdf", valid_pdf, "application/pdf")},
            headers=headers
        )
        assert res_dup.status_code == 409
        assert "Duplicate paper" in res_dup.json()["detail"]


@pytest.mark.asyncio
async def test_paper_reprocess_and_delete_flow():
    await init_db()
    transport = ASGITransport(app=app)
    user_id = str(uuid.uuid4())
    paper_id = str(uuid.uuid4())
    conv_id = str(uuid.uuid4())

    user_dir = os.path.join(settings.UPLOAD_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, f"{paper_id}_test.pdf")
    with open(file_path, "wb") as f:
        f.write(b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF")

    # Ingest dummy vector in vector store
    vs = get_vector_store()
    vs.add_documents(
        [{"content": "Quantum test", "metadata": {"page_number": 1}, "embedding": [0.1] * 384}],
        paper_id=paper_id,
        user_id=user_id
    )
    assert vs.get_paper_chunk_count(paper_id) == 1

    async with AsyncSessionLocal() as db:
        user = User(
            id=user_id,
            name="Delete Flow User",
            email=f"del_{user_id[:8]}@example.com",
            password_hash=hash_password("password123")
        )
        paper = Paper(
            id=paper_id,
            user_id=user_id,
            title="Paper to Delete",
            authors="Bob",
            file_name="test.pdf",
            file_path=file_path,
            processing_status="completed",
            sha256="dummy_sha256_for_delete"
        )
        conv = Conversation(
            id=conv_id,
            user_id=user_id,
            paper_id=paper_id,
            title="Chat about paper to delete"
        )
        db.add_all([user, paper, conv])
        await db.commit()

    token = create_access_token({"sub": user_id})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Reprocess endpoint -> 200
        res_reprocess = await client.post(f"/api/papers/{paper_id}/reprocess", headers=headers)
        assert res_reprocess.status_code == 200
        assert res_reprocess.json()["processingStatus"] == "processing"

        # 2. Delete paper -> 204
        res_delete = await client.delete(f"/api/papers/{paper_id}", headers=headers)
        assert res_delete.status_code == 204

        # 3. Check vector store documents removed
        assert vs.get_paper_chunk_count(paper_id) == 0

        # 4. Check file removed from disk
        assert not os.path.exists(file_path)

        # 5. Check conversation paper_id is None and paper_deleted is True
        res_conv = await client.get(f"/api/chat/{conv_id}", headers=headers)
        assert res_conv.status_code == 200
        conv_data = res_conv.json()
        assert conv_data["paper_id"] is None
        assert conv_data["paperDeleted"] is True
        assert conv_data["paperName"] == "Paper deleted"

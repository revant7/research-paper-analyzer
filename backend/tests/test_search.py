import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.database import init_db, AsyncSessionLocal
from app.models.user import User
from app.models.paper import Paper
from app.auth.auth_service import hash_password, create_access_token
from app.rag.vector_store import get_vector_store
from app.rag.embeddings import get_embedding_service


@pytest.mark.asyncio
async def test_semantic_search_user_isolation():
    await init_db()
    transport = ASGITransport(app=app)
    
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())
    paper_a_id = str(uuid.uuid4())
    paper_b_id = str(uuid.uuid4())
    
    async with AsyncSessionLocal() as db:
        user_a = User(
            id=user_a_id,
            name="Alice Researcher",
            email=f"alice_{user_a_id[:8]}@example.com",
            password_hash=hash_password("password123")
        )
        user_b = User(
            id=user_b_id,
            name="Bob Researcher",
            email=f"bob_{user_b_id[:8]}@example.com",
            password_hash=hash_password("password123")
        )
        db.add_all([user_a, user_b])
        await db.commit()

        paper_a = Paper(
            id=paper_a_id,
            user_id=user_a_id,
            title="Quantum Computing Breakthrough",
            authors="Alice et al.",
            file_name="quantum.pdf",
            file_path="dummy/quantum.pdf",
            processing_status="completed"
        )
        paper_b = Paper(
            id=paper_b_id,
            user_id=user_b_id,
            title="Astrophysics Black Holes",
            authors="Bob et al.",
            file_name="astrophysics.pdf",
            file_path="dummy/astrophysics.pdf",
            processing_status="completed"
        )
        db.add_all([paper_a, paper_b])
        await db.commit()

    # Index chunks in vector store
    vector_store = get_vector_store()
    embedding_service = get_embedding_service()
    
    chunk_text = "Superconducting qubits demonstrate fault-tolerant quantum error correction and topological stability."
    chunk_emb = embedding_service.generate_embedding(chunk_text)
    
    vector_store.add_documents(
        documents=[{
            "content": chunk_text,
            "metadata": {"page_number": 1, "paper_id": paper_a_id},
            "embedding": chunk_emb
        }],
        paper_id=paper_a_id,
        user_id=user_a_id
    )

    token_a = create_access_token({"sub": user_a_id})
    token_b = create_access_token({"sub": user_b_id})

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # User A searches for their paper
        res_a = await client.post(
            "/api/search",
            json={"query": "quantum error correction qubits", "limit": 10},
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert res_a.status_code == 200
        data_a = res_a.json()
        assert data_a["total_results"] >= 1
        assert data_a["results"][0]["paper_id"] == paper_a_id
        assert data_a["results"][0]["paper_title"] == "Quantum Computing Breakthrough"

        # User B searches for same content -> 0 results
        res_b = await client.post(
            "/api/search",
            json={"query": "quantum error correction qubits", "limit": 10},
            headers={"Authorization": f"Bearer {token_b}"}
        )
        assert res_b.status_code == 200
        data_b = res_b.json()
        assert data_b["total_results"] == 0
        assert len(data_b["results"]) == 0

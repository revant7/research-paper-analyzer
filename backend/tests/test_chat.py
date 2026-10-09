import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.database import init_db, AsyncSessionLocal
from app.models.user import User
from app.models.paper import Paper
from app.models.conversation import Conversation
from app.auth.auth_service import hash_password, create_access_token


@pytest.mark.asyncio
async def test_chat_two_turn_and_validation():
    await init_db()
    transport = ASGITransport(app=app)
    
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())
    paper_completed_id = str(uuid.uuid4())
    paper_pending_id = str(uuid.uuid4())

    async with AsyncSessionLocal() as db:
        user_a = User(
            id=user_a_id,
            name="Alice Chat",
            email=f"alice_{user_a_id[:8]}@example.com",
            password_hash=hash_password("password123")
        )
        user_b = User(
            id=user_b_id,
            name="Bob Chat",
            email=f"bob_{user_b_id[:8]}@example.com",
            password_hash=hash_password("password123")
        )
        db.add_all([user_a, user_b])
        await db.commit()

        # Paper completed for user A
        paper_completed = Paper(
            id=paper_completed_id,
            user_id=user_a_id,
            title="Transformer Scaling Laws",
            authors="Alice",
            file_name="scaling.pdf",
            file_path="dummy/scaling.pdf",
            processing_status="completed"
        )
        # Paper pending for user A
        paper_pending = Paper(
            id=paper_pending_id,
            user_id=user_a_id,
            title="Pending Paper",
            authors="Alice",
            file_name="pending.pdf",
            file_path="dummy/pending.pdf",
            processing_status="processing"
        )
        db.add_all([paper_completed, paper_pending])
        await db.commit()

    token_a = create_access_token({"sub": user_a_id})
    token_b = create_access_token({"sub": user_b_id})
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Foreign paper_id -> 404
        res_foreign = await client.post(
            "/api/chat",
            json={"message": "Summarize this paper", "paper_id": paper_completed_id},
            headers=headers_b
        )
        assert res_foreign.status_code == 404

        # 2. Paper still processing -> 409
        res_pending = await client.post(
            "/api/chat",
            json={"message": "Summarize this paper", "paper_id": paper_pending_id},
            headers=headers_a
        )
        assert res_pending.status_code == 409
        assert "still processing" in res_pending.json()["detail"]

        # 3. Valid first turn for User A -> 200 with new conversation_id
        res_turn1 = await client.post(
            "/api/chat",
            json={"message": "What is the primary contribution?", "paper_id": paper_completed_id},
            headers=headers_a
        )
        assert res_turn1.status_code == 200
        data1 = res_turn1.json()
        conv_id = data1["conversation_id"]
        assert conv_id is not None
        assert data1["message"]["role"] == "assistant"

        # 4. Valid second turn with same conversation_id -> 200 with matching conversation_id
        res_turn2 = await client.post(
            "/api/chat",
            json={"message": "What about its limitations?", "conversation_id": conv_id},
            headers=headers_a
        )
        assert res_turn2.status_code == 200
        data2 = res_turn2.json()
        assert data2["conversation_id"] == conv_id

        # 5. List conversations -> returns conversation with message count = 4 (2 user + 2 assistant)
        res_list = await client.get("/api/chat/conversations", headers=headers_a)
        assert res_list.status_code == 200
        convs = res_list.json()
        assert len(convs) >= 1
        matched = [c for c in convs if c["id"] == conv_id]
        assert len(matched) == 1
        assert matched[0]["message_count"] == 4

        # 6. Delete paper -> Next turn for conversation should return 409
        from sqlalchemy import update
        async with AsyncSessionLocal() as db:
            paper_to_del = await db.get(Paper, paper_completed_id)
            if paper_to_del:
                await db.execute(
                    update(Conversation)
                    .where(Conversation.id == conv_id)
                    .values(paper_deleted=True, paper_id=None)
                )
                await db.delete(paper_to_del)
                await db.commit()

        res_deleted_paper = await client.post(
            "/api/chat",
            json={"message": "Can you still tell me about the paper?", "conversation_id": conv_id},
            headers=headers_a
        )
        assert res_deleted_paper.status_code == 409
        assert "deleted" in res_deleted_paper.json()["detail"].lower()


@pytest.mark.asyncio
async def test_chat_llm_failure_returns_502(monkeypatch):
    await init_db()
    transport = ASGITransport(app=app)
    user_id = str(uuid.uuid4())
    paper_id = str(uuid.uuid4())

    async with AsyncSessionLocal() as db:
        user = User(
            id=user_id,
            name="Charlie LLM",
            email=f"charlie_{user_id[:8]}@example.com",
            password_hash=hash_password("password123")
        )
        paper = Paper(
            id=paper_id,
            user_id=user_id,
            title="AI Safety Paper",
            authors="Charlie",
            file_name="safety.pdf",
            file_path="dummy/safety.pdf",
            processing_status="completed"
        )
        db.add_all([user, paper])
        await db.commit()

    token = create_access_token({"sub": user_id})
    headers = {"Authorization": f"Bearer {token}"}

    # Monkeypatch RAGGenerator.generate_answer to raise an exception
    from app.rag.generator import RAGGenerator
    async def mock_fail_generate(*args, **kwargs):
        raise RuntimeError("OpenAI API connection timeout")

    monkeypatch.setattr(RAGGenerator, "generate_answer", mock_fail_generate)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/chat",
            json={"message": "Fail please", "paper_id": paper_id},
            headers=headers
        )
        assert res.status_code == 502
        assert "unavailable" in res.json()["detail"].lower()

        # Verify no assistant message was saved
        conv_res = await client.get("/api/chat/conversations", headers=headers)
        assert conv_res.status_code == 200
        convs = conv_res.json()
        assert len(convs) == 1
        conv_id = convs[0]["id"]

        detail_res = await client.get(f"/api/chat/{conv_id}", headers=headers)
        assert detail_res.status_code == 200
        msgs = detail_res.json()["messages"]
        # Only the user message was saved, no assistant message
        assert len(msgs) == 1
        assert msgs[0]["role"] == "user"

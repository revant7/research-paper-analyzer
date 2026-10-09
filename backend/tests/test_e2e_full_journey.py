import os
import io
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import get_settings

settings = get_settings()

def create_valid_dummy_pdf(seed: str = "unique") -> bytes:
    """Generate a minimal valid PDF with recognizable text."""
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj\n"
        b"<< /Type /Catalog /Pages 2 0 R >>\n"
        b"endobj\n"
        b"2 0 obj\n"
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n"
        b"endobj\n"
        b"3 0 obj\n"
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\n"
        b"endobj\n"
        b"4 0 obj\n"
        b"<< /Length 180 >>\n"
        b"stream\n"
        b"BT\n"
        b"/F1 12 Tf\n"
        b"100 700 Td\n"
        + f"(Attention mechanisms {seed} have become an integral part of sequence modeling.) Tj\n".encode("utf-8") +
        b"ET\n"
        b"endstream\n"
        b"endobj\n"
        b"xref\n"
        b"0 5\n"
        b"0000000000 65535 f\n"
        b"0000000009 00000 n\n"
        b"0000000058 00000 n\n"
        b"0000000115 00000 n\n"
        b"0000000206 00000 n\n"
        b"trailer\n"
        b"<< /Size 5 /Root 1 0 R >>\n"
        b"startxref\n"
        b"410\n"
        b"%%EOF\n"
    )
    return pdf_content


@pytest.mark.asyncio
async def test_full_user_journey_end_to_end():
    """
    Test complete user journey:
    Register -> Login -> Upload PDF -> Process -> Summary -> Search -> Chat -> Stats -> Delete.
    """
    import uuid
    unique_suffix = uuid.uuid4().hex[:8]
    test_email = f"Alan.Turing.{unique_suffix}@Example.org"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register User
        reg_payload = {
            "name": "Dr. Alan Turing",
            "email": test_email,
            "password": "SecurePassword123!"
        }
        reg_resp = await client.post("/api/auth/register", json=reg_payload)
        assert reg_resp.status_code == 201, reg_resp.text
        token = reg_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Verify Profile (/api/auth/me)
        me_resp = await client.get("/api/auth/me", headers=headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == test_email.strip().lower() # normalized

        # 3. Upload Valid PDF
        pdf_bytes = create_valid_dummy_pdf(unique_suffix)
        files = {"file": (f"attention_mechanism_study_{unique_suffix}.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        upload_resp = await client.post("/api/papers/upload", headers=headers, files=files)
        assert upload_resp.status_code == 201, upload_resp.text
        paper_data = upload_resp.json()
        paper_id = paper_data["id"]
        assert (paper_data.get("fileName") or paper_data.get("file_name")) == f"attention_mechanism_study_{unique_suffix}.pdf"

        # 4. Check Paper Detail (/api/papers/{id})
        paper_detail_resp = await client.get(f"/api/papers/{paper_id}", headers=headers)
        assert paper_detail_resp.status_code == 200
        assert paper_detail_resp.json()["id"] == paper_id

        # 5. Fetch PDF Stream (/api/papers/{id}/pdf)
        pdf_stream_resp = await client.get(f"/api/papers/{paper_id}/pdf", headers=headers)
        assert pdf_stream_resp.status_code == 200
        assert pdf_stream_resp.headers["content-type"] == "application/pdf"
        assert len(pdf_stream_resp.content) > 0

        # Mark paper completed so we can test summaries and chat
        from app.database.database import AsyncSessionLocal
        from app.models.paper import Paper
        from sqlalchemy import select
        async with AsyncSessionLocal() as db:
            p = (await db.execute(select(Paper).where(Paper.id == paper_id))).scalar_one()
            p.processing_status = "completed"
            await db.commit()

        # 6. Request Summary Generation (/api/papers/{id}/summarize)
        sum_gen_resp = await client.post(f"/api/papers/{paper_id}/summarize", headers=headers, json={"force_regenerate": True})
        assert sum_gen_resp.status_code in [200, 202], sum_gen_resp.text

        # 7. Semantic Search (/api/search)
        search_payload = {
            "query": "sequence modeling with attention",
            "paper_ids": [paper_id],
            "limit": 5
        }
        search_resp = await client.post("/api/search", headers=headers, json=search_payload)
        assert search_resp.status_code == 200, search_resp.text
        search_data = search_resp.json()
        assert "results" in search_data
        assert "total_results" in search_data

        # 8. Chat with Paper (/api/chat)
        chat_payload = {
            "message": "What is the main finding regarding attention mechanisms?",
            "paper_id": paper_id
        }
        chat_resp = await client.post("/api/chat", headers=headers, json=chat_payload)
        assert chat_resp.status_code == 200, chat_resp.text
        chat_data = chat_resp.json()
        assert "conversation_id" in chat_data
        conv_id = chat_data["conversation_id"]
        assert chat_data["message"]["role"] == "assistant"
        assert len(chat_data["message"]["content"]) > 0

        # 9. Dashboard Stats (/api/dashboard/stats)
        stats_resp = await client.get("/api/dashboard/stats", headers=headers)
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        assert stats["total_papers"] >= 1
        assert stats["total_conversations"] >= 1
        assert stats["total_searches"] >= 1

        # 10. Delete Paper (/api/papers/{id})
        del_resp = await client.delete(f"/api/papers/{paper_id}", headers=headers)
        assert del_resp.status_code == 204

        # 11. Verify paper is gone and chat returns 409
        follow_up_chat = await client.post("/api/chat", headers=headers, json={
            "message": "Follow up question",
            "conversation_id": conv_id
        })
        assert follow_up_chat.status_code == 409

        # 12. Delete Account (/api/auth/account)
        del_acc_resp = await client.delete("/api/auth/account", headers=headers)
        assert del_acc_resp.status_code == 200

import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.database import init_db, AsyncSessionLocal
from app.models.user import User
from app.auth.auth_service import hash_password, create_access_token


@pytest.mark.asyncio
async def test_route_slash_consistency():
    await init_db()
    transport = ASGITransport(app=app)
    user_id = str(uuid.uuid4())

    async with AsyncSessionLocal() as db:
        user = User(
            id=user_id,
            name="Route Tester",
            email=f"tester_{user_id[:8]}@example.com",
            password_hash=hash_password("password123")
        )
        db.add(user)
        await db.commit()

    token = create_access_token({"sub": user_id})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/papers without trailing slash -> 200 (not 307 or 404)
        res_papers = await client.get("/api/papers", headers=headers)
        assert res_papers.status_code == 200

        # POST /api/search without trailing slash -> 200
        res_search = await client.post("/api/search", json={"query": "test query"}, headers=headers)
        assert res_search.status_code == 200

        # GET /api/chat/conversations without trailing slash -> 200
        res_convos = await client.get("/api/chat/conversations", headers=headers)
        assert res_convos.status_code == 200

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.database import init_db


@pytest.mark.asyncio
async def test_health_endpoint():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        assert "llm_provider" in data
        assert "version" in data

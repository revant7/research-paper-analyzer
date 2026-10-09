import pytest
import uuid
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database.database import init_db, AsyncSessionLocal
from app.models.user import User
from app.models.paper import Paper
from app.auth.rate_limiter import InMemoryRateLimiter
from app.api.auth import auth_limiter


@pytest.mark.asyncio
async def test_auth_email_normalization_and_duplicate():
    await init_db()
    auth_limiter.reset()
    transport = ASGITransport(app=app)
    unique_suffix = str(uuid.uuid4())[:8]

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register with mixed-case and spaces
        res_reg = await client.post(
            "/api/auth/register",
            json={
                "name": "  Dave Norman  ",
                "email": f"  Dave.{unique_suffix}@EXAMPLE.Com  ",
                "password": "Password123!"
            }
        )
        assert res_reg.status_code == 201
        data = res_reg.json()
        assert data["user"]["email"] == f"dave.{unique_suffix}@example.com"
        assert data["user"]["name"] == "Dave Norman"

        # 2. Login with uppercase variant
        res_login = await client.post(
            "/api/auth/login",
            json={
                "email": f"DAVE.{unique_suffix}@example.com",
                "password": "Password123!"
            }
        )
        assert res_login.status_code == 200
        assert "access_token" in res_login.json()

        # 3. Duplicate register with different case -> 409 Conflict
        res_dup = await client.post(
            "/api/auth/register",
            json={
                "name": "Dave Clone",
                "email": f"dave.{unique_suffix}@EXAMPLE.com",
                "password": "Password123!"
            }
        )
        assert res_dup.status_code == 409


@pytest.mark.asyncio
async def test_auth_change_password_and_delete_account():
    await init_db()
    auth_limiter.reset()
    transport = ASGITransport(app=app)
    unique_suffix = str(uuid.uuid4())[:8]
    email = f"pass_{unique_suffix}@example.com"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register
        res_reg = await client.post(
            "/api/auth/register",
            json={"name": "Password User", "email": email, "password": "OldPassword123!"}
        )
        assert res_reg.status_code == 201
        token = res_reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Change password with wrong old password -> 400
        res_wrong = await client.post(
            "/api/auth/change-password",
            json={"old_password": "WrongPassword!", "new_password": "NewPassword123!"},
            headers=headers
        )
        assert res_wrong.status_code == 400

        # Change password successfully -> 200
        res_change = await client.post(
            "/api/auth/change-password",
            json={"old_password": "OldPassword123!", "new_password": "NewPassword123!"},
            headers=headers
        )
        assert res_change.status_code == 200

        # Old password fails login
        res_old_login = await client.post(
            "/api/auth/login",
            json={"email": email, "password": "OldPassword123!"}
        )
        assert res_old_login.status_code == 401

        # New password succeeds login
        res_new_login = await client.post(
            "/api/auth/login",
            json={"email": email, "password": "NewPassword123!"}
        )
        assert res_new_login.status_code == 200

        # Delete account -> 200
        res_del = await client.delete("/api/auth/account", headers=headers)
        assert res_del.status_code == 200

        # Account is gone -> login fails
        res_post_del = await client.post(
            "/api/auth/login",
            json={"email": email, "password": "NewPassword123!"}
        )
        assert res_post_del.status_code == 401


@pytest.mark.asyncio
async def test_auth_rate_limiting():
    await init_db()
    # Create limiter with 3 requests max per window for test
    limiter = InMemoryRateLimiter(times=3, seconds=60)
    transport = ASGITransport(app=app)

    # Temporarily override auth_limiter times
    original_times = auth_limiter.times
    auth_limiter.times = 3
    auth_limiter.reset()

    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 3 requests succeed (or fail authentication, but don't rate limit)
            for _ in range(3):
                res = await client.post("/api/auth/login", json={"email": "none@ex.com", "password": "wrong"})
                assert res.status_code in (401, 200)

            # 4th request must be 429
            res_blocked = await client.post("/api/auth/login", json={"email": "none@ex.com", "password": "wrong"})
            assert res_blocked.status_code == 429
            assert "Too many requests" in res_blocked.json()["detail"]
            assert "Retry-After" in res_blocked.headers

    finally:
        auth_limiter.times = original_times
        auth_limiter.reset()

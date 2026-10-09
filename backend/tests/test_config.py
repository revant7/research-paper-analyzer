import pytest
from app.config import Settings, LLMProvider


def test_production_rejects_placeholder_secret():
    with pytest.raises(ValueError, match="JWT_SECRET_KEY must be at least 32 characters"):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="sqlite+aiosqlite:///./test.db",
            JWT_SECRET_KEY="your-secret-key-change-in-production",
            LLM_PROVIDER=LLMProvider.openai,
            OPENAI_API_KEY="sk-valid-key",
            _env_file=None,
        )


def test_production_rejects_short_secret():
    with pytest.raises(ValueError, match="JWT_SECRET_KEY must be at least 32 characters"):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="sqlite+aiosqlite:///./test.db",
            JWT_SECRET_KEY="short-secret-key-12345",
            LLM_PROVIDER=LLMProvider.openai,
            OPENAI_API_KEY="sk-valid-key",
            _env_file=None,
        )


def test_production_rejects_mock_llm():
    with pytest.raises(ValueError, match="LLM_PROVIDER cannot be 'mock' in production"):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="sqlite+aiosqlite:///./test.db",
            JWT_SECRET_KEY="a" * 64,
            LLM_PROVIDER=LLMProvider.mock,
            _env_file=None,
        )


def test_production_requires_openai_key():
    with pytest.raises(ValueError, match="OPENAI_API_KEY is required"):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="sqlite+aiosqlite:///./test.db",
            JWT_SECRET_KEY="a" * 64,
            LLM_PROVIDER=LLMProvider.openai,
            OPENAI_API_KEY="",
            _env_file=None,
        )


def test_production_valid_configuration():
    s = Settings(
        ENVIRONMENT="production",
        DATABASE_URL="sqlite+aiosqlite:///./test.db",
        JWT_SECRET_KEY="a" * 64,
        LLM_PROVIDER=LLMProvider.openai,
        OPENAI_API_KEY="sk-test-real-key-123",
        _env_file=None,
    )
    assert s.ENVIRONMENT == "production"
    assert len(s.JWT_SECRET_KEY) == 64

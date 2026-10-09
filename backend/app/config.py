from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from enum import Enum
from typing import Set


class LLMProvider(str, Enum):
    openai = "openai"
    huggingface = "huggingface"
    mock = "mock"


KNOWN_INSECURE_SECRETS: Set[str] = {
    "your-secret-key-change-in-production",
    "secret",
    "changeme",
    "dev-secret-key-change-in-production-abc123xyz",
    "12345678901234567890123456789012",
}


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str
    
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440
    
    LLM_PROVIDER: LLMProvider = LLMProvider.mock
    LLM_MODEL: str = ""
    LLM_TIMEOUT_SECONDS: int = 60
    OPENAI_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""
    
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RESULTS: int = 5
    SIMILARITY_THRESHOLD: float = 0.3
    LLM_TEMPERATURE: float = 0.7
    
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50
    
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    @model_validator(mode="after")
    def validate_production_security(self):
        env = (self.ENVIRONMENT or "").strip().lower()
        if env == "production":
            secret = self.JWT_SECRET_KEY or ""
            if len(secret) < 32 or secret in KNOWN_INSECURE_SECRETS:
                raise ValueError(
                    "Security violation: JWT_SECRET_KEY must be at least 32 characters "
                    "and not a known placeholder in production."
                )
            if self.LLM_PROVIDER == LLMProvider.mock:
                raise ValueError("Security violation: LLM_PROVIDER cannot be 'mock' in production.")
            if self.LLM_PROVIDER == LLMProvider.openai and not self.OPENAI_API_KEY.strip():
                raise ValueError("Configuration error: OPENAI_API_KEY is required when LLM_PROVIDER is 'openai'.")
            if self.LLM_PROVIDER == LLMProvider.huggingface and not self.HUGGINGFACE_API_KEY.strip():
                raise ValueError("Configuration error: HUGGINGFACE_API_KEY is required when LLM_PROVIDER is 'huggingface'.")
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()

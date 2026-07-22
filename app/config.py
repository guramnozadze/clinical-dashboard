from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/clinical_trials"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    log_level: str = "INFO"
    # Optional bootstrap user, created at startup when both values are set.
    seed_username: str | None = None
    seed_password: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()

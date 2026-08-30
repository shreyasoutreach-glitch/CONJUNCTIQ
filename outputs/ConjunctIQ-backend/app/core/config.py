from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="CONJUNCTIQ_")
    database_url: str = "sqlite:///./conjunctiq.db"
    llm_provider: str = "mock"
    llm_api_key: str | None = None


settings = Settings()

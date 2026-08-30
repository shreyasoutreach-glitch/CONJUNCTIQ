from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="CONJUNCTIQ_")

    # Database
    database_url: str = "sqlite:///./conjunctiq.db"

    # AI provider: "mock" | "granite" | "openai_compatible"
    llm_provider: str = "mock"
    llm_api_key: str | None = None

    # IBM Watsonx / Granite
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_project_id: str | None = None
    watsonx_model_id: str = "ibm/granite-3-8b-instruct"

    # OpenAI-compatible (optional)
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"

    # NASA/JPL CNEOS integration
    nasa_api_key: str = "DEMO_KEY"         # public DEMO_KEY works for low-volume
    cneos_enabled: bool = True             # set to false to skip live NASA data
    cneos_cache_ttl_s: int = 3600          # cache NASA responses for 1 hour


settings = Settings()

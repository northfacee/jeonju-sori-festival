from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"

    langsmith_tracing: bool = False
    langsmith_api_key: str = ""
    langsmith_project: str = "jeonju-sori-festival"


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    anthropic_api_key: str
    nextauth_secret: str
    database_url: str = "sqlite:///./reddington.db"
    daily_message_limit: int = 20
    frontend_url: str = "http://localhost:3000"
    admin_email: str = "waseekirtefa@gmail.com"


settings = Settings()  # type: ignore[call-arg]

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "DClaw Network"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dclaw_network"
    cors_origins: str = "*"

    class Config:
        env_prefix = "NETWORK_"

settings = Settings()

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "PulseSupply Analytics & Report Engine"
    app_version: str = "1.0.0"
    environment: str = os.getenv("PYTHON_ENV", "production")
    port: int = int(os.getenv("PORT", "8000"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # Database
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://pulsegateway:pulsesupply_secure_pass_2026@postgres-db:5432/pulsesupply_db"
    )

    # Redis
    redis_url: str = os.getenv(
        "REDIS_URL",
        "redis://:pulsesupply_redis_auth_2026@redis:6379/0"
    )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

